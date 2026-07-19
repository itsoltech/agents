// Fingerprint-bound Initiative QA orchestration layered on itsol-workflow-mode and itsol-execution-policy.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import type { ItsolAgentConfig } from "./agents.ts";
import type { InitiativeManager, InitiativeQaVerdictRecord } from "./initiative-state.ts";
import type { DelegatedTask } from "./policy.ts";
import { currentWorktreeFingerprint } from "./review-orchestrator.ts";
import type { RepoPolicyManager, QaProfile } from "./repo-policy.ts";
import type { TaskStateStore } from "./task-state.ts";

const ENTRY_TYPE = "itsol-qa-plans";
const ApplicationTypeSchema = StringEnum([
  "web-ui", "api", "backend", "cli", "electron", "mobile", "data", "infrastructure",
] as const);
const QaScopeSchema = StringEnum(["phase", "system"] as const);

type ApplicationType = Static<typeof ApplicationTypeSchema>;
type QaScope = Static<typeof QaScopeSchema>;

const QaPlanParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1 }),
  initiative_id: Type.String({ minLength: 1 }),
  scope: QaScopeSchema,
  phase_id: Type.Optional(Type.String({ pattern: "^P[0-9]{2,}$" })),
  application_types: Type.Array(ApplicationTypeSchema, { minItems: 1 }),
  changed_paths: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  acceptance_criteria: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  available_targets: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  existing_test_evidence: Type.Array(Type.String()),
});

type QaPlanParams = Static<typeof QaPlanParamsSchema>;

const QaCheckSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  surface: Type.String({ minLength: 1 }),
  status: StringEnum(["pass", "fail", "blocked"] as const),
  evidence: Type.String({ minLength: 1 }),
  source: Type.String({ minLength: 1 }),
});

const QaFindingSchema = Type.Object({
  severity: StringEnum(["critical", "high", "medium", "low", "info"] as const),
  title: Type.String({ minLength: 1 }),
  evidence: Type.String({ minLength: 1 }),
  source: Type.String({ minLength: 1 }),
  requirement_ids: Type.Array(Type.String()),
});

const QaVerdictParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1 }),
  initiative_id: Type.String({ minLength: 1 }),
  plan_id: Type.String({ minLength: 1 }),
  covered_surfaces: Type.Array(Type.String()),
  checks: Type.Array(QaCheckSchema, { minItems: 1 }),
  findings: Type.Array(QaFindingSchema),
  unverified: Type.Array(Type.String()),
  failure_route: Type.Optional(StringEnum(["implementation-fix", "plan-revision", "user-decision"] as const)),
});

type QaVerdictParams = Static<typeof QaVerdictParamsSchema>;
type QaCheck = Static<typeof QaCheckSchema>;
type QaFinding = Static<typeof QaFindingSchema>;

interface QaPlan {
  id: string;
  taskId: string;
  initiativeId: string;
  scope: QaScope;
  phaseId?: string;
  applicationTypes: ApplicationType[];
  fingerprint: string;
  requiredCoverage: string[];
  coverageGaps: string[];
  profile: QaProfile;
  cycle: number;
  maxCycles: number;
  status: "ready" | "blocked" | "skipped";
  changedPaths: string[];
  acceptanceCriteria: string[];
  existingTestEvidence: string[];
  delegations: DelegatedTask[];
  batches: string[][];
  createdAt: number;
}

interface QaVerdictRecord extends InitiativeQaVerdictRecord {
  task_id: string;
  initiative_id: string;
  required_coverage: string[];
  covered_surfaces: string[];
  checks: QaCheck[];
  finding_details: QaFinding[];
  unverified: string[];
}

export interface QaCompletionDecision {
  problems: string[];
  forceContinuation: boolean;
}

