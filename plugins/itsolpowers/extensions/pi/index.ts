import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "./agents.ts";
import { registerTaskState, TaskStateStore } from "./task-state.ts";

const extensionDirectory = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(extensionDirectory, "../..");
const skillsDirectory = path.join(pluginRoot, "skills");
const agentsDirectory = path.join(pluginRoot, "agents");
const sharedBootstrapPath = path.join(pluginRoot, "hooks", "bootstrap-context.md");
const adapterBootstrapPath = path.join(pluginRoot, "hooks", "bootstrap-context-pi.md");
const profilePath = path.join(pluginRoot, "context", "context-profiles.json");
const packagePath = path.join(pluginRoot, "package.json");
const BOOTSTRAP_MARKER = 'id="itsolpowers-pi-bootstrap"';
const PROFILE_NAMES = new Set(["frontier", "compatibility"]);
const REQUIRED_INVARIANTS = Object.freeze([
  "workflow-authority",
  "repository-restrictions",
  "protected-actions",
  "deterministic-contracts",
  "tool-hook-contracts",
  "honest-incomplete-status",
  "nested-delegation-prohibition",
]);
const REQUIRED_PROFILE_FIELDS = Object.freeze([
  "default_small_task_execution",
  "default_verifier_fanout",
  "delegation",
  "description",
  "explicit_scaffolding",
  "guidance",
  "review",
  "verification",
]);
const EXPECTED_PROFILE_SEMANTICS = Object.freeze({
  frontier: Object.freeze({
    verification: "risk-proportionate",
    review: "material-risk-or-uncertainty",
    delegation: "independent-work-with-material-value",
  }),
  compatibility: Object.freeze({
    verification: "explicit-focused-and-wider",
    review: "explicit-trigger-and-response",
    delegation: "explicit-bounded-packets",
  }),
});

interface ContextProfileDefinition {
  default_small_task_execution?: unknown;
  default_verifier_fanout?: unknown;
  delegation?: unknown;
  description?: unknown;
  explicit_scaffolding?: unknown;
  guidance: string[];
  review?: unknown;
  verification?: unknown;
}

interface ContextProfileDocument {
  schema_version: string;
  invariants: string[];
  profiles: Record<string, ContextProfileDefinition>;
  selection?: Record<string, unknown>;
}

export interface ContextProfileSelection {
  name: "frontier" | "compatibility";
  source: string;
  warning: string | null;
}

export interface ValidatedRuntimeProfileSignal {
  validated: boolean;
  profile?: unknown;
}

export interface ItsolMemoryPresence {
  repositoryRoot: string;
  filePath: string;
  exists: boolean;
}

