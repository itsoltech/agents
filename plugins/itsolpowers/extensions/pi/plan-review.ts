// Policy-driven, proportionate isolated review for planned artifacts under itsol-workflow-mode and itsol-execution-policy.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import { formatDuration, type DelegationController, type DelegationResult } from "./delegate-tool.ts";
import { STOP_RANK, type DelegatedTask } from "./policy.ts";
import type { RepoPolicyManager } from "./repo-policy.ts";
import type { TaskStateStore } from "./task-state.ts";

const ENTRY_TYPE = "itsol-plan-reviews";
const REVIEW_AGENT = "itsol-self-review";

type PlanType = "initiative" | "business" | "technical" | "technical-fix";
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
  reviewers: string[];
  planType: PlanType;
  planPath: string;
  fingerprint: string;
  round: number;
  verdict: PlanVerdict;
  childStatus: DelegationResult["status"];
  output: string;
  reviewerVerdicts: Array<{ agent: string; verdict: PlanVerdict; status: DelegationResult["status"] }>;
  recordedAt: number;
}

export interface PlanReviewCompletionDecision {
  problems: string[];
  forceContinuation: boolean;
}

const PlanReviewParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1 }),
  plan_type: StringEnum(["initiative", "business", "technical", "technical-fix"] as const),
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

function contextualPlanFingerprint(
  filePath: string,
  planType: PlanType,
  qaPolicy?: { profile: string; max_cycles: number; application_types: string[]; commands: string[]; targets: string[] },
): string {
  const hash = crypto.createHash("sha256").update(planFingerprint(filePath));
  if (planType === "initiative" && qaPolicy) hash.update(JSON.stringify(qaPolicy));
  return hash.digest("hex");
}

function expectedVerdict(mode: "governed" | "autonomous-planned" | "direct"): "ready for approval" | "ready for execution" {
  if (mode === "governed") return "ready for approval";
  if (mode === "autonomous-planned") return "ready for execution";
  throw new Error("Direct workflow has no persistent plan Rubber Duck gate");
}

export function parsePlanReviewVerdict(output: string, expected: "ready for approval" | "ready for execution"): PlanVerdict {
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.replaceAll("**", "").trim();
    const match = line.match(/^(?:(?:Plan Review|Rubber Duck)\s*)?Verdict:\s*(not ready for approval|not ready for execution|ready for approval|ready for execution|changes required|not ready|ready|pass|fail)\s*[.!]?$/i);
    if (!match) continue;
    const value = match[1].toLowerCase();
    if (["ready", "pass"].includes(value)) return expected;
    if (["changes required", "not ready", "fail"].includes(value)) {
      return expected === "ready for approval" ? "not ready for approval" : "not ready for execution";
    }
    return value as PlanVerdict;
  }
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