const coverageByType: Record<ApplicationType, string[]> = {
  "web-ui": ["browser-flow", "ui-states", "accessibility", "console-network"],
  api: ["api-contract", "api-integration", "api-security"],
  backend: ["backend-integration", "regression"],
  cli: ["interactive-cli", "cli-errors", "cli-exit-codes"],
  electron: ["desktop-flow", "ipc-security", "desktop-runtime"],
  mobile: ["mobile-flow", "permissions", "offline-runtime"],
  data: ["data-integrity", "migration", "rollback"],
  infrastructure: ["deployment-readiness", "observability", "rollback"],
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export async function currentQaFingerprint(pi: ExtensionAPI, cwd: string, signal?: AbortSignal): Promise<string> {
  const diff = await pi.exec("git", ["diff", "HEAD", "--binary", "--", ".", ":(exclude).itsol/initiatives/**"], { cwd, signal });
  if (diff.code !== 0) throw new Error(`Unable to fingerprint QA target: ${diff.stderr}`);
  const hash = crypto.createHash("sha256").update(diff.stdout);
  const untracked = await pi.exec("git", ["ls-files", "--others", "--exclude-standard"], { cwd, signal });
  if (untracked.code === 0) {
    for (const file of untracked.stdout.split("\n").filter((item) => item && !item.replaceAll("\\", "/").startsWith(".itsol/initiatives/")).sort()) {
      hash.update(file);
      try {
        hash.update(fs.readFileSync(path.join(cwd, file)));
      } catch {
        hash.update("unreadable");
      }
    }
  }
  return hash.digest("hex");
}

function qaPackets(params: QaPlanParams): Array<{ surface: string; agent: string; operation: string; instruction: string }> {
  const packets: Array<{ surface: string; agent: string; operation: string; instruction: string }> = [];
  const add = (surface: string, agent: string, operation: string, instruction: string) => packets.push({ surface, agent, operation, instruction });
  for (const type of params.application_types) {
    if (type === "web-ui") {
      add("browser-flow", "agent-browser-dogfood-workflow", "browser-qa", "Exercise real user journeys with browser evidence, screenshots where useful, console and network inspection, and visible-state assertions.");
      add("accessibility", "ui-frontend-testing-qa", "ui-qa", "Check responsive states, accessibility, forms, loading/error/empty states, and UI regression evidence.");
    } else if (type === "electron") {
      add("desktop-flow", "agent-browser-dogfood-workflow", "electron-qa", "Connect through the supported Electron/CDP path and exercise desktop flows, runtime errors, and visible states.");
      add("ipc-security", "electron-desktop-review", "electron-runtime-qa", "Validate main/preload/renderer boundaries, IPC behavior, permissions, and packaging-sensitive runtime paths.");
    } else if (type === "cli") {
      add("interactive-cli", "itsol-qa-handoff", "interactive-cli-qa", "Run the CLI interactively where possible; cover success, invalid input, cancellation, stderr/stdout, exit codes, and stateful prompts.");
    } else if (type === "api") {
      add("api-integration", "itsol-qa-handoff", "api-integration-qa", "Execute API contract and integration scenarios, including errors, authorization boundaries, idempotency, and observable side effects.");
      add("api-security", "security-api-input-review", "api-security-qa", "Probe trust boundaries, validation, authorization, injection, unsafe output, and abuse/error scenarios using concrete evidence.");
    } else if (type === "backend") {
      add("backend-integration", "itsol-qa-handoff", "backend-integration-qa", "Run backend integration, regression, failure-path, concurrency, and observability scenarios relevant to the acceptance criteria.");
    } else if (type === "mobile") {
      add("mobile-flow", "expo-react-native-review", "mobile-runtime-qa", "Validate device-visible flows, navigation, permissions, offline behavior, lifecycle, and release-sensitive behavior.");
    } else if (type === "data") {
      const joined = params.changed_paths.join("\n").toLowerCase();
      const agent = joined.includes("mongo") ? "mongodb-review" : joined.includes("mssql") || joined.includes("sqlserver") ? "mssql-review" : "postgres-review";
      add("data-integrity", agent, "data-qa", "Validate migrations, constraints, transaction behavior, compatibility, rollback, and representative data integrity.");
    } else if (type === "infrastructure") {
      add("deployment-readiness", "infra-production-readiness-review", "infrastructure-qa", "Validate deployment order, health checks, observability, failure handling, rollback, and production-readiness evidence without performing an unauthorized deploy.");
    }
  }
  if (params.scope === "system") {
    add("system-regression", "itsol-qa-handoff", "system-regression-qa", "Run cross-phase end-to-end and regression acceptance, verify documentation/operations alignment, and identify integration gaps.");
  }
  return packets;
}

export class QaOrchestrator {
  private readonly plans: QaPlan[] = [];
  private readonly verdicts: QaVerdictRecord[] = [];
  private context?: ExtensionContext;

  constructor(
    private readonly pi: ExtensionAPI,
    private readonly tasks: TaskStateStore,
    private readonly initiatives: InitiativeManager,
    private readonly agents: ItsolAgentConfig[],
    private readonly repoPolicy: RepoPolicyManager,
  ) {}

  startSession(ctx: ExtensionContext): void {
    this.context = ctx;
    this.plans.length = 0;
    this.verdicts.length = 0;
    const entries = ctx.sessionManager.getBranch();
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index];
      if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE) continue;
      const data = entry.data as { plans?: QaPlan[]; verdicts?: QaVerdictRecord[] } | undefined;
      this.plans.push(...(data?.plans ?? []));
      this.verdicts.push(...(data?.verdicts ?? []));
      break;
    }
    this.updateHud();
  }

  async createPlan(params: QaPlanParams, ctx: ExtensionContext, signal?: AbortSignal): Promise<QaPlan> {
    const task = this.tasks.get(params.task_id);
    if (!task) throw new Error(`Unknown ITSOL task state: ${params.task_id}`);
    const initiative = this.initiatives.get(params.initiative_id);
    if (!initiative || initiative.task_id !== params.task_id) throw new Error(`Unknown or mismatched initiative: ${params.initiative_id}`);
    if (params.scope === "phase" && !params.phase_id) throw new Error("Phase QA requires phase_id");
    if (params.phase_id && !initiative.phases.some((phase) => phase.id === params.phase_id)) throw new Error(`Unknown initiative phase: ${params.phase_id}`);

    const qaContext = {
      paths: unique([...(task.policy_context?.paths ?? []), ...params.changed_paths]),
      operations: unique([...(task.policy_context?.operations ?? []), `qa-${params.scope}`]),
    };
    const qaPolicy = this.repoPolicy.resolveQaPolicy(qaContext);
    const reviewPolicy = this.repoPolicy.resolveReviewPolicy(qaContext);
    if (["balanced", "strict"].includes(reviewPolicy.profile)) {
      if (task.review_verdict?.verdict !== "approve") throw new Error("Initiative QA requires a passing current code-review verdict first");
      const currentReviewFingerprint = await currentWorktreeFingerprint(this.pi, ctx.cwd, signal);
      if (task.review_verdict.fingerprint !== currentReviewFingerprint) {
        throw new Error("Initiative QA requires fresh code review because the implementation changed");
      }
    }
    const applicationTypes = qaPolicy.application_types.length ? qaPolicy.application_types : params.application_types;
    const previousCycles = initiative.qa_verdicts.filter((item) => item.scope === params.scope
      && (params.scope === "system" || item.phase_id === params.phase_id)).length;
    const cycle = previousCycles + 1;
    if (cycle > qaPolicy.max_cycles) throw new Error(`QA cycle limit reached for ${params.scope}${params.phase_id ? ` ${params.phase_id}` : ""}: ${previousCycles}/${qaPolicy.max_cycles}`);
    const requiredCoverage = qaPolicy.profile === "off" ? [] : qaPolicy.profile === "evidence"
      ? ["configured-verification-evidence"]
      : unique([
      ...applicationTypes.flatMap((type) => coverageByType[type]),
      ...(params.scope === "system" ? ["system-regression", "cross-phase-integration", "documentation-operations"] : []),
    ]);
    const effectiveParams = { ...params, application_types: applicationTypes };
    const candidates = qaPolicy.profile === "automatic" || qaPolicy.profile === "strict" ? qaPackets(effectiveParams) : [];
    const knownAgents = new Set(this.agents.map((agent) => agent.name));
    const usedTypes = this.tasks.getUsedAgents(params.task_id);
    let remainingTypes = task.execution_policy.max_subagents === "unlimited"
      ? Number.POSITIVE_INFINITY
      : Math.max(0, task.execution_policy.max_subagents - usedTypes.size);
    const selectedTypes = new Set<string>();
    const selected = candidates.filter((candidate) => {
      if (!knownAgents.has(candidate.agent)) return false;
      if (usedTypes.has(candidate.agent) || selectedTypes.has(candidate.agent)) return true;
      if (remainingTypes <= 0) return false;
      selectedTypes.add(candidate.agent);
      remainingTypes--;
      return true;
    });
    const selectedCoverage = new Set(selected.map((candidate) => candidate.surface));
    if (qaPolicy.profile === "evidence") selectedCoverage.add("configured-verification-evidence");
    const coverageGaps = requiredCoverage.filter((surface) => {
      if (selectedCoverage.has(surface)) return false;
      if (["ui-states", "console-network"].includes(surface) && selectedCoverage.has("browser-flow")) return false;
      if (["api-contract"].includes(surface) && selectedCoverage.has("api-integration")) return false;
      if (["regression"].includes(surface) && selectedCoverage.has("backend-integration")) return false;
      if (["cli-errors", "cli-exit-codes"].includes(surface) && selectedCoverage.has("interactive-cli")) return false;
      if (["desktop-runtime"].includes(surface) && selectedCoverage.has("desktop-flow")) return false;
      if (["permissions", "offline-runtime"].includes(surface) && selectedCoverage.has("mobile-flow")) return false;
      if (["migration", "rollback"].includes(surface) && selectedCoverage.has("data-integrity")) return false;
      if (["observability", "rollback"].includes(surface) && selectedCoverage.has("deployment-readiness")) return false;
      if (["cross-phase-integration", "documentation-operations"].includes(surface) && selectedCoverage.has("system-regression")) return false;
      return true;
    });
    const prefix = `qa-${params.scope}${params.phase_id ? `-${params.phase_id.toLowerCase()}` : ""}`;
    const delegations: DelegatedTask[] = selected.map((candidate, index) => ({
      agent: candidate.agent,
      work_item_id: `${prefix}-${candidate.surface}-${index + 1}`.replace(/[^A-Za-z0-9._-]/g, "-"),
      role: "review",
      task: [
        `Execute ${params.scope} QA for initiative ${params.initiative_id}${params.phase_id ? ` phase ${params.phase_id}` : ""}.`,
        candidate.instruction,
        `Acceptance criteria: ${params.acceptance_criteria.join("; ")}`,
        `Available targets: ${unique([...(params.available_targets ?? []), ...qaPolicy.targets]).join("; ") || "inspect repository-supported local targets"}`,
        `Required repository QA commands: ${qaPolicy.commands.join("; ") || "none configured"}`,
        `Existing test evidence: ${params.existing_test_evidence.join("; ") || "none"}`,
        "Do not modify production files. Return concrete executed checks, PASS/FAIL/BLOCKED, findings with severity and requirement impact, and unverified gaps. Do not delegate.",
      ].join("\n"),
      operations: [candidate.operation],
      read_scope: unique(params.changed_paths),
      write_scope: [],
      forbidden_scope: [],
      required_evidence: [candidate.surface, "executed checks", "observed result", "unverified gaps"],
      stop_after: "analysis",
    }));
    const maxParallel = Math.max(1, task.execution_policy.max_parallel);
    const batches: string[][] = [];
    for (let index = 0; index < delegations.length; index += maxParallel) {
      batches.push(delegations.slice(index, index + maxParallel).map((item) => item.work_item_id!));
    }
    const plan: QaPlan = {
      id: `qa-plan-${params.task_id}-${Date.now()}`,
      taskId: params.task_id,
      initiativeId: params.initiative_id,
      scope: params.scope,
      phaseId: params.phase_id,
      applicationTypes: [...applicationTypes],
      fingerprint: await currentQaFingerprint(this.pi, ctx.cwd, signal),
      requiredCoverage,
      coverageGaps,
      profile: qaPolicy.profile,
      cycle,
      maxCycles: qaPolicy.max_cycles,
      status: qaPolicy.profile === "off" ? "skipped"
        : qaPolicy.profile === "evidence" ? (params.existing_test_evidence.length || qaPolicy.commands.length ? "ready" : "blocked")
          : coverageGaps.length || !delegations.length || task.execution_policy.max_parallel === 0 ? "blocked" : "ready",
      changedPaths: [...params.changed_paths],
      acceptanceCriteria: [...params.acceptance_criteria],
      existingTestEvidence: unique([...params.existing_test_evidence, ...qaPolicy.commands.map((command) => `required command: ${command}`)]),
      delegations,
      batches,
      createdAt: Date.now(),
    };
    this.plans.push(plan);
    this.persist();
    this.updateHud();
    return plan;
  }

  async recordVerdict(params: QaVerdictParams, ctx: ExtensionContext, signal?: AbortSignal): Promise<QaVerdictRecord> {
    const plan = this.plans.find((item) => item.id === params.plan_id && item.taskId === params.task_id && item.initiativeId === params.initiative_id);
    if (!plan) throw new Error(`Unknown QA plan: ${params.plan_id}`);
    const fingerprint = await currentQaFingerprint(this.pi, ctx.cwd, signal);
    if (fingerprint !== plan.fingerprint) throw new Error("QA plan is stale because the implementation changed; create and execute a new QA plan");
    const covered = new Set(params.covered_surfaces);
    const evidenced = new Set(params.checks.map((check) => check.surface));
    const coverageGaps = unique([
      ...plan.coverageGaps,
      ...plan.requiredCoverage.filter((surface) => !covered.has(surface) || !evidenced.has(surface)),
    ]);
    const blockingSeverities = plan.profile === "strict" ? ["critical", "high", "medium", "low"] : ["critical", "high", "medium"];
    const blockingFindings = params.findings.filter((finding) => blockingSeverities.includes(finding.severity));
    const failedChecks = params.checks.filter((check) => check.status !== "pass"
      || /^(?:not run|planned|todo|unknown)\b/i.test(check.evidence.trim()));
    const passed = plan.status === "ready" && !coverageGaps.length && !blockingFindings.length && !failedChecks.length && !params.unverified.length;
    const verdict: QaVerdictRecord["verdict"] = passed ? "pass" : failedChecks.some((check) => check.status === "blocked") ? "blocked" : "fail";
    if (!passed && !params.failure_route) throw new Error("Failed or blocked QA requires failure_route: implementation-fix, plan-revision, or user-decision");
    const record: QaVerdictRecord = {
      task_id: params.task_id,
      initiative_id: params.initiative_id,
      qa_plan_id: plan.id,
      scope: plan.scope,
      phase_id: plan.phaseId,
      fingerprint,
      verdict,
      failure_route: passed ? undefined : params.failure_route,
      findings: params.findings.length,
      coverage_gaps: coverageGaps,
      evidence: params.checks.map((check) => `${check.name}: ${check.status} — ${check.evidence}`),
      recorded_at: Date.now(),
      required_coverage: [...plan.requiredCoverage],
      covered_surfaces: [...params.covered_surfaces],
      checks: params.checks.map((check) => ({ ...check })),
      finding_details: params.findings.map((finding) => ({ ...finding, requirement_ids: [...finding.requirement_ids] })),
      unverified: [...params.unverified],
    };
    this.verdicts.push(record);
    this.initiatives.recordQaVerdict(params.initiative_id, record);
    this.persist();
    this.updateHud();
    return record;
  }

  async completionDecision(taskId: string, ctx: ExtensionContext): Promise<QaCompletionDecision> {
    const initiative = [...this.verdicts]
      .filter((item) => item.task_id === taskId)
      .sort((left, right) => right.recorded_at - left.recorded_at)[0]?.initiative_id;
    const active = initiative ? this.initiatives.get(initiative) : this.initiatives.getForTask(taskId);
    if (!active || active.task_id !== taskId) return { problems: [], forceContinuation: false };
    const task = this.tasks.get(taskId);
    const qaPolicy = this.repoPolicy.resolveQaPolicy(task?.policy_context);
    if (qaPolicy.profile === "off") return { problems: [], forceContinuation: false };
    const problems: string[] = [];
    for (const phase of active.phases) {
      const latest = [...active.qa_verdicts]
        .filter((item) => item.scope === "phase" && item.phase_id === phase.id)
        .sort((left, right) => right.recorded_at - left.recorded_at)[0];
      if (latest?.verdict !== "pass") problems.push(`phase ${phase.id} lacks a passing QA verdict`);
    }
    const system = [...active.qa_verdicts]
      .filter((item) => item.scope === "system")
      .sort((left, right) => right.recorded_at - left.recorded_at)[0];
    if (system?.verdict !== "pass") problems.push("final system QA lacks a passing verdict");
    else {
      const fingerprint = await currentQaFingerprint(this.pi, ctx.cwd);
      if (fingerprint !== system.fingerprint) problems.push("final system QA verdict is stale because the implementation changed");
    }
    const pendingDecision = active.decisions.some((decision) => decision.status === "pending");
    const exhaustedPhase = active.phases.some((phase) => {
      const records = active.qa_verdicts.filter((item) => item.scope === "phase" && item.phase_id === phase.id);
      const latest = [...records].sort((left, right) => right.recorded_at - left.recorded_at)[0];
      return latest?.verdict !== "pass" && records.length >= qaPolicy.max_cycles;
    });
    const systemRecords = active.qa_verdicts.filter((item) => item.scope === "system");
    const latestSystem = [...systemRecords].sort((left, right) => right.recorded_at - left.recorded_at)[0];
    const exhaustedSystem = latestSystem?.verdict !== "pass" && systemRecords.length >= qaPolicy.max_cycles;
    return {
      problems,
      forceContinuation: problems.length > 0
        && active.status !== "paused"
        && !pendingDecision
        && !exhaustedPhase
        && !exhaustedSystem,
    };
  }

  formatPromptContext(): string {
    const initiative = this.initiatives.getActive();
    if (!initiative) return "";
    const task = this.tasks.get(initiative.task_id);
    const policy = this.repoPolicy.resolveQaPolicy(task?.policy_context);
    if (policy.profile === "off") return "## ITSOL Initiative QA\nRepository policy sets qa.profile=off. Skip QA planning/verdict gates and report QA as explicitly policy-skipped; do not invent evidence.";
    const latest = [...this.verdicts].filter((item) => item.initiative_id === initiative.initiative_id).sort((a, b) => b.recorded_at - a.recorded_at)[0];
    return [
      "## ITSOL Initiative QA loop (extension-managed)",
      `Effective QA policy: ${policy.profile} · max cycles ${policy.max_cycles} · configured types ${policy.application_types.join(", ") || "auto-detect"} · commands ${policy.commands.join("; ") || "none"}.`,
      "Every initiative phase requires an application-aware QA plan and fingerprint-bound passing verdict. After all phases, run final system QA against the current integrated implementation.",
      "Use itsol_qa_plan, execute every returned packet through harness-native delegation, then consolidate real evidence with itsol_qa_verdict.",
      "On QA failure route to implementation-fix, plan-revision, or user-decision. Fix/replan, rerun required plan and code review, then create and execute a fresh QA plan. Do not complete or hand off while executable QA work remains.",
      `Latest QA: ${latest ? `${latest.scope}${latest.phase_id ? ` ${latest.phase_id}` : ""} ${latest.verdict} (${latest.qa_plan_id})` : "none"}`,
    ].join("\n");
  }

  private persist(): void {
    this.pi.appendEntry(ENTRY_TYPE, { plans: this.plans, verdicts: this.verdicts });
  }

  private updateHud(): void {
    if (!this.context?.hasUI) return;
    const initiativeId = this.initiatives.getActive()?.initiative_id;
    const latest = initiativeId
      ? [...this.verdicts].filter((item) => item.initiative_id === initiativeId).sort((a, b) => b.recorded_at - a.recorded_at)[0]
      : undefined;
    this.context.ui.setStatus("itsol-qa", latest
      ? `QA ${latest.scope}${latest.phase_id ? ` ${latest.phase_id}` : ""} · ${latest.verdict} · ${latest.covered_surfaces.length}/${latest.required_coverage.length} coverage`
      : initiativeId ? "QA pending" : undefined);
  }
}