function normalizeProfile(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim().toLowerCase() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: Iterable<string>,
  label: string,
): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} keys must be exactly: ${wanted.join(", ")}`);
  }
}

function assertNonEmptyString(value: unknown, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertUniqueStringArray(
  value: unknown,
  label: string,
  expected?: readonly string[],
): asserts value is string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }
  if (
    value.some(
      (item) => typeof item !== "string" || item.trim().length === 0,
    )
    || new Set(value).size !== value.length
  ) {
    throw new Error(`${label} must contain unique non-empty strings`);
  }
  if (
    expected
    && (
      value.length !== expected.length
      || expected.some((item) => !value.includes(item))
    )
  ) {
    throw new Error(`${label} does not match the required contract`);
  }
}

export function validateContextProfileDocument(
  value: unknown,
): ContextProfileDocument {
  if (!isRecord(value) || value.schema_version !== "1.0.0") {
    throw new Error("context profile document must use schema 1.0.0");
  }
  if (!isRecord(value.selection)) {
    throw new Error("selection must be an object");
  }
  assertExactKeys(
    value.selection,
    [
      "precedence",
      "environment_variable",
      "provider_name_is_capability",
      "invalid_input",
    ],
    "selection",
  );
  if (
    JSON.stringify(value.selection.precedence)
      !== JSON.stringify([
        "explicit-task",
        "explicit-environment",
        "validated-runtime-capability",
        "compatibility-fallback",
      ])
    || value.selection.environment_variable
      !== "ITSOLPOWERS_CONTEXT_PROFILE"
    || value.selection.provider_name_is_capability !== false
    || !isRecord(value.selection.invalid_input)
    || value.selection.invalid_input.profile !== "compatibility"
    || value.selection.invalid_input.surface_warning !== true
  ) {
    throw new Error("selection contract is invalid");
  }
  assertExactKeys(
    value.selection.invalid_input,
    ["profile", "surface_warning"],
    "selection.invalid_input",
  );
  assertUniqueStringArray(value.invariants, "invariants", REQUIRED_INVARIANTS);

  if (!isRecord(value.profiles)) {
    throw new Error("profiles must be an object");
  }
  assertExactKeys(value.profiles, PROFILE_NAMES, "profiles");
  for (const name of PROFILE_NAMES) {
    const profile = value.profiles[name];
    if (!isRecord(profile)) {
      throw new Error(`profiles.${name} must be an object`);
    }
    assertExactKeys(profile, REQUIRED_PROFILE_FIELDS, `profiles.${name}`);
    assertNonEmptyString(profile.description, `profiles.${name}.description`);
    for (const field of ["verification", "review", "delegation"] as const) {
      const expected = EXPECTED_PROFILE_SEMANTICS[
        name as keyof typeof EXPECTED_PROFILE_SEMANTICS
      ][field];
      if (profile[field] !== expected) {
        throw new Error(`profiles.${name}.${field} must equal ${expected}`);
      }
    }
    if (
      profile.default_small_task_execution !== "inline"
      || profile.default_verifier_fanout !== false
      || profile.explicit_scaffolding !== (name === "compatibility")
    ) {
      throw new Error(`profiles.${name} execution defaults are invalid`);
    }
    assertUniqueStringArray(profile.guidance, `profiles.${name}.guidance`);
  }
  return value as unknown as ContextProfileDocument;
}

export function detectExplicitTaskProfile(prompt: string): string | undefined {
  let latest: { index: number; value: string | undefined } | undefined;
  for (const pattern of [
    /\bITSOLPOWERS_CONTEXT_PROFILE\s*=\s*([a-z0-9-]+)/gi,
    /\bcontext\s+profile\s*[:=]\s*([a-z0-9-]+)/gi,
    /\bunder\s+(?:the\s+)?([a-z0-9-]+)\s+(?:context\s+)?profile\b/gi,
  ]) {
    for (const match of prompt.matchAll(pattern)) {
      if (!latest || (match.index ?? -1) > latest.index) {
        latest = {
          index: match.index ?? -1,
          value: normalizeProfile(match[1]),
        };
      }
    }
  }
  return latest?.value;
}

export function resolveContextProfile({
  taskProfile,
  environmentProfile = process.env.ITSOLPOWERS_CONTEXT_PROFILE,
  runtimeSignal,
}: {
  taskProfile?: unknown;
  environmentProfile?: unknown;
  runtimeSignal?: ValidatedRuntimeProfileSignal;
} = {}): ContextProfileSelection {
  for (const [source, candidate] of [
    ["explicit-task", taskProfile],
    ["explicit-environment", environmentProfile],
  ] as const) {
    if (candidate === undefined || candidate === null) continue;
    const name = normalizeProfile(candidate);
    if (PROFILE_NAMES.has(name ?? "")) {
      return { name: name as ContextProfileSelection["name"], source, warning: null };
    }
    return {
      name: "compatibility",
      source: `invalid-${source}`,
      warning: `Unknown ITSOL context profile "${String(candidate)}"; using compatibility.`,
    };
  }

  if (runtimeSignal?.validated === true) {
    const name = normalizeProfile(runtimeSignal.profile);
    if (PROFILE_NAMES.has(name ?? "")) {
      return {
        name: name as ContextProfileSelection["name"],
        source: "validated-runtime-capability",
        warning: null,
      };
    }
    return {
      name: "compatibility",
      source: "invalid-validated-runtime-capability",
      warning: `Validated runtime supplied unknown ITSOL context profile "${String(runtimeSignal.profile)}"; using compatibility.`,
    };
  }

  return {
    name: "compatibility",
    source: "compatibility-fallback",
    warning: null,
  };
}

export function loadContextProfiles(
  profileFilePath = profilePath,
): {
  document: ContextProfileDocument;
  warning: string | null;
} {
  try {
    const document = validateContextProfileDocument(
      JSON.parse(fs.readFileSync(profileFilePath, "utf8")),
    );
    return { document, warning: null };
  } catch (error) {
    return {
      document: {
        schema_version: "embedded-compatibility",
        invariants: [
          "workflow-authority",
          "repository-restrictions",
          "protected-actions",
          "deterministic-contracts",
          "tool-hook-contracts",
          "honest-incomplete-status",
          "nested-delegation-prohibition",
        ],
        profiles: {
          compatibility: {
            guidance: [
              "Use explicit RED or replacement evidence, focused and wider verification, bounded task packets, and honest completion status.",
            ],
          },
        },
      },
      warning: `ITSOL profile contract unavailable; using embedded compatibility guidance (${error instanceof Error ? error.message : String(error)}).`,
    };
  }
}

export function formatContextProfile(
  selection: ContextProfileSelection,
  loaded: ReturnType<typeof loadContextProfiles>,
): string {
  const requestedProfile = loaded.document.profiles[selection.name];
  const effectiveSelection: ContextProfileSelection = requestedProfile
    ? selection
    : {
        name: "compatibility",
        source: "invalid-profile-contract",
        warning: `Selected profile "${selection.name}" is unavailable in the loaded contract; using compatibility.`,
      };
  const profile = requestedProfile ?? loaded.document.profiles.compatibility;
  return [
    "## ITSOL context profile",
    `Selected \`${effectiveSelection.name}\` via \`${effectiveSelection.source}\`.`,
    ...[effectiveSelection.warning, loaded.warning]
      .filter((warning): warning is string => Boolean(warning))
      .map((warning) => `Warning: ${warning}`),
    ...profile.guidance.map((guidance) => `- ${guidance}`),
    `Profile-invariant contracts: ${loaded.document.invariants.join(", ")}.`,
  ].join("\n");
}

