import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "./agents.ts";
import { registerItsolDelegate } from "./delegate-tool.ts";

const extensionDirectory = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(extensionDirectory, "../..");
const skillsDirectory = path.join(pluginRoot, "skills");
const agentsDirectory = path.join(pluginRoot, "agents");
const bootstrapPath = path.join(pluginRoot, "hooks", "bootstrap-context-pi.md");
const BOOTSTRAP_MARKER = 'id="itsolpowers-pi-bootstrap"';

export default function itsolPowersPiExtension(pi: ExtensionAPI): void {
  const agents = discoverItsolAgents(agentsDirectory);
  const resetHandlers: Array<() => void> = [];
  const bootstrap = fs.existsSync(bootstrapPath)
    ? fs.readFileSync(bootstrapPath, "utf8").trim()
    : "ITSOL Powers Pi bootstrap is missing.";

  registerItsolDelegate(pi, pluginRoot, agents, resetHandlers);

  pi.on("session_start", (_event, ctx) => {
    for (const reset of resetHandlers) reset();
    if (ctx.hasUI) ctx.ui.setStatus("itsolpowers", `ITSOL Powers · ${agents.length} agents`);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    if (ctx.hasUI) ctx.ui.setStatus("itsolpowers", undefined);
  });

  pi.on("before_agent_start", (event) => {
    const loadedSkills = event.systemPromptOptions.skills ?? [];
    const router = loadedSkills.find((skill) => skill.name === "using-itsolpowers");
    if (!router || event.systemPrompt.includes(BOOTSTRAP_MARKER)) return;

    const piContext = [
      bootstrap,
      `ITSOL Powers package root: ${pluginRoot}`,
      `ITSOL Powers skill root: ${skillsDirectory}`,
      "When a bundled instruction uses `itsolpowers:<name>`, normalize it to the Pi skill name `<name>`.",
    ].join("\n\n");
    return { systemPrompt: `${event.systemPrompt}\n\n${piContext}` };
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
        `Bootstrap: ${fs.existsSync(bootstrapPath) ? "ok" : "missing"}`,
        `Bundled skills: ${bundledSkills.length}`,
        `Bundled agents: ${agents.length}`,
        `Required skills: ${missing.length ? `missing ${missing.join(", ")}` : "ok"}`,
        `Skill collisions: ${collisions.length ? collisions.join(", ") : "none"}`,
        `Superpowers conflict: ${hasSuperpowers ? "possible — disable competing workflow routing" : "not detected"}`,
        "Delegation isolation: child Pi runs use --no-extensions and an explicit tool allowlist",
        "Filesystem note: write_scope is validated between task packets, but shell commands are not OS-sandboxed",
      ];

      if (ctx.hasUI) {
        ctx.ui.notify(lines.join("\n"), missing.length || collisions.length ? "warning" : "info");
      }
    },
  });
}
