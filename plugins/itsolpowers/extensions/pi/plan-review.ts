// Automatic isolated Rubber Duck review gate for Business and Technical Plan artifacts under itsol-workflow-mode and itsol-execution-policy.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import type { ItsolAgentConfig } from "./agents.ts";
import { formatDuration, runAgent, type DelegationResult } from "./delegate-tool.ts";
import type { ModelRouter } from "./model-router.ts";
import {
  STOP_RANK,
  validateDelegation,
  type DelegatedTask,
  type ItsolDelegateParams,
} from "./policy.ts";
import type { RepoPolicyManager } from "./repo-policy.ts";
import type { TaskStateStore } from "./task-state.ts";

const ENTRY_TYPE = "itsol-plan-reviews";
const REVIEW_AGENT = "itsol-self-review";

type PlanType = "business" | "technical" | "technical-fix";
type PlanVerdict = "ready for approval" | "ready for execution" | "not ready for approval" | "not ready for execution" | "invalid";

interface PlanReviewProgress {
  agent: string;
  activity: string;
  elapsedMs: number;
  planType: PlanType;
  planPath: string;
  round: number;
  maxRounds: number;
  model: string;
  modelSource: string;
  thinking: string;
  thinkingSource: string;
}

interface PlanReviewRecord {
  id: string;
  taskId: string;
  planType: PlanType;
  planPath: string;
  fingerprint: string;
  round: number;
  verdict: PlanVerdict;
  childStatus: DelegationResult["status"];
  output: string;
  recordedAt: number;
}

export interface PlanReviewCompletionDecision {
  problems: string[];
  forceContinuation: boolean;
}

const PlanReviewParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1 }),
  plan_type: StringEnum(["business", "technical", "technical-fix"] as const),
  plan_path: Type.String({ minLength: 1 }),
  request_summary: Type.String({ minLength: 1 }),
  confirmed_scope_or_approach: Type.String({ minLength: 1 }),
  repo_evidence: Type.Array(Type.String()),
});

type PlanReviewParams = Static<typeof PlanReviewParamsSchema>;

function normalizePlanForFingerprint(content: string): string {
  return content
    .replace(/^\*\*(Status|Rubber Duck Verdict|Approval|Approved By|Approved At):\*\*.*$/gim, "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function planFingerprint(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf8");
  return crypto.createHash("sha256").update(normalizePlanForFingerprint(content)).digest("hex");
}

function expectedVerdict(mode: "governed" | "autonomous-planned" | "direct"): "ready for approval" | "ready for execution" {
  if (mode === "governed") return "ready for approval";
  if (mode === "autonomous-planned") return "ready for execution";
  throw new Error("Direct workflow has no persistent plan Rubber Duck gate");
}

export function parsePlanReviewVerdict(output: string, expected: "ready for approval" | "ready for execution"): PlanVerdict {
  const explicit = output.match(/^\s*(?:\*\*)?(?:Plan Review|Rubber Duck)?\s*Verdict(?:\*\*)?:\s*(?:\*\*)?(not ready for approval|not ready for execution|ready for approval|ready for execution)(?:\*\*)?\s*[.!]?\s*$/im);
  if (explicit?.[1]) return explicit[1].toLowerCase() as PlanVerdict;
  const normalized = output.toLowerCase();
  if (normalized.includes("not ready for approval")) return "not ready for approval";
  if (normalized.includes("not ready for execution")) return "not ready for execution";
  if (normalized.includes("ready for approval")) return "ready for approval";
  if (normalized.includes("ready for execution")) return "ready for execution";
  if (/^\s*(?:\*\*)?(?:plan review|rubber duck)?\s*verdict(?:\*\*)?:\s*(?:\*\*)?(ready|pass)(?:\*\*)?\s*[.!]?\s*$/im.test(output)) {
    return expected;
  }
  if (/^\s*(?:\*\*)?(?:plan review|rubber duck)?\s*verdict(?:\*\*)?:\s*(?:\*\*)?(not ready|changes required|fail)(?:\*\*)?\s*[.!]?\s*$/im.test(output)) {
    return expected === "ready for approval" ? "not ready for approval" : "not ready for execution";
  }
  return "invalid";
}