export function detectItsolMemoryPresence(cwd: string): ItsolMemoryPresence {
  let repositoryRoot = path.resolve(cwd);
  while (!fs.existsSync(path.join(repositoryRoot, ".git"))) {
    const parent = path.dirname(repositoryRoot);
    if (parent === repositoryRoot) {
      repositoryRoot = path.resolve(cwd);
      break;
    }
    repositoryRoot = parent;
  }
  const filePath = path.join(repositoryRoot, ".itsol.md");
  return { repositoryRoot, filePath, exists: fs.existsSync(filePath) };
}

export function formatItsolMemoryPresence(cwd: string): string {
  const presence = detectItsolMemoryPresence(cwd);
  const relativePath = path.relative(cwd, presence.filePath).replaceAll("\\", "/") || ".itsol.md";
  return presence.exists
    ? `ITSOL repository memory: ${relativePath} EXISTS. The extension checked existence only; it did not read or parse the file. Do not check whether it exists again.`
    : `ITSOL repository memory: .itsol.md DOES NOT EXIST at the repository root. The extension checked existence only. Do not search for it.`;
}

export default function itsolPowersPiExtension(pi: ExtensionAPI): void {
  const agents = discoverItsolAgents(agentsDirectory);
  const loadedProfiles = loadContextProfiles();
  let pluginVersion = "unknown";
  try {
    const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { version?: unknown };
    if (typeof manifest.version === "string" && manifest.version) pluginVersion = manifest.version;
  } catch {
    // Keep the extension available even when package metadata is unreadable.
  }
  const taskState = new TaskStateStore(pi, agents.length, pluginVersion);
  const bootstrap = [sharedBootstrapPath, adapterBootstrapPath]
    .map((filePath) =>
      fs.existsSync(filePath)
        ? fs.readFileSync(filePath, "utf8").trim()
        : `ITSOL Powers bootstrap is missing: ${path.basename(filePath)}.`,
    )
    .join("\n\n");

  registerTaskState(pi, taskState);

  pi.on("session_start", (_event, ctx) => {
    taskState.startSession(ctx);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setStatus("itsolpowers", undefined);
  });

  pi.on("before_agent_start", (event, ctx) => {
    const loadedSkills = event.systemPromptOptions.skills ?? [];
    const router = loadedSkills.find((skill) => skill.name === "using-itsolpowers");
    if (!router) return;

    const parts: string[] = [];
    if (!event.systemPrompt.includes(BOOTSTRAP_MARKER)) {
      parts.push(
        bootstrap,
        `ITSOL Powers package root: ${pluginRoot}`,
        `ITSOL Powers skill root: ${skillsDirectory}`,
        "When a bundled instruction uses `itsolpowers:<name>`, normalize it to the Pi skill name `<name>`.",
      );
    }
    parts.push(
      formatContextProfile(
        resolveContextProfile({
          taskProfile: detectExplicitTaskProfile(event.prompt),
        }),
        loadedProfiles,
      ),
    );
    parts.push(formatItsolMemoryPresence(ctx.cwd));
    const stateContext = taskState.formatPromptContext();
    if (stateContext) parts.push(stateContext);
    if (!parts.length) return;
    return { systemPrompt: `${event.systemPrompt}\n\n${parts.join("\n\n")}` };
  });

  pi.registerCommand("itsolpowers-doctor", {
    description: "Check ITSOL Powers skills, agents, bootstrap, and skill conflicts",
    handler: async (_args, ctx) => {
      const commands = pi.getCommands();
      const skills = commands.filter((command) => command.source === "skill");
      const bundledSkills = skills.filter((command) => {
        const sourcePath = command.sourceInfo.path;
        return sourcePath ? path.resolve(sourcePath).startsWith(path.resolve(skillsDirectory)) : false;
      });
      const skillName = (commandName: string) => commandName.replace(/^skill:/, "");
      const required = ["using-itsolpowers", "itsol-workflow-mode", "itsol-execution-policy"];
      const missing = required.filter((name) => !bundledSkills.some((skill) => skillName(skill.name) === name));
      const collisions = required.filter((name) => {
        const matches = skills.filter((skill) => skillName(skill.name) === name);
        return matches.length > 0 && !matches.some((skill) => {
          const sourcePath = skill.sourceInfo.path;
          return sourcePath ? path.resolve(sourcePath).startsWith(path.resolve(skillsDirectory)) : false;
        });
      });
      const hasSuperpowers = skills.some((skill) => /(^|[-/])superpowers($|[-/])/.test(skillName(skill.name)));

      const lines = [
        `Plugin version: ${pluginVersion}`,
        `Bootstrap: ${fs.existsSync(sharedBootstrapPath) && fs.existsSync(adapterBootstrapPath) ? "ok" : "missing"}`,
        `Context profiles: ${loadedProfiles.warning ?? "ok"}`,
        `Bundled skills: ${bundledSkills.length}`,
        `Bundled agents: ${agents.length}`,
        `Required skills: ${missing.length ? `missing ${missing.join(", ")}` : "ok"}`,
        `Skill collisions: ${collisions.length ? collisions.join(", ") : "none"}`,
        `Superpowers conflict: ${hasSuperpowers ? "possible — disable competing workflow routing" : "not detected"}`,
        `Task state: ${taskState.getActive() ? taskState.getActive()!.task_id : "none"}`,
        formatItsolMemoryPresence(ctx.cwd),
        "ITSOL delegation tool: not registered",
      ];

      if (ctx.hasUI) {
        ctx.ui.notify(lines.join("\n"), missing.length || collisions.length ? "warning" : "info");
      }
    },
  });
}
