import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "./agents.ts";
import { registerCompletionGate } from "./completion-gate.ts";
import { registerItsolDelegate } from "./delegate-tool.ts";
import { registerInitiativeManager } from "./initiative-state.ts";
import { ModelRouter, registerModelRouter } from "./model-router.ts";
import { registerPlanReview } from "./plan-review.ts";
import { registerQaOrchestrator } from "./qa-orchestrator.ts";
import { registerRepoPolicy, RepoPolicyManager } from "./repo-policy.ts";
import { registerReviewOrchestrator } from "./review-orchestrator.ts";
import { classifyAdministrativeRequest, registerTaskState, TaskStateStore } from "./task-state.ts";

const extensionDirectory = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(extensionDirectory, "../..");
const skillsDirectory = path.join(pluginRoot, "skills");
const agentsDirectory = path.join(pluginRoot, "agents");
const bootstrapPath = path.join(pluginRoot, "hooks", "bootstrap-context-pi.md");
const packagePath = path.join(pluginRoot, "package.json");
const BOOTSTRAP_MARKER = 'id="itsolpowers-pi-bootstrap"';

export default function itsolPowersPiExtension(pi: ExtensionAPI): void {
  const agents = discoverItsolAgents(agentsDirectory);
  let administrativeToolsToRestore: string[] | undefined;
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

  const initiative = registerInitiativeManager(pi, taskState);
  registerTaskState(pi, taskState, initiative);
  registerModelRouter(pi, modelRouter);
  registerRepoPolicy(pi, repoPolicy);
  const reviewOrchestrator = registerReviewOrchestrator(pi, taskState, agents, repoPolicy);
  const planReview = registerPlanReview(pi, pluginRoot, agents, taskState, modelRouter, repoPolicy);
  const qaOrchestrator = registerQaOrchestrator(pi, taskState, initiative, agents, repoPolicy);
  initiative.setRoadmapReviewValidator((taskId, roadmapPath, cwd) => planReview.hasPassingReview(taskId, "initiative", roadmapPath, cwd));
  initiative.setQaRequiredResolver((taskId) => {
    const task = taskState.get(taskId);
    return repoPolicy.resolveQaPolicy(task?.policy_context).profile !== "off";
  });
  registerCompletionGate(pi, taskState, {
    async completionDecision(taskId, ctx, request) {
      const codeReview = await reviewOrchestrator.completionDecision(taskId, ctx);
      const artifactReview = planReview.completionDecision(taskId, request.achieved_stage, ctx.cwd);
      const initiativeDecision = initiative.completionDecision(taskId);
      const qaDecision = await qaOrchestrator.completionDecision(taskId, ctx);
      return {
        ...codeReview,
        problems: [...artifactReview.problems, ...qaDecision.problems, ...initiativeDecision.problems, ...codeReview.problems],
        forceContinuation: Boolean(codeReview.forceContinuation || artifactReview.forceContinuation || qaDecision.forceContinuation || initiativeDecision.forceContinuation),
      };
    },
  });
  registerItsolDelegate(pi, pluginRoot, agents, taskState, modelRouter, repoPolicy, resetHandlers);

  pi.on("session_start", (_event, ctx) => {
    administrativeToolsToRestore = undefined;
    for (const reset of resetHandlers) reset();
    repoPolicy.startSession(ctx);
    modelRouter.startSession(ctx);
    taskState.startSession(ctx);
    initiative.startSession(ctx);
    reviewOrchestrator.startSession(ctx);
    planReview.startSession(ctx);
    qaOrchestrator.startSession(ctx);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    if (ctx.hasUI) {
      ctx.ui.setStatus("itsolpowers", undefined);
      ctx.ui.setStatus("itsol-review", undefined);
      ctx.ui.setStatus("itsol-plan-review", undefined);
      ctx.ui.setStatus("itsol-initiative", undefined);
      ctx.ui.setStatus("itsol-qa", undefined);
    }
  });

  pi.on("message_end", (event) => {
    taskState.recordParentUsage(event.message);
  });

  pi.on("agent_settled", () => {
    taskState.flush();
    if (administrativeToolsToRestore) {
      pi.setActiveTools([...new Set([...pi.getActiveTools(), ...administrativeToolsToRestore])]);
      administrativeToolsToRestore = undefined;
    }
  });

  pi.on("before_agent_start", (event) => {
    const administrativeFollowUp = classifyAdministrativeRequest(event.prompt);
    if (administrativeFollowUp && !administrativeToolsToRestore) {
      administrativeToolsToRestore = pi.getActiveTools();
      pi.setActiveTools(administrativeToolsToRestore.filter((tool) => !tool.startsWith("itsol_")));
    }
    const loadedSkills = event.systemPromptOptions.skills ?? [];
    const router = loadedSkills.find((skill) => skill.name === "using-itsolpowers");

    const parts: string[] = [];
    if (administrativeFollowUp) {
      const action = administrativeFollowUp === "commit"
        ? "Inspect git status and the exact diff, identify the already-produced coherent slice, stage only intended files, exclude unrelated/generated artifacts, use Angular commit convention, do not amend unless explicitly requested, create the local commit, then report the hash and remaining worktree status."
        : administrativeFollowUp === "policy-init"
          ? "Run bounded repo-memory discovery. Inspect only lightweight manifests, propose policy and ask material unknowns; after confirmation create/update only .itsol.md, validate YAML/policy inline, report, and stop. Never route unrelated worktree files into review."
          : "Perform only the requested read-only repository inspection and report the relevant status, diff, or log evidence without staging, committing, or editing files.";
      parts.push([
        "## ITSOL administrative fast path (extension-enforced for this turn)",
        `This is a ${administrativeFollowUp}-only follow-up, not a new engineering task. ITSOL workflow, initiative, delegation, plan-review, code-review orchestration, and completion tools are disabled for this turn.`,
        "Do not create a Business/Technical/Fix Plan, a new task state, or a review round.",
        action,
        "Reuse existing scope and verification evidence. If scope is ambiguous or an operation fails, report the focused blocker or ask one scoped question instead of starting a planning workflow.",
      ].join("\n"));
    }
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
    const initiativeContext = initiative.formatPromptContext();
    if (initiativeContext) parts.push(initiativeContext);
    parts.push(repoPolicy.formatPromptContext(taskState.getActive()?.policy_context));
    const planReviewContext = planReview.formatPromptContext();
    if (planReviewContext) parts.push(planReviewContext);
    const reviewContext = reviewOrchestrator.formatPromptContext();
    if (reviewContext) parts.push(reviewContext);
    const qaContext = qaOrchestrator.formatPromptContext();
    if (qaContext) parts.push(qaContext);
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
        `Initiative state: ${initiative.getActive() ? initiative.getActive()!.initiative_id : "none"}`,
        `Initiative QA: ${initiative.getActive()?.qa_verdicts.length ?? 0} verdicts`,
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