export function initiativeReviewers(content: string): string[] {
  const reviewers = ["itsol-requirements-review", "itsol-technical-planning", "itsol-qa-handoff", REVIEW_AGENT];
  if (/(security|permission|authorization|authentication|tenant|secret|token|privacy)/i.test(content)) {
    reviewers.push("security-api-input-review");
  }
  if (/(migration|schema|database|postgres|mongodb|mssql|data integrity)/i.test(content)) {
    reviewers.push(/mongodb/i.test(content) ? "mongodb-review" : /mssql|sql server/i.test(content) ? "mssql-review" : "postgres-review");
  }
  return [...new Set(reviewers)];
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
    private readonly store: TaskStateStore,
    private readonly repoPolicy: RepoPolicyManager,
    private readonly delegation: DelegationController,
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
  ): Promise<{ record: PlanReviewRecord; results: DelegationResult[]; expected: string }> {
    const state = this.store.get(params.task_id);
    if (!state) throw new Error(`Unknown ITSOL task state: ${params.task_id}`);
    if (state.workflow_state.workflow_mode === "direct") throw new Error("Direct workflow does not require plan review");
    const reviewPolicy = this.repoPolicy.resolveReviewPolicy(state.policy_context);
    if (reviewPolicy.profile === "off" || reviewPolicy.max_rounds === 0) {
      throw new Error(`Plan review is disabled for task ${params.task_id} by profile=${reviewPolicy.profile}`);
    }
    const planMaxRounds = reviewPolicy.plan_max_rounds;
    if (state.execution_policy.max_parallel === 0) {
      throw new Error("Plan review was selected, but max_parallel=0");
    }
    const selected = normalizedPlanPath(ctx.cwd, params.plan_path);
    const qaPolicy = this.repoPolicy.resolveQaPolicy(state.policy_context);
    const fingerprint = contextualPlanFingerprint(selected.absolute, params.plan_type, qaPolicy);
    const previous = this.latest(params.task_id, params.plan_type, selected.relative);
    const expected = expectedVerdict(state.workflow_state.workflow_mode);
    if (previous?.fingerprint === fingerprint && previous.verdict === expected && previous.childStatus === "completed") {
      return {
        record: previous,
        expected,
        results: [{
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
        }],
      };
    }
    const round = (previous?.round ?? 0) + 1;
    if (round > planMaxRounds) {
      throw new Error(`Rubber Duck review round limit reached for ${selected.relative}: ${previous?.round ?? 0}/${planMaxRounds}`);
    }

    const planContent = fs.readFileSync(selected.absolute, "utf8");
    const reviewerNames = params.plan_type === "initiative" ? initiativeReviewers(planContent) : [REVIEW_AGENT];
    const readScope = [...new Set([
      selected.relative,
      ...(params.plan_type === "initiative" ? [path.posix.dirname(selected.relative)] : []),
      ...(state.policy_context?.paths ?? []),
    ])];
    const tasks: DelegatedTask[] = reviewerNames.map((reviewer, index) => ({
      agent: reviewer,
      work_item_id: `plan-${params.plan_type}-${reviewer}-${index + 1}`,
      role: "review",
      task: [
        `Perform isolated read-only Rubber Duck Review round ${round}/${planMaxRounds} for the ${params.plan_type} plan at ${selected.relative}.`,
        `Reviewer focus: ${reviewer}. For Initiative Roadmaps, independently assess the full source, requirement disposition, architecture/dependencies, QA strategy, security/data risk when relevant, and autonomous phase loop.`,
        `Original request: ${params.request_summary}`,
        `Confirmed scope or selected/recommended approach: ${params.confirmed_scope_or_approach}`,
        `Minimal repository evidence: ${params.repo_evidence.join("; ") || "none supplied"}`,
        `Effective repository QA policy: ${qaPolicy.profile}; max cycles ${qaPolicy.max_cycles}; application types ${qaPolicy.application_types.join(", ") || "auto-detect"}; commands ${qaPolicy.commands.join("; ") || "none"}. Treat profile=off as an authorized QA skip, not a missing-plan blocker or PASS.`,
        `Workflow mode: ${state.workflow_state.workflow_mode}. Expected passing verdict: ${expected}.`,
        "Inspect the plan and relevant read-only repository evidence. Do not modify files and do not delegate.",
        "Be pragmatic and proportional to the plan's scale. Report only findings with a concrete effect on scope, acceptance, correctness, security/data safety, architecture feasibility, rollout, or verification. Do not block on style, wording, optional detail, speculative edge cases, personal preferences, or refactors outside the requested scope.",
        "Separate material blockers from non-blocking suggestions. Suggestions never justify another review round. Prefer one consolidated pass over serial discovery of minor comments.",
        "Report material blockers, important gaps, optional suggestions, user-decision questions, sections to update, unverified items, and meaningful coverage gaps.",
        `Before the required Status/Verification/Unverified envelope, include exactly one column-one line: Plan Review Verdict: ${expected} or Plan Review Verdict: not ${expected}.`,
        "Use the not-ready verdict only for a concrete material defect that could plausibly make implementation wrong, unsafe, or unverifiable; otherwise use the ready verdict and keep minor improvements non-blocking.",
      ].join("\n"),
      operations: ["rubber-duck-plan-review"],
      read_scope: readScope,
      write_scope: [],
      forbidden_scope: [],
      required_evidence: ["plan path inspected", "material findings", "explicit Plan Review Verdict"],
      stop_after: "analysis",
    }));
    this.store.prepareReviewers(state.task_id, reviewerNames);
    let results: DelegationResult[] = [];
    try {
      const outcome = await this.delegation.delegate({
        task_id: state.task_id,
        run_in_background: false,
        tasks,
      }, {
        requestId: `plan-review:${state.task_id}:${params.plan_type}:${round}`,
        signal,
        context: ctx,
        onProgress: (delegatedProgress) => {
          const progress: PlanReviewProgress = {
            agent: delegatedProgress.agent,
            activity: delegatedProgress.activity,
            elapsedMs: delegatedProgress.elapsedMs,
            planType: params.plan_type,
            planPath: selected.relative,
            round,
            maxRounds: planMaxRounds,
            model: delegatedProgress.model,
            modelSource: delegatedProgress.modelSource,
            thinking: delegatedProgress.thinking,
            thinkingSource: delegatedProgress.thinkingSource,
          };
          if (this.context?.hasUI) this.context.ui.setStatus(
            "itsol-plan-review",
            `Plan review ${params.plan_type} r${round}/${planMaxRounds} · ${progress.agent}: ${progress.activity} · ${formatDuration(progress.elapsedMs)}`,
          );
          onProgress?.(progress);
        },
      });
      results = outcome.results;
    } catch (error) {
      if (this.context?.hasUI) this.context.ui.setStatus("itsol-plan-review", "Plan review failed");
      throw error;
    }
    if (results.length !== tasks.length) {
      if (this.context?.hasUI) this.context.ui.setStatus("itsol-plan-review", "Plan review failed");
      throw new Error("One or more Rubber Duck reviewers did not return a result");
    }
    const reviewerVerdicts = results.map((result) => ({
      agent: result.agent,
      status: result.status,
      verdict: result.status === "completed" ? parsePlanReviewVerdict(result.output, expected) : "invalid" as PlanVerdict,
    }));
    const passed = reviewerVerdicts.every((item) => item.status === "completed" && item.verdict === expected);
    const childStatus: DelegationResult["status"] = results.every((item) => item.status === "completed")
      ? "completed"
      : results.find((item) => item.status !== "completed")!.status;
    const output = results.map((result) => `## ${result.agent}\n\n${result.output}`).join("\n\n---\n\n");
    const record: PlanReviewRecord = {
      id: `plan-review-${params.task_id}-${Date.now()}`,
      taskId: params.task_id,
      reviewers: reviewerNames,
      planType: params.plan_type,
      planPath: selected.relative,
      fingerprint,
      round,
      verdict: passed ? expected : expected === "ready for approval" ? "not ready for approval" : "not ready for execution",
      childStatus,
      output,
      reviewerVerdicts,
      recordedAt: Date.now(),
    };
    this.records.push(record);
    this.persist();
    this.updateStatus();
    return { record, results, expected };
  }

  canAdvanceWithoutReview(taskId: string, planType: PlanType, planPath: string, cwd: string): boolean {
    if (this.isRequired(taskId)) return false;
    const relative = path.relative(cwd, path.resolve(cwd, planPath)).replaceAll("\\", "/");
    return !this.latest(taskId, planType, relative);
  }

  hasPassingReview(taskId: string, planType: PlanType, planPath: string, cwd: string): boolean {
    const state = this.store.get(taskId);
    if (!state || state.workflow_state.workflow_mode === "direct") return false;
    const relative = path.relative(cwd, path.resolve(cwd, planPath)).replaceAll("\\", "/");
    const record = this.latest(taskId, planType, relative);
    if (!record || record.childStatus !== "completed" || record.verdict !== expectedVerdict(state.workflow_state.workflow_mode)) return false;
    try {
      return contextualPlanFingerprint(path.resolve(cwd, relative), planType, this.repoPolicy.resolveQaPolicy(state.policy_context)) === record.fingerprint;
    } catch {
      return false;
    }
  }

  isRequired(taskId: string): boolean {
    const state = this.store.get(taskId);
    if (!state || state.workflow_state.workflow_mode === "direct") return false;
    const policy = this.repoPolicy.resolveReviewPolicy(state.policy_context);
    return policy.profile !== "off"
      && policy.max_rounds > 0
      && ["final", "checkpoint"].includes(policy.trigger);
  }

  completionDecision(taskId: string, achievedStage: keyof typeof STOP_RANK, cwd: string): PlanReviewCompletionDecision {
    const state = this.store.get(taskId);
    if (!state || state.workflow_state.workflow_mode === "direct") return { problems: [], forceContinuation: false };
    const reviewPolicy = this.repoPolicy.resolveReviewPolicy(state.policy_context);
    if (reviewPolicy.profile === "off" || reviewPolicy.max_rounds === 0) return { problems: [], forceContinuation: false };
    const rank = STOP_RANK[achievedStage];
    const acceptedTypes: PlanType[] = rank >= STOP_RANK["technical-plan"]
      ? ["technical", "technical-fix"]
      : rank >= STOP_RANK["business-plan"] ? ["business"] : [];
    if (!acceptedTypes.length) return { problems: [], forceContinuation: false };
    const record = [...this.records]
      .filter((item) => item.taskId === taskId && acceptedTypes.includes(item.planType))
      .sort((left, right) => right.recordedAt - left.recordedAt)[0];
    const planMaxRounds = reviewPolicy.plan_max_rounds;
    const canUseReviewer = state.execution_policy.max_parallel > 0
      && (state.execution_policy.max_subagents === "unlimited"
        || this.store.getUsedAgents(taskId).has(REVIEW_AGENT)
        || this.store.getUsedAgents(taskId).size < state.execution_policy.max_subagents);
    if (!record) {
      if (!this.isRequired(taskId)) return { problems: [], forceContinuation: false };
      return {
        problems: [`${acceptedTypes.join("/")} plan requires isolated review by the effective ${reviewPolicy.trigger} policy`],
        forceContinuation: canUseReviewer,
      };
    }
    const expected = expectedVerdict(state.workflow_state.workflow_mode);
    const absolute = path.resolve(cwd, record.planPath);
    let stale = true;
    let artifactReadable = false;
    try {
      stale = contextualPlanFingerprint(absolute, record.planType, this.repoPolicy.resolveQaPolicy(state.policy_context)) !== record.fingerprint;
      artifactReadable = true;
    } catch {
      // Missing or unreadable artifacts remain blocking even after an optional PASS.
    }
    const problems: string[] = [];
    const required = this.isRequired(taskId);
    const passingOptionalReview = artifactReadable && !required && record.childStatus === "completed" && record.verdict === expected;
    if (stale && !passingOptionalReview) problems.push(`Rubber Duck verdict is stale because ${record.planPath} changed materially`);
    if (record.childStatus !== "completed") problems.push(`Rubber Duck reviewer status is ${record.childStatus}`);
    if (record.verdict !== expected) problems.push(`Rubber Duck verdict is ${record.verdict}; expected ${expected}`);
    const roundsRemain = record.round < planMaxRounds;
    return { problems, forceContinuation: problems.length > 0 && canUseReviewer && roundsRemain };
  }

  formatPromptContext(): string {
    const state = this.store.getActive();
    if (!state || state.workflow_state.workflow_mode === "direct") return "";
    const policy = this.repoPolicy.resolveReviewPolicy(state.policy_context);
    const required = this.isRequired(state.task_id);
    return [
      "## ITSOL plan review (extension-managed)",
      `Plan review policy is ${required ? "required" : "agent-decided"} (profile=${policy.profile}, trigger=${policy.trigger}, cap=${policy.plan_max_rounds} per artifact).`,
      required
        ? "Run isolated plan review before handoff."
        : "Decide whether isolated plan review adds value based on task scale, uncertainty, novelty, and material risk. Skip it for small, conventional, well-verified plans; do not run it merely as ceremony.",
      "The read-only reviewer is pre-authorized when selected. Judge its feedback pragmatically: only concrete material findings block; style preferences, optional detail, and speculative edge cases remain non-blocking.",
      "A passing optional adaptive review does not require another review solely because the plan fingerprint later changes. Required final/checkpoint reviews remain current-fingerprint gates.",
      "Do not launch unrelated domain reviewers or change execution mode to compensate for optional fingerprint drift. If a selected review returns a material finding, update the plan and rerun only when the fix materially changed readiness and another round is worthwhile.",
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
  store: TaskStateStore,
  repoPolicy: RepoPolicyManager,
  delegation: DelegationController,
): PlanReviewOrchestrator {
  const orchestrator = new PlanReviewOrchestrator(pi, store, repoPolicy, delegation);
  pi.registerTool({
    name: "itsol_plan_review",
    label: "ITSOL Plan Review",
    description: "Run an isolated read-only specialist panel for an Initiative Roadmap, or itsol-self-review for a Business, Technical, or Technical Fix Plan, when required by policy or when the agent judges it proportionate to risk and scale.",
    promptSnippet: "Run proportionate isolated review for a planning artifact",
    promptGuidelines: [
      "Follow the effective review trigger. With trigger=adaptive, call itsol_plan_review only when plan scale, uncertainty, novelty, or material risk justifies the cost; a routine small plan should rely on concise self-review.",
      "Do not ask the user to authorize a selected read-only reviewer. Resolve concrete material findings, but do not rerun for style, optional detail, speculative concerns, non-blocking suggestions, or optional adaptive fingerprint drift after PASS.",
      "Use only the reviewers selected by this action. Do not launch unrelated domain reviewers or change execution mode as a plan-review retry.",
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
            outcome.record.output,
            "",
            passed
              ? "The plan passed isolated review. Under adaptive policy, later fingerprint drift alone does not require another review; final/checkpoint policies still require a current verdict. Do not launch unrelated domain reviewers."
              : "Resolve concrete material findings. Rerun only when required by policy or when the change materially benefits from another independent pass.",
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
        results?: DelegationResult[];
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
      const children = details.results ?? [];
      const activityTrail = children.flatMap((child) => child.activities.slice(-1).map((activity) => `${child.agent}: ${activity.text}`)).join(" → ");
      const usage = children.length
        ? `${children.reduce((sum, child) => sum + child.usage.input, 0)} in · ${children.reduce((sum, child) => sum + child.usage.output, 0)} out · ${children.reduce((sum, child) => sum + child.usage.turns, 0)} turns · $${children.reduce((sum, child) => sum + child.usage.cost, 0).toFixed(4)}`
        : "usage unavailable";
      const runtime = children.length
        ? `${formatDuration(Math.max(...children.map((child) => child.durationMs)))} · ${children.length} reviewer${children.length === 1 ? "" : "s"}`
        : "runtime unavailable";
      const lines = [
        theme.fg(passed ? "success" : "warning", `${passed ? "✓ PASS" : "! CHANGES REQUIRED"} · ${details.record.planType} r${details.record.round}`),
        theme.fg("muted", `${details.record.planPath} · ${details.record.verdict}`),
        theme.fg("dim", `${(details.record.reviewers ?? [REVIEW_AGENT]).join(", ")} · ${runtime}`),
        theme.fg("dim", usage),
      ];
      if (activityTrail) lines.push(theme.fg("muted", `activity: ${activityTrail}`));
      if (expanded && details.record.output) lines.push("", details.record.output);
      return new Text(lines.join("\n"), 0, 0);
    },
  });
  return orchestrator;
}
