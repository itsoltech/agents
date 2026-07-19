import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "./agents.ts";
import { registerCompletionGate } from "./completion-gate.ts";
import { registerItsolDelegate } from "./delegate-tool.ts";
import { ModelRouter, registerModelRouter } from "./model-router.ts";
import { registerRepoPolicy, RepoPolicyManager } from "./repo-policy.ts";
import { registerTaskState, TaskStateStore } from "./task-state.ts";

const extensionDirectory = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(extensionDirectory, "../..");
const skillsDirectory = path.join(pluginRoot, "skills");
const agentsDirectory = path.join(pluginRoot, "agents");
const bootstrapPath = path.join(pluginRoot, "hooks", "bootstrap-context-pi.md");
const packagePath = path.join(pluginRoot, "package.json");
const BOOTSTRAP_MARKER = 'id="itsolpowers-pi-bootstrap"';

export default function itsolPowersPiExtension(pi: ExtensionAPI): void {
  const agents = discoverItsolAgents(agentsDirectory);
  const resetHandlers: Array<() => void> = [];
  let pluginVersion = "unknown";
  try {
    const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { version?: unknown };
    if (typeof manifest.version === "string" && manifest.version) pluginVersion = manifest.version;
  } catch {
    // Keep the extension available even when package metadata is unreadable.
  }
  const taskState = new TaskStateStore(pi, agents.length, pluginVersion);
  const modelRouter = new ModelRouter();
  const repoPolicy = new RepoPolicyManager();
  taskState.setDefinitionValidator((definition) => repoPolicy.validateDefinition(definition));
  const bootstrap = fs.existsSync(bootstrapPath)
    ? fs.readFileSync(bootstrapPath, "utf8").trim()
    : "ITSOL Powers Pi bootstrap is missing.";

  registerTaskState(pi, taskState);
  registerCompletionGate(pi, taskState);
  registerModelRouter(pi, modelRouter);
  registerRepoPolicy(pi, repoPolicy);
  registerItsolDelegate(pi, pluginRoot, agents, taskState, modelRouter, repoPolicy, resetHandlers);

  pi.on("session_start", (_event, ctx) => {
    for (const reset of resetHandlers) reset();
    repoPolicy.startSession(ctx);
    modelRouter.startSession(ctx);
    taskState.startSession(ctx);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setStatus("itsolpowers", undefined);
  });

  pi.on("message_end", (event) => {
    taskState.recordParentUsage(event.message);
  });

  pi.on("agent_settled", () => {
    taskState.flush();
  });

  pi.on("before_agent_start", (event) => {
    const loadedSkills = event.systemPromptOptions.skills ?? [];
    const router = loadedSkills.find((skill) => skill.name === "using-itsolpowers");

    const parts: string[] = [];
    if (router && !event.systemPrompt.includes(BOOTSTRAP_MARKER)) {
      parts.push(
        bootstrap,
        `ITSOL Powers package root: ${pluginRoot}`,
        `ITSOL Powers skill root: ${skillsDirectory}`,
        "When a bundled instruction uses `itsolpowers:<name>`, normalize it to the Pi skill name `<name>`.",
      );
    }
    const stateContext = taskState.formatPromptContext();
    if (stateContext) parts.push(stateContext);
    parts.push(repoPolicy.formatPromptContext(taskState.getActive()?.policy_context));
    parts.push(modelRouter.formatPromptContext());
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
        `Bootstrap: ${fs.existsSync(bootstrapPath) ? "ok" : "missing"}`,
        `Bundled skills: ${bundledSkills.length}`,
        `Bundled agents: ${agents.length}`,
        `Required skills: ${missing.length ? `missing ${missing.join(", ")}` : "ok"}`,
        `Skill collisions: ${collisions.length ? collisions.join(", ") : "none"}`,
        `Superpowers conflict: ${hasSuperpowers ? "possible — disable competing workflow routing" : "not detected"}`,
        `Task state: ${taskState.getActive() ? taskState.getActive()!.task_id : "none"}`,
        repoPolicy.formatStatus(),
        modelRouter.formatSummary(),
        "Delegation isolation: child Pi runs use --no-extensions and an explicit tool allowlist",
        "Filesystem note: write_scope is validated between task packets, but shell commands are not OS-sandboxed",
      ];

      if (ctx.hasUI) {
        ctx.ui.notify(lines.join("\n"), missing.length || collisions.length ? "warning" : "info");
      }
    },
  });
}
