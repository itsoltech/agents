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
const bootstrapPath = path.join(pluginRoot, "hooks", "bootstrap-context-pi.md");
const packagePath = path.join(pluginRoot, "package.json");
const BOOTSTRAP_MARKER = 'id="itsolpowers-pi-bootstrap"';

export interface ItsolMemoryPresence {
  repositoryRoot: string;
  filePath: string;
  exists: boolean;
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
  let pluginVersion = "unknown";
  try {
    const manifest = JSON.parse(fs.readFileSync(packagePath, "utf8")) as { version?: unknown };
    if (typeof manifest.version === "string" && manifest.version) pluginVersion = manifest.version;
  } catch {
    // Keep the extension available even when package metadata is unreadable.
  }
  const taskState = new TaskStateStore(pi, agents.length, pluginVersion);
  const bootstrap = fs.existsSync(bootstrapPath)
    ? fs.readFileSync(bootstrapPath, "utf8").trim()
    : "ITSOL Powers Pi bootstrap is missing.";

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
        `Bootstrap: ${fs.existsSync(bootstrapPath) ? "ok" : "missing"}`,
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