function normalizedPlanPath(cwd: string, requested: string): { absolute: string; relative: string } {
  const absolute = path.resolve(cwd, requested.replace(/^@/, ""));
  const relative = path.relative(cwd, absolute).replaceAll("\\", "/");
  if (!relative || relative.startsWith("../") || path.isAbsolute(relative)) {
    throw new Error("Plan path must be a file inside the current repository");
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`Plan file does not exist: ${relative}`);
  return { absolute, relative };
}

export class PlanReviewOrchestrator {
  private readonly records: PlanReviewRecord[] = [];
  private context?: ExtensionContext;

  constructor(
    private readonly pi: ExtensionAPI,
    private readonly pluginRoot: string,
    private readonly agents: ItsolAgentConfig[],
    private readonly store: TaskStateStore,
    private readonly modelRouter: ModelRouter,
    private readonly repoPolicy: RepoPolicyManager,
  ) {}

  startSession(ctx: ExtensionContext): void {
    this.records.length = 0;
    this.context = ctx;
    const entries = ctx.sessionManager.getBranch();
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index];
      if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE) continue;
      const data = entry.data as { records?: PlanReviewRecord[] } | undefined;
      this.records.push(...(data?.records ?? []));
      break;
    }
    this.updateStatus();
  }

  async review(
    params: PlanReviewParams,
    ctx: ExtensionContext,
    signal: AbortSignal | undefined,
    onProgress?: (progress: PlanReviewProgress) => void,
  ): Promise<{ record: PlanReviewRecord; result: DelegationResult; expected: string }> {
    const state = this.store.get(params.task_id);
    if (!state) throw new Error(`Unknown ITSOL task state: ${params.task_id}`);
    if (state.workflow_state.workflow_mode === "direct") throw new Error("Direct workflow does not require plan review");
    const planMaxRounds = this.repoPolicy.resolveReviewPolicy(state.policy_context).plan_max_rounds;
    if (state.execution_policy.max_parallel === 0) {
      throw new Error("Rubber Duck review is required by the planned workflow, but max_parallel=0");
    }
    const selected = normalizedPlanPath(ctx.cwd, params.plan_path);
    const fingerprint = planFingerprint(selected.absolute);
    const previous = this.latest(params.task_id, params.plan_type, selected.relative);
    const expected = expectedVerdict(state.workflow_state.workflow_mode);
    if (previous?.fingerprint === fingerprint && previous.verdict === expected && previous.childStatus === "completed") {
      return {
        record: previous,
        expected,
        result: {
          agent: REVIEW_AGENT,
          task: `Rubber Duck review ${selected.relative}`,
          status: "completed",
          output: previous.output,
          exitCode: 0,
          stderr: "",
          usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 },
          durationMs: 0,
          activities: [],
          modelSource: "cached-plan-verdict",
          thinking: "cached",
          thinkingSource: "cached-plan-verdict",
        },
      };
    }
    const round = (previous?.round ?? 0) + 1;
    if (round > planMaxRounds) {
      throw new Error(`Rubber Duck review round limit reached for ${selected.relative}: ${previous?.round ?? 0}/${planMaxRounds}`);
    }

    const agent = this.agents.find((candidate) => candidate.name === REVIEW_AGENT);
    if (!agent) throw new Error(`Missing ITSOL reviewer: ${REVIEW_AGENT}`);
    const task: DelegatedTask = {
      agent: REVIEW_AGENT,
      role: "review",
      task: [
        `Perform isolated read-only Rubber Duck Review round ${round}/${planMaxRounds} for the ${params.plan_type} plan at ${selected.relative}.`,
        `Original request: ${params.request_summary}`,
        `Confirmed scope or selected/recommended approach: ${params.confirmed_scope_or_approach}`,
        `Minimal repository evidence: ${params.repo_evidence.join("; ") || "none supplied"}`,
        `Workflow mode: ${state.workflow_state.workflow_mode}. Expected passing verdict: ${expected}.`,
        "Inspect the plan and relevant read-only repository evidence. Do not modify files and do not delegate.",
        "Report blockers, important gaps, non-blocking suggestions, user-decision questions, sections to update, unverified items, and coverage gaps.",
        `Before the required Status/Verification/Unverified envelope, include exactly one column-one line: Plan Review Verdict: ${expected} or Plan Review Verdict: not ${expected}.`,
        "Use the ready verdict only when no material finding remains.",
      ].join("\n"),
      operations: ["rubber-duck-plan-review"],
      read_scope: [...new Set([selected.relative, ...(state.policy_context?.paths ?? [])])],
      write_scope: [],
      forbidden_scope: [],
      required_evidence: ["plan path inspected", "material findings", "explicit Plan Review Verdict"],
      stop_after: "analysis",
    };
    const delegation: ItsolDelegateParams = {
      task_id: state.task_id,
      workflow_state: state.workflow_state,
      execution_policy: state.execution_policy,
      done_when: state.done_when,
      policy_context: state.policy_context,
      task,
    };
    const inheritedModel = ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : undefined;
    const resolution = this.modelRouter.resolve(task, agent, state.execution_policy, inheritedModel, ctx);
    this.repoPolicy.validateDelegation(delegation, [task]);
    validateDelegation(delegation, [task], new Map(this.agents.map((item) => [item.name, item])), this.store.getUsedAgents(state.task_id), {
      modelControlEnforced: resolution.profileEnforced,
    });
    if (state.active_agents.length + 1 > state.execution_policy.max_parallel) {
      throw new Error(`Rubber Duck review exceeds max_parallel=${state.execution_policy.max_parallel}`);
    }

    const progressBase = {
      agent: REVIEW_AGENT,
      planType: params.plan_type,
      planPath: selected.relative,
      round,
      maxRounds: planMaxRounds,
      model: resolution.model ?? "default model",
      modelSource: `${resolution.source}:${resolution.role}`,
      thinking: resolution.thinking,
      thinkingSource: resolution.thinkingSource,
    };
    const reportProgress = (activity: string, elapsedMs: number) => {
      const progress = { ...progressBase, activity, elapsedMs };
      if (this.context?.hasUI) {
        this.context.ui.setStatus(
          "itsol-plan-review",
          `Plan review ${params.plan_type} r${round}/${planMaxRounds} · ${activity} · ${formatDuration(elapsedMs)}`,
        );
      }
      onProgress?.(progress);
    };
    reportProgress("queued", 0);
    this.store.prepareReviewers(state.task_id, [REVIEW_AGENT]);
    this.store.beginDelegation(state.task_id, [REVIEW_AGENT]);
    let result: DelegationResult | undefined;
    try {
      result = await runAgent(
        this.pluginRoot,
        path.join(this.pluginRoot, "skills"),
        agent,
        task,
        delegation,
        ctx.cwd,
        resolution.model,
        `${resolution.source}:${resolution.role}`,
        resolution.thinking,
        resolution.thinkingSource,
        signal,
        (activity, elapsedMs) => reportProgress(activity, elapsedMs),
      );
    } finally {
      this.store.finishDelegation(state.task_id, [REVIEW_AGENT], result ? [{ ...result, role: "review" }] : []);
    }
    if (!result) {
      if (this.context?.hasUI) this.context.ui.setStatus("itsol-plan-review", "Plan review failed");
      throw new Error("Rubber Duck reviewer did not return a result");
    }
    const verdict = result.status === "completed" ? parsePlanReviewVerdict(result.output, expected) : "invalid";
    const record: PlanReviewRecord = {
      id: `plan-review-${params.task_id}-${Date.now()}`,
      taskId: params.task_id,
      planType: params.plan_type,
      planPath: selected.relative,
      fingerprint,
      round,
      verdict,
      childStatus: result.status,
      output: result.output,
      recordedAt: Date.now(),
    };
    this.records.push(record);
    this.persist();
    this.updateStatus();
    return { record, result, expected };
  }

  completionDecision(taskId: string, achievedStage: keyof typeof STOP_RANK, cwd: string): PlanReviewCompletionDecision {
    const state = this.store.get(taskId);
    if (!state || state.workflow_state.workflow_mode === "direct") return { problems: [], forceContinuation: false };
    const rank = STOP_RANK[achievedStage];
    const acceptedTypes: PlanType[] = rank >= STOP_RANK["technical-plan"]
      ? ["technical", "technical-fix"]
      : rank >= STOP_RANK["business-plan"] ? ["business"] : [];
    if (!acceptedTypes.length) return { problems: [], forceContinuation: false };
    const record = [...this.records]
      .filter((item) => item.taskId === taskId && acceptedTypes.includes(item.planType))
      .sort((left, right) => right.recordedAt - left.recordedAt)[0];
    const planMaxRounds = this.repoPolicy.resolveReviewPolicy(state.policy_context).plan_max_rounds;
    const canUseReviewer = state.execution_policy.max_parallel > 0
      && (this.store.getUsedAgents(taskId).has(REVIEW_AGENT)
        || this.store.getUsedAgents(taskId).size < state.execution_policy.max_subagents);
    if (!record) {
      return {
        problems: [`${acceptedTypes.join("/")} plan requires automatic isolated Rubber Duck Review before user handoff`],
        forceContinuation: canUseReviewer,
      };
    }
    const expected = expectedVerdict(state.workflow_state.workflow_mode);
    const absolute = path.resolve(cwd, record.planPath);
    let stale = true;
    try {
      stale = planFingerprint(absolute) !== record.fingerprint;
    } catch {
      // Missing artifacts are stale.
    }
    const problems: string[] = [];
    if (stale) problems.push(`Rubber Duck verdict is stale because ${record.planPath} changed materially`);
    if (record.childStatus !== "completed") problems.push(`Rubber Duck reviewer status is ${record.childStatus}`);
    if (record.verdict !== expected) problems.push(`Rubber Duck verdict is ${record.verdict}; expected ${expected}`);
    const roundsRemain = record.round < planMaxRounds;
    return { problems, forceContinuation: problems.length > 0 && canUseReviewer && roundsRemain };
  }

  formatPromptContext(): string {
    const state = this.store.getActive();
    if (!state || state.workflow_state.workflow_mode === "direct") return "";
    return [
      "## ITSOL automatic plan review (extension-managed)",
      "Business, Technical, and Technical Fix Plans must pass isolated Rubber Duck Review through itsol_plan_review before being presented to the user or marked ready for execution.",
      "This read-only reviewer is pre-authorized by the planned workflow within execution ceilings. Do not ask the user to authorize a review subagent or call itsol_complete while an actionable plan review remains.",
      "If findings are material, update the plan and rerun itsol_plan_review. Return to the user only after a current passing verdict, or after the reviewer/round ceiling creates a genuine blocker.",
    ].join("\n");
  }

  private latest(taskId: string, planType: PlanType, planPath: string): PlanReviewRecord | undefined {
    return [...this.records]
      .filter((record) => record.taskId === taskId && record.planType === planType && record.planPath === planPath)
      .sort((left, right) => right.recordedAt - left.recordedAt)[0];
  }

  private persist(): void {
    this.pi.appendEntry(ENTRY_TYPE, { records: this.records });
  }

  private updateStatus(): void {
    if (!this.context?.hasUI) return;
    const taskId = this.store.getActive()?.task_id;
    const latest = taskId
      ? [...this.records].filter((record) => record.taskId === taskId).sort((a, b) => b.recordedAt - a.recordedAt)[0]
      : undefined;
    this.context.ui.setStatus("itsol-plan-review", latest
      ? `Plan review ${latest.planType} · r${latest.round} · ${latest.verdict}`
      : undefined);
  }
}

