// Cost-aware Pi model and reasoning mapping for the resolved itsol-execution-policy.
import fs from "node:fs";
import path from "node:path";
import {
  clampThinkingLevel,
  getSupportedThinkingLevels,
  type Api,
  type Model,
  type ModelThinkingLevel,
} from "@earendil-works/pi-ai";
import {
  CONFIG_DIR_NAME,
  getAgentDir,
  withFileMutationQueue,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { agentCanWrite, type ItsolAgentConfig } from "./agents.ts";
import type { DelegatedTask, ExecutionPolicy } from "./policy.ts";

export type AgentRole = "explore" | "plan" | "implement" | "review";
export type RoutedThinkingLevel = ModelThinkingLevel;
type ModelProfile = ExecutionPolicy["model_profile"];

interface ModelRoute {
  model?: string;
  thinking?: RoutedThinkingLevel;
}

type RoleRoutes = Partial<Record<AgentRole | "default", ModelRoute>>;

interface ModelRouterConfig {
  modelProfiles?: Partial<Record<ModelProfile, RoleRoutes>>;
}

export interface ModelResolution {
  model?: string;
  role: AgentRole;
  source: "task" | "profile" | "inherited" | "default";
  profileEnforced: boolean;
  thinking: RoutedThinkingLevel;
  thinkingSource: "profile" | "policy" | "model-clamp" | "policy-clamp";
}

const PROFILES = ["economy", "balanced", "frontier"] as const;
const ROLES = ["default", "explore", "plan", "implement", "review"] as const;
const THINKING_LEVELS: readonly RoutedThinkingLevel[] = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
];
const THINKING_RANK: Record<RoutedThinkingLevel, number> = {
  off: 0,
  minimal: 1,
  low: 2,
  medium: 3,
  high: 4,
  xhigh: 5,
  max: 6,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isModel(value: unknown): value is string {
  return typeof value === "string" && /^[^/]+\/.+$/.test(value);
}

function isThinking(value: unknown): value is RoutedThinkingLevel {
  return typeof value === "string" && (THINKING_LEVELS as readonly string[]).includes(value);
}

function parseRoute(value: unknown): ModelRoute | undefined {
  // Backwards compatibility with the original "role": "provider/model" format.
  if (isModel(value)) return { model: value };
  if (!isRecord(value)) return undefined;
  const route: ModelRoute = {};
  if (isModel(value.model)) route.model = value.model;
  if (isThinking(value.thinking)) route.thinking = value.thinking;
  return route.model || route.thinking ? route : undefined;
}

function parseConfig(filePath: string): ModelRouterConfig {
  if (!fs.existsSync(filePath)) return {};
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown;
  if (!isRecord(parsed) || !isRecord(parsed.modelProfiles)) return {};
  const modelProfiles: ModelRouterConfig["modelProfiles"] = {};
  for (const profile of PROFILES) {
    const rawProfile = parsed.modelProfiles[profile];
    if (!isRecord(rawProfile)) continue;
    const values: RoleRoutes = {};
    for (const role of ROLES) {
      const route = parseRoute(rawProfile[role]);
      if (route) values[role] = route;
    }
    modelProfiles[profile] = values;
  }
  return { modelProfiles };
}

function mergeConfig(base: ModelRouterConfig, override: ModelRouterConfig): ModelRouterConfig {
  const modelProfiles: ModelRouterConfig["modelProfiles"] = {};
  for (const profile of PROFILES) {
    const routes: RoleRoutes = {};
    for (const role of ROLES) {
      const baseRoute = base.modelProfiles?.[profile]?.[role];
      const overrideRoute = override.modelProfiles?.[profile]?.[role];
      const merged = { ...(baseRoute ?? {}), ...(overrideRoute ?? {}) };
      if (merged.model || merged.thinking) routes[role] = merged;
    }
    modelProfiles[profile] = routes;
  }
  return { modelProfiles };
}

export function supportedThinkingLevels(model: Model<Api>): RoutedThinkingLevel[] {
  return [...getSupportedThinkingLevels(model)];
}

export function classifyAgentRole(agent: ItsolAgentConfig): AgentRole {
  if (agentCanWrite(agent)) return "implement";
  if (/(review|security|quality|qa|self-review)/.test(agent.name)) return "review";
  if (/(plan|planning|requirements|workflow-mode|execution-policy|task-intake)/.test(agent.name)) return "plan";
  return "explore";
}

export class ModelRouter {
  private config: ModelRouterConfig = {};
  private globalPath = path.join(getAgentDir(), "itsolpowers.json");
  private projectPath?: string;
  private context?: ExtensionContext;
  private errors: string[] = [];

  startSession(ctx: ExtensionContext): void {
    this.context = ctx;
    this.reload(ctx);
  }

  reload(ctx = this.context): void {
    this.errors = [];
    const load = (filePath: string): ModelRouterConfig => {
      try {
        return parseConfig(filePath);
      } catch (error) {
        this.errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        return {};
      }
    };
    const globalConfig = load(this.globalPath);
    this.projectPath = ctx ? path.join(ctx.cwd, CONFIG_DIR_NAME, "itsolpowers.json") : undefined;
    const projectConfig = ctx?.isProjectTrusted() && this.projectPath ? load(this.projectPath) : {};
    this.config = mergeConfig(globalConfig, projectConfig);
  }

  resolve(
    task: DelegatedTask,
    agent: ItsolAgentConfig,
    policy: ExecutionPolicy,
    inheritedModel: string | undefined,
    ctx: ExtensionContext,
  ): ModelResolution {
    const role = agentCanWrite(agent) ? "implement" : (task.role ?? classifyAgentRole(agent));
    const profileRoutes = this.config.modelProfiles?.[policy.model_profile] ?? {};
    const roleRoute = profileRoutes[role] ?? {};
    const defaultRoute = profileRoutes.default ?? {};
    const mappedModel = roleRoute.model ?? defaultRoute.model;
    const mappedThinking = roleRoute.thinking ?? defaultRoute.thinking;
    const policyThinking = policy.reasoning_profile;
    const selected = task.model ?? mappedModel ?? inheritedModel;
    const selectedModel = selected ? this.getAvailableModel(selected, ctx) : undefined;

    let thinking: RoutedThinkingLevel = mappedThinking ?? policyThinking;
    let thinkingSource: ModelResolution["thinkingSource"] = mappedThinking ? "profile" : "policy";
    if (selectedModel) {
      const modelClamped = clampThinkingLevel(selectedModel, thinking);
      if (modelClamped !== thinking) thinkingSource = "model-clamp";
      thinking = modelClamped;
    }
    if (THINKING_RANK[thinking] > THINKING_RANK[policyThinking]) {
      if (selectedModel) {
        const allowed = supportedThinkingLevels(selectedModel)
          .filter((level) => THINKING_RANK[level] <= THINKING_RANK[policyThinking]);
        thinking = allowed.at(-1) ?? "off";
      } else {
        thinking = policyThinking;
      }
      thinkingSource = mappedThinking && THINKING_RANK[mappedThinking] > THINKING_RANK[policyThinking]
        ? "policy-clamp"
        : "model-clamp";
    }

    const modelResult = task.model
      ? {
          model: task.model,
          source: "task" as const,
          profileEnforced: Boolean(mappedModel && task.model === mappedModel),
        }
      : mappedModel
        ? { model: mappedModel, source: "profile" as const, profileEnforced: true }
        : inheritedModel
          ? { model: inheritedModel, source: "inherited" as const, profileEnforced: false }
          : { source: "default" as const, profileEnforced: false };

    return {
      ...modelResult,
      role,
      thinking,
      thinkingSource,
    };
  }

  formatSummary(): string {
    const lines = [
      `Global config: ${this.globalPath}${fs.existsSync(this.globalPath) ? "" : " (not found)"}`,
      `Project config: ${this.projectPath ?? "unavailable"}${this.projectPath && !fs.existsSync(this.projectPath) ? " (not found)" : ""}`,
    ];
    for (const profile of PROFILES) {
      const entries = Object.entries(this.config.modelProfiles?.[profile] ?? {});
      lines.push(`${profile}: ${entries.length
        ? entries.map(([role, route]) => `${role}=${route.model ?? "inherit"}@${route.thinking ?? "policy"}`).join(", ")
        : "inherit"}`);
    }
    if (this.errors.length) lines.push(`Errors: ${this.errors.join("; ")}`);
    return lines.join("\n");
  }

  async configureInteractive(ctx: ExtensionContext): Promise<boolean> {
    if (!ctx.hasUI) throw new Error("Interactive model configuration requires TUI or RPC mode");

    const targets = new Map<string, string>();
    if (ctx.isProjectTrusted()) {
      const projectPath = path.join(ctx.cwd, CONFIG_DIR_NAME, "itsolpowers.json");
      targets.set(`Project · ${projectPath}`, projectPath);
    }
    targets.set(`Global · ${this.globalPath}`, this.globalPath);
    const scope = await ctx.ui.select("Configure ITSOL model routing", [...targets.keys()]);
    if (!scope) return false;
    const targetPath = targets.get(scope)!;

    const selectedProfile = await ctx.ui.select("Model profile", [...PROFILES]);
    if (!selectedProfile) return false;
    const profile = selectedProfile as ModelProfile;
    const staged = new Map<AgentRole | "default", ModelRoute | undefined>();

    while (true) {
      const roleChoices = staged.size
        ? [...ROLES, "Save and finish", "Cancel without saving"]
        : [...ROLES, "Cancel without saving"];
      const selectedRole = await ctx.ui.select("Role to configure", roleChoices);
      if (!selectedRole || selectedRole === "Cancel without saving") return false;
      if (selectedRole === "Save and finish") break;
      const role = selectedRole as AgentRole | "default";

      const modelAction = await ctx.ui.select(`${profile}.${role} model`, [
        "Choose available model",
        "Inherit model",
        "Remove entire role mapping",
      ]);
      if (!modelAction) return false;
      if (modelAction === "Remove entire role mapping") {
        staged.set(role, undefined);
      } else {
        let selectedModel: { id: string; model: Model<Api> } | undefined;
        if (modelAction === "Choose available model") selectedModel = await this.selectAvailableModel(ctx);
        if (modelAction === "Choose available model" && !selectedModel) return false;

        const reasoningModel = selectedModel?.model ?? this.getInheritedWizardModel(profile, role, staged, ctx);
        const inheritReasoning = "Inherit policy reasoning";
        const supported = reasoningModel ? supportedThinkingLevels(reasoningModel) : [];
        const reasoning = await ctx.ui.select(
          `${profile}.${role} reasoning${reasoningModel ? ` · ${reasoningModel.provider}/${reasoningModel.id}` : ""}`,
          [inheritReasoning, ...supported],
        );
        if (!reasoning) return false;
        const thinking = reasoning === inheritReasoning ? undefined : reasoning as RoutedThinkingLevel;
        const model = selectedModel?.id;
        staged.set(role, model || thinking ? { model, thinking } : undefined);
      }

      const next = await ctx.ui.select("Next step", [
        "Configure another role",
        "Save and finish",
        "Cancel without saving",
      ]);
      if (!next || next === "Cancel without saving") return false;
      if (next === "Save and finish") break;
    }

    if (!staged.size) return false;
    const changes = [...staged.entries()].map(([role, route]) => route
      ? `${profile}.${role} = ${route.model ?? "inherit"} @ ${route.thinking ?? "policy reasoning"}`
      : `${profile}.${role} = removed`);
    const confirmed = await ctx.ui.confirm(
      "Save ITSOL model routing?",
      `${changes.join("\n")}\n\n${targetPath}`,
    );
    if (!confirmed) return false;

    await this.writeMappings(targetPath, profile, staged);
    this.reload(ctx);
    ctx.ui.notify(`${changes.join("\n")}\nSaved to ${targetPath}`, "info");
    return true;
  }

  formatPromptContext(): string {
    return [
      "## ITSOL Pi model routing",
      "Model precedence for delegated tasks: explicit task.model, configured profile+role mapping, inherited main model, Pi default.",
      "Reasoning precedence: configured profile+role thinking, then execution policy reasoning. Configured reasoning may tighten but never exceed the resolved execution-policy reasoning ceiling; higher mappings are clamped.",
      "Configured mappings:",
      this.formatSummary(),
    ].join("\n");
  }

  private async selectAvailableModel(
    ctx: ExtensionContext,
  ): Promise<{ id: string; model: Model<Api> } | undefined> {
    const available = ctx.modelRegistry.getAvailable();
    if (!available.length) throw new Error("No authenticated Pi models are available. Configure a provider first.");
    const providers = [...new Set(available.map((model) => model.provider))].sort();
    const provider = await ctx.ui.select("Provider", providers);
    if (!provider) return undefined;
    const providerModels = available
      .filter((model) => model.provider === provider)
      .sort((left, right) => left.id.localeCompare(right.id));
    const labels = providerModels.map((model) => model.name && model.name !== model.id
      ? `${model.id} — ${model.name}`
      : model.id);
    const selectedLabel = await ctx.ui.select("Model", labels);
    if (!selectedLabel) return undefined;
    const selected = providerModels[labels.indexOf(selectedLabel)];
    return { id: `${provider}/${selected.id}`, model: selected };
  }

  private getInheritedWizardModel(
    profile: ModelProfile,
    role: AgentRole | "default",
    staged: Map<AgentRole | "default", ModelRoute | undefined>,
    ctx: ExtensionContext,
  ): Model<Api> | undefined {
    let configuredModel: string | undefined;
    if (role !== "default") {
      configuredModel = staged.has("default")
        ? staged.get("default")?.model
        : this.config.modelProfiles?.[profile]?.default?.model;
    }
    const inherited = configuredModel ?? (ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined);
    if (!inherited) return undefined;
    const separator = inherited.indexOf("/");
    return ctx.modelRegistry.find(inherited.slice(0, separator), inherited.slice(separator + 1));
  }

  private async writeMappings(
    targetPath: string,
    profile: ModelProfile,
    staged: Map<AgentRole | "default", ModelRoute | undefined>,
  ): Promise<void> {
    await withFileMutationQueue(targetPath, async () => {
      let raw: Record<string, unknown> = {};
      if (fs.existsSync(targetPath)) {
        const parsed = JSON.parse(await fs.promises.readFile(targetPath, "utf8")) as unknown;
        if (!isRecord(parsed)) throw new Error(`ITSOL model config must contain a JSON object: ${targetPath}`);
        raw = parsed;
      }
      const profiles = isRecord(raw.modelProfiles) ? { ...raw.modelProfiles } : {};
      const profileConfig = isRecord(profiles[profile]) ? { ...profiles[profile] } : {};
      for (const [role, route] of staged) {
        if (route) profileConfig[role] = route;
        else delete profileConfig[role];
      }
      if (Object.keys(profileConfig).length) profiles[profile] = profileConfig;
      else delete profiles[profile];
      if (Object.keys(profiles).length) raw.modelProfiles = profiles;
      else delete raw.modelProfiles;

      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, `${JSON.stringify(raw, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    });
  }

  private getAvailableModel(model: string, ctx: ExtensionContext): Model<Api> {
    const separator = model.indexOf("/");
    const provider = model.slice(0, separator);
    const modelId = model.slice(separator + 1);
    const resolved = separator > 0 && modelId ? ctx.modelRegistry.find(provider, modelId) : undefined;
    if (!resolved) throw new Error(`Unknown delegated Pi model: ${model}`);
    return resolved;
  }
}

export function registerModelRouter(pi: ExtensionAPI, router: ModelRouter): void {
  pi.registerCommand("itsol-models", {
    description: "Show, reload, or interactively configure ITSOL model and reasoning profile mappings",
    handler: async (args, ctx) => {
      const action = args.trim() || "status";
      try {
        if (action === "configure") {
          await router.configureInteractive(ctx);
          return;
        }
        if (action === "reload") router.reload(ctx);
        else if (action !== "status") throw new Error("Usage: /itsol-models [status|reload|configure]");
        if (ctx.hasUI) ctx.ui.notify(router.formatSummary(), "info");
      } catch (error) {
        if (ctx.hasUI) ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
}