export function registerQaOrchestrator(
  pi: ExtensionAPI,
  tasks: TaskStateStore,
  initiatives: InitiativeManager,
  agents: ItsolAgentConfig[],
  repoPolicy: RepoPolicyManager,
): QaOrchestrator {
  const orchestrator = new QaOrchestrator(pi, tasks, initiatives, agents, repoPolicy);
  pi.registerTool({
    name: "itsol_qa_plan",
    label: "ITSOL QA Plan",
    description: "Create an application-aware, fingerprint-bound initiative QA matrix and specialist execution packets for web/browser, API, backend, CLI, Electron, mobile, data, infrastructure, or final system QA.",
    promptSnippet: "Plan application-aware QA for an initiative phase or integrated system",
    promptGuidelines: [
      "Call after implementation and a passing current code-review verdict for the phase/system under test.",
      "Execute every returned packet in the declared batches; browser, desktop, CLI, API, data, and infrastructure evidence must come from the appropriate harness-native capability.",
      "After executions, call itsol_qa_verdict with all required coverage, observed checks, findings, and unverified gaps.",
    ],
    parameters: QaPlanParamsSchema,
    async execute(_id, params, signal, _update, ctx) {
      const plan = await orchestrator.createPlan(params, ctx, signal);
      return {
        content: [{ type: "text", text: [
          `QA plan ${plan.id}: ${plan.status}`,
          `Scope: ${plan.scope}${plan.phaseId ? ` ${plan.phaseId}` : ""} · profile ${plan.profile} · cycle ${plan.cycle}/${plan.maxCycles} · fingerprint ${plan.fingerprint.slice(0, 12)}`,
          `Required coverage: ${plan.requiredCoverage.join(", ")}`,
          `Coverage gaps: ${plan.coverageGaps.join(", ") || "none"}`,
          `Batches: ${plan.batches.map((batch, index) => `${index + 1}=[${batch.join(", ")}]`).join("; ") || "none"}`,
          "Delegations:",
          JSON.stringify(plan.delegations, null, 2),
        ].join("\n") }],
        details: { plan },
      };
    },
    renderCall(args, theme) {
      return new Text(`${theme.fg("toolTitle", theme.bold("itsol_qa_plan "))}${theme.fg("accent", args.scope)}${theme.fg("muted", args.phase_id ? ` · ${args.phase_id}` : "")}`, 0, 0);
    },
    renderResult(result, _options, theme) {
      const plan = (result.details as { plan?: QaPlan } | undefined)?.plan;
      if (!plan) return new Text("(no QA plan)", 0, 0);
      return new Text([
        theme.fg(plan.status === "ready" ? "success" : "warning", `${plan.status === "ready" ? "✓" : "!"} QA ${plan.scope}${plan.phaseId ? ` ${plan.phaseId}` : ""}`),
        theme.fg("muted", `${plan.profile} · cycle ${plan.cycle}/${plan.maxCycles} · ${plan.delegations.length} packets · ${plan.batches.length} batches · ${plan.requiredCoverage.length} required surfaces`),
        plan.coverageGaps.length ? theme.fg("warning", `gaps: ${plan.coverageGaps.join(", ")}`) : theme.fg("dim", `fingerprint ${plan.fingerprint.slice(0, 12)}`),
      ].join("\n"), 0, 0);
    },
  });

  pi.registerTool({
    name: "itsol_qa_verdict",
    label: "ITSOL QA Verdict",
    description: "Consolidate executed QA checks into a fingerprint-bound pass/fail/blocked verdict, persist initiative phase/system QA state, and route failures back to implementation, planning, or a user decision.",
    promptSnippet: "Record a fingerprint-bound initiative QA verdict and route failures",
    promptGuidelines: [
      "Do not mark PASS from planned checks or agent labels; include concrete observed evidence for every required surface.",
      "On failure choose implementation-fix, plan-revision, or user-decision, then continue the corresponding workflow and rerun QA after changes.",
    ],
    parameters: QaVerdictParamsSchema,
    async execute(_id, params, signal, _update, ctx) {
      const verdict = await orchestrator.recordVerdict(params, ctx, signal);
      return {
        content: [{ type: "text", text: [
          `QA verdict: ${verdict.verdict.toUpperCase()}`,
          `Scope: ${verdict.scope}${verdict.phase_id ? ` ${verdict.phase_id}` : ""}`,
          `Coverage gaps: ${verdict.coverage_gaps.join(", ") || "none"}`,
          `Findings: ${verdict.findings} · unverified: ${verdict.unverified.join("; ") || "none"}`,
          verdict.verdict === "pass"
            ? "QA passed for this fingerprint. Continue to phase completion or final initiative completion."
            : `Route: ${verdict.failure_route}. Resolve, rerun applicable plan/code review, and execute fresh QA before completion.`,
        ].join("\n") }],
        details: { verdict },
      };
    },
    renderCall(args, theme) {
      return new Text(`${theme.fg("toolTitle", theme.bold("itsol_qa_verdict "))}${theme.fg("accent", args.plan_id)}`, 0, 0);
    },
    renderResult(result, _options, theme) {
      const verdict = (result.details as { verdict?: QaVerdictRecord } | undefined)?.verdict;
      if (!verdict) return new Text("(no QA verdict)", 0, 0);
      const color = verdict.verdict === "pass" ? "success" : verdict.verdict === "fail" ? "warning" : "error";
      return new Text(`${theme.fg(color, verdict.verdict.toUpperCase())} · ${verdict.scope}${verdict.phase_id ? ` ${verdict.phase_id}` : ""} · ${verdict.covered_surfaces.length}/${verdict.required_coverage.length} coverage`, 0, 0);
    },
  });
  return orchestrator;
}