export function registerPlanReview(
  pi: ExtensionAPI,
  pluginRoot: string,
  agents: ItsolAgentConfig[],
  store: TaskStateStore,
  modelRouter: ModelRouter,
  repoPolicy: RepoPolicyManager,
): PlanReviewOrchestrator {
  const orchestrator = new PlanReviewOrchestrator(pi, pluginRoot, agents, store, modelRouter, repoPolicy);
  pi.registerTool({
    name: "itsol_plan_review",
    label: "ITSOL Plan Review",
    description: "Automatically run the isolated read-only itsol-self-review agent against a Business, Technical, or Technical Fix Plan, persist a diff-bound Rubber Duck verdict, and enforce bounded review rounds before user handoff.",
    promptSnippet: "Run automatic isolated Rubber Duck review for a planning artifact",
    promptGuidelines: [
      "In governed and autonomous-planned modes, call itsol_plan_review after plan self-review and before presenting the plan, asking for approval, marking it ready, or calling itsol_complete.",
      "Do not ask the user to authorize this read-only reviewer. Resolve material findings in the plan and rerun within the configured ceiling before user handoff.",
    ],
    parameters: PlanReviewParamsSchema,
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const outcome = await orchestrator.review(params, ctx, signal, (progress) => {
        onUpdate?.({
          content: [{
            type: "text",
            text: [
              `${progress.agent}: ${progress.activity} · ${formatDuration(progress.elapsedMs)}`,
              `${progress.planType} round ${progress.round}/${progress.maxRounds} · ${progress.planPath}`,
              `Model: ${progress.model} (${progress.modelSource}) · thinking: ${progress.thinking} (${progress.thinkingSource})`,
            ].join("\n"),
          }],
          details: { progress },
        });
      });
      const passed = outcome.record.childStatus === "completed" && outcome.record.verdict === outcome.expected;
      return {
        content: [{
          type: "text",
          text: [
            `Rubber Duck Review: ${passed ? "PASS" : "CHANGES REQUIRED"}`,
            `Plan: ${outcome.record.planPath}`,
            `Type: ${outcome.record.planType} · round ${outcome.record.round}`,
            `Verdict: ${outcome.record.verdict}`,
            `Expected: ${outcome.expected}`,
            "",
            outcome.result.output,
            "",
            passed
              ? "The current plan fingerprint passed isolated review. Continue according to workflow mode without requesting reviewer authorization."
              : "Resolve material findings in the plan and call itsol_plan_review again before user handoff.",
          ].join("\n"),
        }],
        details: outcome,
      };
    },
    renderCall(args, theme) {
      return new Text(
        `${theme.fg("toolTitle", theme.bold("itsol_plan_review "))}${theme.fg("accent", args.plan_type)}${theme.fg("muted", ` · ${args.plan_path}`)}`,
        0,
        0,
      );
    },
    renderResult(result, { expanded, isPartial }, theme) {
      const details = result.details as {
        progress?: PlanReviewProgress;
        record?: PlanReviewRecord;
        result?: DelegationResult;
        expected?: string;
      } | undefined;
      if (details?.progress && (isPartial || !details.record)) {
        const progress = details.progress;
        return new Text([
          `${theme.fg("warning", "⏳")} ${theme.fg("accent", theme.bold(progress.agent))}${theme.fg("muted", " — ")}${theme.fg("accent", progress.activity)}${theme.fg("dim", ` · ${formatDuration(progress.elapsedMs)}`)}`,
          theme.fg("muted", `${progress.planType} plan · round ${progress.round}/${progress.maxRounds} · ${progress.planPath}`),
          `${theme.fg("dim", "model: ")}${theme.fg("muted", progress.model)}${theme.fg("dim", ` (${progress.modelSource})`)}${theme.fg("dim", " · thinking: ")}${theme.fg("muted", progress.thinking)}${theme.fg("dim", ` (${progress.thinkingSource})`)}`,
        ].join("\n"), 0, 0);
      }
      if (!details?.record) return new Text(theme.fg("warning", "(plan review returned no details)"), 0, 0);
      const passed = details.record.childStatus === "completed" && details.record.verdict === details.expected;
      const child = details.result;
      const activityTrail = child?.activities.slice(-3).map((activity) => activity.text).join(" → ");
      const usage = child
        ? `${child.usage.input} in · ${child.usage.output} out · ${child.usage.turns} turns · $${child.usage.cost.toFixed(4)}`
        : "usage unavailable";
      const runtime = child
        ? `${formatDuration(child.durationMs)} · ${child.model ?? "default model"} (${child.modelSource}) · thinking ${child.thinking} (${child.thinkingSource})`
        : "runtime unavailable";
      const lines = [
        theme.fg(passed ? "success" : "warning", `${passed ? "✓ PASS" : "! CHANGES REQUIRED"} · ${details.record.planType} r${details.record.round}`),
        theme.fg("muted", `${details.record.planPath} · ${details.record.verdict}`),
        theme.fg("dim", `${REVIEW_AGENT} · ${runtime}`),
        theme.fg("dim", usage),
      ];
      if (activityTrail) lines.push(theme.fg("muted", `activity: ${activityTrail}`));
      if (expanded && child?.output) lines.push("", child.output);
      return new Text(lines.join("\n"), 0, 0);
    },
  });
  return orchestrator;
}
