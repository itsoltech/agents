// Risk-based review coverage and specialist routing for itsol-workflow-mode and itsol-execution-policy.
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_LINES,
  formatSize,
  truncateHead,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import type { ItsolAgentConfig } from "./agents.ts";
import { STOP_RANK, type DelegatedTask } from "./policy.ts";
import {
  type ResolvedReviewPolicy,
  type ReviewProfile,
  RepoPolicyManager,
} from "./repo-policy.ts";
import type { TaskStateStore } from "./task-state.ts";

const ENTRY_TYPE = "itsol-review-plans";
const BASE_COVERAGE = ["scope", "correctness", "tests", "maintainability"];

interface ChangedFile {
  path: string;
  status: string;
  added: number;
  deleted: number;
  surfaces: string[];
}

interface ReviewerCandidate {
  agent: string;
  surface: string;
  rationale: string;
  priority: number;
}

interface ReviewDelegation extends DelegatedTask {
  agent: string;
  role: "review";
}

interface ReviewPlan {
  id: string;
  taskId: string;
  target: string;
  targetKind: ReviewPlanParams["target"];
  base?: string;
  head?: string;
  profile: ReviewProfile;
  policySignature: string;
  round: number;
  fingerprint: string;
  createdAt: number;
  files: ChangedFile[];
  totalLines: number;
  requiredCoverage: string[];
  mandatorySubagents: boolean;
  inlineAllowed: boolean;
  status: "inline" | "ready" | "blocked";
  selectedReviewers: ReviewerCandidate[];
  coverageGaps: string[];
  delegations: ReviewDelegation[];
  batches: string[][];
}

export interface ReviewCompletionDecision {
  managed: true;
  required: boolean;
  problems: string[];
  profile: ReviewProfile;
}

interface ConsolidatedReviewResult {
  verdict: "approve" | "changes-requested" | "blocked";
  findings: ReviewFinding[];
  coverageGaps: string[];
}

const ReviewPlanParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1 }),
  target: StringEnum(["working-tree", "staged", "range"] as const),
  base: Type.Optional(Type.String({ minLength: 1 })),
  head: Type.Optional(Type.String({ minLength: 1 })),
  acceptance_criteria: Type.Array(Type.String()),
  test_evidence: Type.Array(Type.String()),
});

type ReviewPlanParams = Static<typeof ReviewPlanParamsSchema>;

const ReviewFindingSchema = Type.Object({
  intent: StringEnum(["Blocker", "Should", "Question", "Suggestion", "Nit", "Note"] as const),
  severity: StringEnum(["critical", "high", "medium", "low", "info"] as const),
  title: Type.String({ minLength: 1 }),
  file: Type.Optional(Type.String()),
  line: Type.Optional(Type.Integer({ minimum: 1 })),
  evidence: Type.String({ minLength: 1 }),
  source: Type.String({ minLength: 1 }),
});

const ReviewVerdictParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1 }),
  plan_id: Type.String({ minLength: 1 }),
  covered_surfaces: Type.Array(Type.String()),
  findings: Type.Array(ReviewFindingSchema),
  unverified: Type.Array(Type.String()),
});

type ReviewFinding = Static<typeof ReviewFindingSchema>;
type ReviewVerdictParams = Static<typeof ReviewVerdictParamsSchema>;

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function classifySurfaces(filePath: string): string[] {
  const file = filePath.toLowerCase();
  const ext = path.extname(file);
  const surfaces: string[] = [];
  if (/(^|\/)(test|tests|spec|specs|__tests__)(\/|\.)|\.(test|spec)\./.test(file)) surfaces.push("tests");
  if (/\.(svelte|tsx|jsx|css|scss|vue)$/.test(file) || /(frontend|ui|components|pages|app\/)/.test(file)) surfaces.push("frontend", "ui-ux");
  if (/\.(cs|rs|go|java|kt|py)$/.test(file) || /(api|backend|server|controllers|handlers|services)\//.test(file)) surfaces.push("backend");
  if (/(auth|oauth|session|permission|authoriz|tenant|secret|credential|token|crypto|security)/.test(file)) surfaces.push("security");
  if (/(migration|schema|database|postgres|mongo|mssql|sqlserver|prisma|\.sql$)/.test(file)) surfaces.push("data");
  if (/(dockerfile|docker-compose|\.nomad|terraform|\.tf$|k8s|kubernetes|helm|nginx|traefik|infra\/|deploy|observability)/.test(file)) surfaces.push("infrastructure");
  if (/(openapi|swagger|generated|codegen|api-client|client\.gen)/.test(file)) surfaces.push("api-contracts");
  if (/(migration|rewrite|legacy|cutover|strangler)/.test(file)) surfaces.push("migration");
  if (/(package\.json|package-lock|pnpm-lock|yarn\.lock|bun\.lock|build\.zig|cargo\.toml|\.csproj|global\.json)/.test(file)) surfaces.push("current-tech", "supply-chain");
  if (/\.(md|mdx|txt)$/.test(file) || file.includes("docs/")) surfaces.push("documentation");
  if ([".ts", ".js", ".mjs", ".cjs"].includes(ext) && !surfaces.includes("frontend")) surfaces.push("typescript");
  return unique(surfaces);
}

function classifyContent(content: string): string[] {
  const text = content.toLowerCase();
  const surfaces: string[] = [];
  if (/(authorization|permission|tenant|password|secret|credential|access[_-]?token|refresh[_-]?token|dangerouslysetinnerhtml|\beval\(|\bexec\()/.test(text)) surfaces.push("security");
  if (/(create table|alter table|drop table|migration|transaction|select\s+.+\s+from|insert\s+into|update\s+.+\s+set)/.test(text)) surfaces.push("data");
  if (/(openapi|swagger|components\/schemas|operationid|generated client)/.test(text)) surfaces.push("api-contracts");
  if (/(docker|nomad|terraform|kubernetes|readiness|liveness|reverse proxy|tls|rollback)/.test(text)) surfaces.push("infrastructure");
  if (/(package\.json|dependencies|devdependencies|lockfileversion)/.test(text)) surfaces.push("current-tech", "supply-chain");
  return unique(surfaces);
}

function patchSurfaces(output: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  let current: string | undefined;
  let content = "";
  const flush = () => {
    if (current) result.set(current, classifyContent(content));
    content = "";
  };
  for (const line of output.split("\n")) {
    const header = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (header) {
      flush();
      current = header[2];
      continue;
    }
    if (current && /^[+-](?![+-])/.test(line)) content += `${line.slice(1)}\n`;
  }
  flush();
  return result;
}

function reviewerCandidates(files: ChangedFile[]): ReviewerCandidate[] {
  const allPaths = files.map((file) => file.path.toLowerCase()).join("\n");
  const surfaces = new Set(files.flatMap((file) => file.surfaces));
  const candidates: ReviewerCandidate[] = [];
  const add = (agent: string, surface: string, rationale: string, priority: number) =>
    candidates.push({ agent, surface, rationale, priority });

  if (surfaces.has("security")) {
    if (/(authoriz|permission|tenant)/.test(allPaths)) add("security-authz-tenant-review", "security", "authorization or tenant boundary changes", 100);
    else if (/(auth|oauth|session|token)/.test(allPaths)) add("security-auth-session-review", "security", "authentication or session changes", 100);
    else if (/(secret|credential|config)/.test(allPaths)) add("security-secrets-config-review", "security", "secret or configuration handling", 100);
    else add("security-api-input-review", "security", "security-sensitive input or trust boundary", 100);
  }
  if (surfaces.has("data")) {
    if (/(mongo)/.test(allPaths)) add("mongodb-review", "data", "MongoDB schema or query changes", 90);
    else if (/(mssql|sqlserver|\.cs)/.test(allPaths)) add("mssql-review", "data", "SQL Server or .NET data changes", 90);
    else add("postgres-review", "data", "database schema, migration, or query changes", 90);
  }
  if (surfaces.has("infrastructure")) {
    if (/(dockerfile|docker-compose)/.test(allPaths)) add("infra-container-runtime-review", "infrastructure", "container runtime changes", 88);
    else if (/\.nomad|nomad/.test(allPaths)) add("infra-nomad-deployment", "infrastructure", "Nomad deployment changes", 88);
    else add("infra-production-readiness-review", "infrastructure", "deployment or production-readiness changes", 88);
  }
  if (surfaces.has("api-contracts")) add("hey-api-openapi-review", "api-contracts", "OpenAPI or generated-client contract changes", 86);
  if (surfaces.has("migration")) add("application-technology-migration", "migration", "migration, rewrite, or cutover risk", 85);
  if (surfaces.has("frontend")) {
    if (files.some((file) => file.path.endsWith(".svelte"))) add("svelte-review", "frontend", "Svelte frontend changes", 75);
    else if (files.some((file) => /\.(tsx|jsx)$/.test(file.path))) add("react-nextjs-review", "frontend", "React or Next.js frontend changes", 75);
    else add("ui-code-review", "frontend", "visible frontend or UI changes", 72);
  }
  if (surfaces.has("backend")) {
    if (files.some((file) => file.path.endsWith(".cs"))) add("dotnet-web-api-review", "backend", ".NET backend changes", 74);
    else if (files.some((file) => file.path.endsWith(".rs"))) add("rust-review", "backend", "Rust backend changes", 74);
    else if (surfaces.has("typescript")) add("itsol-code-review-workflow", "backend", "general TypeScript backend and workflow-level correctness", 68);
  }
  if (surfaces.has("current-tech")) add("itsol-current-tech-context", "current-tech", "dependency or tool-version-sensitive changes", 65);
  if (surfaces.has("tests")) add("itsol-tdd-workflow", "tests", "test strategy and TDD evidence", 55);

  const byAgent = new Map<string, ReviewerCandidate>();
  for (const candidate of candidates.sort((left, right) => right.priority - left.priority)) {
    if (!byAgent.has(candidate.agent)) byAgent.set(candidate.agent, candidate);
  }
  return [...byAgent.values()];
}

function reviewDiffArgs(params: Pick<ReviewPlanParams, "target" | "base" | "head">): string[] {
  if (params.target === "range") {
    if (!params.base) throw new Error("range target requires base");
    return ["diff", `${params.base}...${params.head ?? "HEAD"}`];
  }
  return params.target === "staged" ? ["diff", "--cached"] : ["diff", "HEAD"];
}

const CODE_REVIEW_PATHSPEC = [".", ":(exclude).itsol/initiatives/**"];

async function currentFingerprint(
  pi: ExtensionAPI,
  params: Pick<ReviewPlanParams, "target" | "base" | "head">,
  cwd: string,
  signal?: AbortSignal,
): Promise<string> {
  const diff = await pi.exec("git", [...reviewDiffArgs(params), "--binary", "--", ...CODE_REVIEW_PATHSPEC], { cwd, signal });
  if (diff.code !== 0) throw new Error(`Unable to fingerprint git diff: ${diff.stderr}`);
  const hash = crypto.createHash("sha256").update(params.target).update(params.base ?? "").update(params.head ?? "").update(diff.stdout);
  if (params.target === "working-tree") {
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
  }
  return hash.digest("hex");
}

export async function currentWorktreeFingerprint(
  pi: ExtensionAPI,
  cwd: string,
  signal?: AbortSignal,
): Promise<string> {
  return currentFingerprint(pi, { target: "working-tree" }, cwd, signal);
}

function parseNumstat(output: string): Map<string, { added: number; deleted: number }> {
  const result = new Map<string, { added: number; deleted: number }>();
  for (const line of output.split("\n")) {
    const [added, deleted, ...pathParts] = line.split("\t");
    if (!pathParts.length) continue;
    result.set(pathParts.join("\t"), {
      added: added === "-" ? 0 : Number(added) || 0,
      deleted: deleted === "-" ? 0 : Number(deleted) || 0,
    });
  }
  return result;
}

function parseNameStatus(output: string): Array<{ status: string; path: string }> {
  const files: Array<{ status: string; path: string }> = [];
  for (const line of output.split("\n")) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;
    files.push({ status: parts[0], path: parts.at(-1)! });
  }
  return files;
}

function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [];
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

async function boundedOutput(prefix: string, id: string, output: string): Promise<string> {
  const truncated = truncateHead(output, { maxBytes: DEFAULT_MAX_BYTES, maxLines: DEFAULT_MAX_LINES });
  if (!truncated.truncated) return output;
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  const fullPath = path.join(directory, `${id.replace(/[^a-z0-9-]/gi, "_")}.txt`);
  await fs.promises.writeFile(fullPath, output, { encoding: "utf8", mode: 0o600 });
  return `${truncated.content}\n\n[Output truncated: ${truncated.outputLines}/${truncated.totalLines} lines, ${formatSize(truncated.outputBytes)}/${formatSize(truncated.totalBytes)}. Full output: ${fullPath}]`;
}

function findingKey(finding: ReviewFinding): string {
  return `${finding.file ?? ""}:${finding.line ?? ""}:${finding.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()}`;
}

function codeReviewPolicySignature(policy: ResolvedReviewPolicy): string {
  const { plan_max_rounds: _planMaxRounds, ...codeReviewPolicy } = policy;
  return crypto.createHash("sha256").update(JSON.stringify(codeReviewPolicy)).digest("hex");
}

const SEVERITY_RANK: Record<ReviewFinding["severity"], number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export class ReviewOrchestrator {
  private readonly plans = new Map<string, ReviewPlan>();
  private readonly overrides = new Map<string, ReviewProfile>();
  private readonly rereviewNotices = new Set<string>();
  private context?: ExtensionContext;

  constructor(
    private readonly pi: ExtensionAPI,
    private readonly store: TaskStateStore,
    private readonly agents: ItsolAgentConfig[],
    private readonly repoPolicy: RepoPolicyManager,
  ) {}

  startSession(ctx: ExtensionContext): void {
    this.plans.clear();
    this.overrides.clear();
    this.rereviewNotices.clear();
    this.context = ctx;
    const entries = ctx.sessionManager.getBranch();
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index];
      if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE) continue;
      const data = entry.data as { plans?: ReviewPlan[]; overrides?: Record<string, ReviewProfile> } | undefined;
      for (const plan of data?.plans ?? []) this.plans.set(plan.id, plan);
      for (const [taskId, profile] of Object.entries(data?.overrides ?? {})) this.overrides.set(taskId, profile);
      break;
    }
    this.updateStatus();
  }

  resolvePolicy(taskId: string): ResolvedReviewPolicy {
    const state = this.store.get(taskId);
    if (!state) throw new Error(`Unknown ITSOL task state: ${taskId}`);
    const resolved = this.repoPolicy.resolveReviewPolicy(state.policy_context, this.overrides.get(taskId));
    return {
      ...resolved,
      max_rounds: Math.min(resolved.max_rounds, state.execution_policy.max_review_rounds),
    };
  }

  setProfile(taskId: string, profile: ReviewProfile): ResolvedReviewPolicy {
    const state = this.store.get(taskId);
    if (!state) throw new Error(`Unknown ITSOL task state: ${taskId}`);
    if (state.active_agents.length) throw new Error("Cannot change review profile while delegated agents are active");
    this.repoPolicy.resolveReviewPolicy(state.policy_context, profile);
    if (this.overrides.get(taskId) === profile) return this.resolvePolicy(taskId);
    this.overrides.set(taskId, profile);
    this.store.resetReview(taskId);
    this.persist();
    this.updateStatus();
    return this.resolvePolicy(taskId);
  }

  clearProfile(taskId: string): ResolvedReviewPolicy {
    const state = this.store.get(taskId);
    if (!state) throw new Error(`Unknown ITSOL task state: ${taskId}`);
    if (state.active_agents.length) throw new Error("Cannot change review profile while delegated agents are active");
    if (!this.overrides.has(taskId)) return this.resolvePolicy(taskId);
    this.overrides.delete(taskId);
    this.store.resetReview(taskId);
    this.persist();
    this.updateStatus();
    return this.resolvePolicy(taskId);
  }

  async completionDecision(taskId: string, ctx: ExtensionContext): Promise<ReviewCompletionDecision> {
    const state = this.store.get(taskId);
    if (!state) return { managed: true, required: false, problems: [], profile: "off" };
    const policy = this.resolvePolicy(taskId);
    const plan = this.latestPlan(taskId);
    const policySignature = codeReviewPolicySignature(policy);
    const stageRequiresReview = STOP_RANK[state.execution_policy.stop_after] >= STOP_RANK.implementation;
    const reviewStarted = Boolean(plan && plan.policySignature === policySignature);
    const triggerRequiresReview = policy.trigger !== "manual" || reviewStarted;
    const required = policy.profile !== "off"
      && triggerRequiresReview
      && policy.max_rounds > 0
      && (stageRequiresReview || reviewStarted);
    if (!required) return { managed: true, required: false, problems: [], profile: policy.profile };
    const problems: string[] = [];
    if (!plan) problems.push(`review profile=${policy.profile} requires itsol_review_plan`);
    if (plan && (plan.profile !== policy.profile || plan.policySignature !== policySignature)) {
      problems.push(`review plan policy is stale; effective profile=${policy.profile}`);
    }
    if (!state.review_verdict) problems.push("review profile requires itsol_review_verdict");
    if (plan && state.review_verdict) {
      if (state.review_verdict.plan_id !== plan.id || state.review_verdict.fingerprint !== plan.fingerprint) {
        problems.push("review verdict does not belong to the latest review plan");
      }
      const fingerprint = await currentFingerprint(this.pi, { target: plan.targetKind, base: plan.base, head: plan.head }, ctx.cwd);
      if (fingerprint !== plan.fingerprint) problems.push("review verdict is stale because the reviewed diff changed");
    }
    if (state.review_runs > policy.max_rounds) problems.push(`review rounds ${state.review_runs}/${policy.max_rounds} exceed policy`);
    return { managed: true, required, problems, profile: policy.profile };
  }

  formatPromptContext(): string {
    const state = this.store.getActive();
    if (!state) return "";
    const policy = this.resolvePolicy(state.task_id);
    const verdict = state.review_verdict?.verdict ?? "none";
    return [
      "## ITSOL review policy (extension-managed)",
      `Profile: ${policy.profile}; trigger: ${policy.trigger}; delegation: ${policy.delegation}; automatic re-review: ${policy.auto_rereview}; code-review rounds: ${state.review_runs}/${policy.max_rounds}; plan Rubber Duck cap: ${policy.plan_max_rounds} per artifact; verdict: ${verdict}.`,
      policy.profile === "off" || policy.max_rounds === 0
        ? "Review orchestration is disabled for this task. Do not add review ceremony unless the user explicitly asks."
        : policy.trigger === "manual"
          ? "Review is manual. Run it only when the user explicitly requests it."
          : "Run one final review before completion. Do not review after every edit.",
    ].join("\n");
  }

  async autoRereviewNotice(toolName: string, ctx: ExtensionContext): Promise<string | undefined> {
    if (!["edit", "write", "bash", "itsol_delegate"].includes(toolName)) return undefined;
    const state = this.store.getActive();
    if (!state || state.review_verdict?.verdict !== "changes-requested") return undefined;
    const policy = this.resolvePolicy(state.task_id);
    if (policy.auto_rereview === "never" || state.review_runs >= policy.max_rounds) return undefined;
    const plan = this.latestPlan(state.task_id);
    if (!plan) return undefined;
    const fingerprint = await currentFingerprint(this.pi, { target: plan.targetKind, base: plan.base, head: plan.head }, ctx.cwd);
    if (fingerprint === plan.fingerprint || this.rereviewNotices.has(state.task_id)) return undefined;
    this.rereviewNotices.add(state.task_id);
    return `ITSOL automatic re-review is due: fixes changed the reviewed diff and round ${state.review_runs + 1}/${policy.max_rounds} is available. Run itsol_review_plan for task ${state.task_id}, execute required reviewers, then call itsol_review_verdict. Do not start additional review rounds after the configured cap.`;
  }

  async createPlan(params: ReviewPlanParams, ctx: ExtensionContext, signal?: AbortSignal): Promise<ReviewPlan> {
    const state = this.store.get(params.task_id);
    if (!state) throw new Error(`Unknown ITSOL task state: ${params.task_id}`);
    const policy = this.resolvePolicy(params.task_id);
    if (policy.profile === "off" || policy.max_rounds === 0) {
      throw new Error(`Review is disabled for task ${params.task_id} by profile=${policy.profile} or the execution ceiling`);
    }
    if (state.review_runs >= policy.max_rounds) {
      throw new Error(`Review round limit reached: ${state.review_runs}/${policy.max_rounds}`);
    }
    const diffArgs = reviewDiffArgs(params);
    const fingerprint = await currentFingerprint(this.pi, params, ctx.cwd, signal);

    const [numstatResult, namesResult, patchResult] = await Promise.all([
      this.pi.exec("git", [...diffArgs, "--numstat", "--", ...CODE_REVIEW_PATHSPEC], { cwd: ctx.cwd, signal }),
      this.pi.exec("git", [...diffArgs, "--name-status", "--", ...CODE_REVIEW_PATHSPEC], { cwd: ctx.cwd, signal }),
      this.pi.exec("git", [...diffArgs, "--unified=0", "--", ...CODE_REVIEW_PATHSPEC], { cwd: ctx.cwd, signal }),
    ]);
    if (numstatResult.code !== 0 || namesResult.code !== 0 || patchResult.code !== 0) {
      throw new Error(`Unable to inspect git diff: ${numstatResult.stderr || namesResult.stderr || patchResult.stderr}`);
    }
    const stats = parseNumstat(numstatResult.stdout);
    const names = parseNameStatus(namesResult.stdout);
    const contentSurfaces = patchSurfaces(patchResult.stdout.slice(0, 2_000_000));
    if (params.target === "working-tree") {
      const untracked = await this.pi.exec("git", ["ls-files", "--others", "--exclude-standard"], {
        cwd: ctx.cwd,
        signal,
      });
      if (untracked.code === 0) {
        for (const file of untracked.stdout.split("\n").filter((item) => item && !item.replaceAll("\\", "/").startsWith(".itsol/initiatives/"))) {
          if (!names.some((entry) => entry.path === file)) names.push({ status: "??", path: file });
          if (!stats.has(file)) {
            try {
              const lines = fs.readFileSync(path.join(ctx.cwd, file), "utf8").split("\n").length;
              stats.set(file, { added: lines, deleted: 0 });
              const content = fs.readFileSync(path.join(ctx.cwd, file), "utf8").slice(0, 200_000);
              contentSurfaces.set(file, classifyContent(content));
            } catch {
              stats.set(file, { added: 0, deleted: 0 });
            }
          }
        }
      }
    }

    const files = names.map((entry) => ({
      path: entry.path,
      status: entry.status,
      added: stats.get(entry.path)?.added ?? 0,
      deleted: stats.get(entry.path)?.deleted ?? 0,
      surfaces: unique([...classifySurfaces(entry.path), ...(contentSurfaces.get(entry.path) ?? [])]),
    }));
    if (!files.length) throw new Error("Review target has no changed files");
    const totalLines = files.reduce((total, file) => total + file.added + file.deleted, 0);
    const changedSurfaces = unique(files.flatMap((file) => file.surfaces));
    const domainSurfaces = changedSurfaces.filter((surface) => [
      "frontend",
      "backend",
      "security",
      "data",
      "infrastructure",
      "api-contracts",
      "migration",
      "supply-chain",
    ].includes(surface));
    const sensitive = changedSurfaces.some((surface) =>
      ["security", "data", "infrastructure", "api-contracts", "migration", "supply-chain"].includes(surface));
    const riskRequiresSubagents = sensitive
      || domainSurfaces.length > 1
      || files.length > 5
      || totalLines > 250
      || (policy.profile === "strict" && domainSurfaces.length > 0);
    const mandatorySubagents = policy.delegation === "always"
      || (policy.delegation === "risk-based" && riskRequiresSubagents);
    const inlineAllowed = policy.delegation === "never"
      || (!mandatorySubagents && domainSurfaces.length <= 1 && files.length <= 5 && totalLines <= 250);
    const requiredCoverage = unique([...BASE_COVERAGE, ...changedSurfaces]);
    const reviewTooLarge = files.length > 100 || totalLines > 10_000;

    const knownAgents = new Set(this.agents.map((agent) => agent.name));
    const candidates = reviewerCandidates(files).filter((candidate) => knownAgents.has(candidate.agent));
    if (policy.delegation === "always" && !candidates.length && knownAgents.has("itsol-code-review-workflow")) {
      candidates.push({ agent: "itsol-code-review-workflow", surface: "general", rationale: "profile requires independent review", priority: 50 });
    }
    const used = this.store.getUsedAgents(params.task_id);
    let remainingDistinct = state.execution_policy.max_subagents === "unlimited"
      ? Number.POSITIVE_INFINITY
      : Math.max(0, state.execution_policy.max_subagents - used.size);
    const selected: ReviewerCandidate[] = [];
    const gaps: string[] = [];
    if (mandatorySubagents) {
      if (reviewTooLarge) gaps.push("review target is too large; split the diff before independent review");
      for (const candidate of reviewTooLarge ? [] : candidates) {
        if (used.has(candidate.agent)) selected.push(candidate);
        else if (remainingDistinct > 0) {
          selected.push(candidate);
          remainingDistinct--;
        }
      }
      const independentlyRequired = changedSurfaces.filter((surface) =>
        ["security", "data", "infrastructure", "api-contracts", "migration", "frontend", "backend"].includes(surface));
      if (changedSurfaces.includes("supply-chain")) independentlyRequired.push("current-tech");
      for (const surface of unique(independentlyRequired)) {
        if (!selected.some((candidate) => candidate.surface === surface)) gaps.push(`${surface}: no independent reviewer selected`);
      }
    }

    const delegations: ReviewDelegation[] = selected.map((candidate) => {
      const scopedFiles = files.filter((file) => file.surfaces.includes(candidate.surface));
      const reviewFiles = scopedFiles.length ? scopedFiles : files;
      return {
        agent: candidate.agent,
        role: "review",
        task: [
          `Review only the ${candidate.surface} surface for task ${params.task_id}.`,
          candidate.rationale,
          `Changed files in scope: ${reviewFiles.map((file) => file.path).join(", ")}.`,
          `Acceptance criteria: ${params.acceptance_criteria.join("; ") || "not provided"}.`,
          `Test evidence: ${params.test_evidence.join("; ") || "not provided"}.`,
          "Return evidence-first findings with intent, severity, file references, affected behavior, verification, assumptions, unverified gaps, and the required ITSOL envelope. Do not modify files.",
        ].join("\n"),
        read_scope: reviewFiles.map((file) => file.path),
        write_scope: [],
        forbidden_scope: [],
        operations: ["code-review"],
        required_evidence: ["coverage inspected", "file references", "verification and gaps"],
        stop_after: "analysis",
      };
    });
    const batches = chunk(delegations.map((delegation) => delegation.agent), state.execution_policy.max_parallel);
    const status: ReviewPlan["status"] = mandatorySubagents
      ? gaps.length || !delegations.length || state.execution_policy.max_parallel === 0 ? "blocked" : "ready"
      : "inline";
    const plan: ReviewPlan = {
      id: `review-${params.task_id}-${Date.now()}`,
      taskId: params.task_id,
      target: params.target === "range" ? `${params.base}...${params.head ?? "HEAD"}` : params.target,
      targetKind: params.target,
      base: params.base,
      head: params.head,
      profile: policy.profile,
      policySignature: codeReviewPolicySignature(policy),
      round: state.review_runs + 1,
      fingerprint,
      createdAt: Date.now(),
      files,
      totalLines,
      requiredCoverage,
      mandatorySubagents,
      inlineAllowed,
      status,
      selectedReviewers: selected,
      coverageGaps: unique(gaps),
      delegations,
      batches,
    };
    this.store.prepareReviewers(params.task_id, selected.map((reviewer) => reviewer.agent));
    this.rereviewNotices.delete(params.task_id);
    this.plans.set(plan.id, plan);
    this.persist();
    this.updateStatus();
    return plan;
  }

  async consolidate(params: ReviewVerdictParams, ctx?: ExtensionContext): Promise<ConsolidatedReviewResult> {
    const plan = this.plans.get(params.plan_id);
    if (!plan || plan.taskId !== params.task_id) throw new Error(`Unknown review plan: ${params.plan_id}`);
    const state = this.store.get(params.task_id);
    if (!state) throw new Error(`Unknown ITSOL task state: ${params.task_id}`);
    const policy = this.resolvePolicy(params.task_id);
    const policySignature = codeReviewPolicySignature(policy);
    if (plan.policySignature !== policySignature) throw new Error("Review plan policy is stale; build a fresh plan");
    if (ctx) {
      const fingerprint = await currentFingerprint(this.pi, { target: plan.targetKind, base: plan.base, head: plan.head }, ctx.cwd);
      if (fingerprint !== plan.fingerprint) throw new Error("Review plan diff is stale; build a fresh plan before recording a verdict");
    }
    if (plan.round !== state.review_runs + 1) {
      throw new Error(`Review plan round ${plan.round} is stale; next allowed round is ${state.review_runs + 1}`);
    }
    if (plan.round > policy.max_rounds) throw new Error(`Review round ${plan.round} exceeds max_rounds=${policy.max_rounds}`);

    const deduplicated = new Map<string, ReviewFinding>();
    for (const finding of params.findings) {
      const key = findingKey(finding);
      const previous = deduplicated.get(key);
      if (!previous || SEVERITY_RANK[finding.severity] > SEVERITY_RANK[previous.severity]) {
        deduplicated.set(key, finding);
      }
    }
    const findings = [...deduplicated.values()].sort((left, right) =>
      SEVERITY_RANK[right.severity] - SEVERITY_RANK[left.severity]);
    const covered = new Set(params.covered_surfaces);
    const coverageGaps = plan.requiredCoverage.filter((surface) => !covered.has(surface));
    coverageGaps.push(...params.unverified, ...plan.coverageGaps);
    const unresolvedReviewers = plan.selectedReviewers
      .filter((reviewer) => state.agent_results[reviewer.agent]?.status !== "completed")
      .map((reviewer) => `${reviewer.surface}: ${reviewer.agent}=${state.agent_results[reviewer.agent]?.status ?? "missing"}`);
    coverageGaps.push(...unresolvedReviewers);

    let verdict: "approve" | "changes-requested" | "blocked" = "approve";
    if (findings.some((finding) => ["Blocker", "Should"].includes(finding.intent)
      || ["critical", "high"].includes(finding.severity))) {
      verdict = "changes-requested";
    }
    if (coverageGaps.length) verdict = "blocked";
    const uniqueGaps = unique(coverageGaps);
    this.store.recordReviewVerdict(params.task_id, {
      plan_id: plan.id,
      fingerprint: plan.fingerprint,
      round: plan.round,
      verdict,
      findings: findings.length,
      coverage_gaps: uniqueGaps,
      recorded_at: Date.now(),
    });
    this.updateStatus();
    return { verdict, findings, coverageGaps: uniqueGaps };
  }

  getPlan(planId: string): ReviewPlan | undefined {
    return this.plans.get(planId);
  }

  private latestPlan(taskId: string): ReviewPlan | undefined {
    return [...this.plans.values()]
      .filter((plan) => plan.taskId === taskId)
      .sort((left, right) => right.createdAt - left.createdAt)[0];
  }

  private updateStatus(): void {
    if (!this.context?.hasUI) return;
    const state = this.store.getActive();
    if (!state) {
      this.context.ui.setStatus("itsol-review", undefined);
      return;
    }
    try {
      const policy = this.resolvePolicy(state.task_id);
      this.context.ui.setStatus(
        "itsol-review",
        `Review ${policy.profile} · ${policy.trigger} · ${state.review_runs}/${policy.max_rounds} · ${state.review_verdict?.verdict ?? "pending"}`,
      );
    } catch {
      this.context.ui.setStatus("itsol-review", "Review policy error");
    }
  }

  private persist(): void {
    this.pi.appendEntry(ENTRY_TYPE, {
      plans: [...this.plans.values()],
      overrides: Object.fromEntries(this.overrides),
    });
  }
}

export function registerReviewOrchestrator(
  pi: ExtensionAPI,
  store: TaskStateStore,
  agents: ItsolAgentConfig[],
  repoPolicy: RepoPolicyManager,
): ReviewOrchestrator {
  const orchestrator = new ReviewOrchestrator(pi, store, agents, repoPolicy);

  pi.registerCommand("itsol-review", {
    description: "Show or override the effective ITSOL review profile for the active task",
    handler: async (args, ctx) => {
      const state = store.getActive();
      if (!state) {
        ctx.ui.notify("No active ITSOL task. Call itsol_task_state first.", "warning");
        return;
      }
      const [action = "status", value] = args.trim().toLowerCase().split(/\s+/);
      try {
        if (action === "rerun") {
          const policy = orchestrator.resolvePolicy(state.task_id);
          if (policy.profile === "off" || policy.max_rounds === 0) {
            ctx.ui.notify("Review is disabled for this task.", "warning");
            return;
          }
          if (state.review_runs >= policy.max_rounds) {
            ctx.ui.notify(`Review round limit reached: ${state.review_runs}/${policy.max_rounds}.`, "warning");
            return;
          }
          pi.sendUserMessage(`Re-run ITSOL review for task ${state.task_id}. Build a fresh itsol_review_plan from the current diff and stay within ${policy.max_rounds} total rounds.`);
          return;
        }
        let policy: ResolvedReviewPolicy;
        if (action === "off") policy = orchestrator.setProfile(state.task_id, "off");
        else if (action === "profile" && value === "default") policy = orchestrator.clearProfile(state.task_id);
        else if (action === "profile" && typeof value === "string"
          && ["off", "poc", "balanced", "strict"].includes(value)) {
          policy = orchestrator.setProfile(state.task_id, value as ReviewProfile);
        } else if (action === "status") policy = orchestrator.resolvePolicy(state.task_id);
        else {
          ctx.ui.notify("Usage: /itsol-review status | profile <off|poc|balanced|strict|default> | off | rerun", "warning");
          return;
        }
        ctx.ui.notify([
          `Review profile: ${policy.profile}`,
          `Trigger: ${policy.trigger}`,
          `Delegation: ${policy.delegation}`,
          `Automatic re-review: ${policy.auto_rereview}`,
          `Code-review rounds: ${state.review_runs}/${policy.max_rounds}`,
          `Plan Rubber Duck rounds per artifact: ${policy.plan_max_rounds}`,
          `Allowed profiles: ${policy.allowed_profiles.join(", ")}`,
        ].join("\n"), "info");
      } catch (error) {
        ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.isError) return;
    const notice = await orchestrator.autoRereviewNotice(event.toolName, ctx);
    if (!notice) return;
    return { content: [...event.content, { type: "text" as const, text: notice }] };
  });

  pi.registerTool({
    name: "itsol_review_plan",
    label: "ITSOL Review Plan",
    description: "Inspect a git diff, build the mandatory review coverage map, decide inline versus multi-agent review, select focused ITSOL reviewers within execution ceilings, and return ready-to-use itsol_delegate task packets.",
    promptSnippet: "Build a risk-based review coverage map and specialist delegation plan",
    promptGuidelines: [
      "Follow the extension-managed review profile. Use itsol_review_plan for required or explicitly requested review, but add no review ceremony when profile=off or trigger=manual without a user request.",
      "Execute review_plan delegations through itsol_delegate, then consolidate all findings with itsol_review_verdict.",
    ],
    parameters: ReviewPlanParamsSchema,
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const plan = await orchestrator.createPlan(params, ctx, signal);
      const lines = [
        `Review plan: ${plan.id}`,
        `Status: ${plan.status}`,
        `Profile: ${plan.profile} · round ${plan.round}`,
        `Target: ${plan.target}`,
        `Files: ${plan.files.length} · changed lines: ${plan.totalLines}`,
        `Coverage: ${plan.requiredCoverage.join(", ")}`,
        `Subagents: ${plan.mandatorySubagents ? "mandatory" : plan.inlineAllowed ? "not required for tiny single-surface diff" : "recommended"}`,
        `Reviewers: ${plan.selectedReviewers.map((reviewer) => `${reviewer.agent} (${reviewer.surface})`).join(", ") || "inline main agent"}`,
        `Batches: ${plan.batches.map((batch) => `[${batch.join(", ")}]`).join(" → ") || "none"}`,
        `Coverage gaps: ${plan.coverageGaps.join("; ") || "none"}`,
      ];
      if (plan.delegations.length) {
        lines.push("Delegation packets:", JSON.stringify(plan.delegations, null, 2));
      }
      const modelOutput = await boundedOutput("itsol-review-plan", plan.id, lines.join("\n"));
      return {
        content: [{ type: "text", text: modelOutput }],
        details: plan,
      };
    },
    renderCall(args, theme) {
      return new Text(
        `${theme.fg("toolTitle", theme.bold("itsol_review_plan "))}${theme.fg("accent", args.task_id)}${theme.fg("muted", ` · ${args.target}`)}`,
        0,
        0,
      );
    },
    renderResult(result, _options, theme) {
      const plan = result.details as ReviewPlan | undefined;
      if (!plan) return new Text("(no review plan)", 0, 0);
      const color = plan.status === "blocked" ? "error" : plan.status === "ready" ? "success" : "accent";
      return new Text([
        theme.fg(color, `${plan.status === "blocked" ? "!" : "✓"} ${plan.status} · ${plan.profile} r${plan.round} · ${plan.files.length} files · ${plan.totalLines} lines`),
        theme.fg("muted", `coverage: ${plan.requiredCoverage.join(", ")}`),
        theme.fg("dim", `reviewers: ${plan.selectedReviewers.map((reviewer) => reviewer.agent).join(", ") || "inline"}`),
        ...(plan.coverageGaps.length ? [theme.fg("warning", `gaps: ${plan.coverageGaps.join("; ")}`)] : []),
      ].join("\n"), 0, 0);
    },
  });

  pi.registerTool({
    name: "itsol_review_verdict",
    label: "ITSOL Review Verdict",
    description: "Consolidate and deduplicate findings from an ITSOL review plan, validate required coverage and reviewer completion, sort findings by severity, and persist an approve, changes-requested, or blocked verdict for itsol_complete.",
    promptSnippet: "Consolidate review findings and persist the final risk verdict",
    promptGuidelines: [
      "Use itsol_review_verdict after inline or delegated review; include every required coverage surface and every unverified gap.",
      "Do not call itsol_complete with completed while itsol_review_verdict is changes-requested or blocked.",
    ],
    parameters: ReviewVerdictParamsSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const result = await orchestrator.consolidate(params, ctx);
      const findingLines = result.findings.map((finding) =>
        `${finding.intent} [${finding.severity}] ${finding.file ?? "general"}${finding.line ? `:${finding.line}` : ""} — ${finding.title}\n  ${finding.evidence}`);
      const output = await boundedOutput("itsol-review-verdict", params.plan_id, [
        `Review verdict: ${result.verdict}`,
        `Findings: ${result.findings.length}`,
        ...findingLines,
        `Coverage gaps: ${result.coverageGaps.join("; ") || "none"}`,
      ].join("\n"));
      return {
        content: [{ type: "text", text: output }],
        details: result,
      };
    },
    renderCall(args, theme) {
      return new Text(
        `${theme.fg("toolTitle", theme.bold("itsol_review_verdict "))}${theme.fg("accent", args.plan_id)}`,
        0,
        0,
      );
    },
    renderResult(result, _options, theme) {
      const details = result.details as ConsolidatedReviewResult | undefined;
      if (!details) return new Text("(no verdict)", 0, 0);
      const color = details.verdict === "approve" ? "success" : details.verdict === "changes-requested" ? "warning" : "error";
      return new Text([
        theme.fg(color, `${details.verdict} · ${details.findings.length} findings`),
        theme.fg("muted", details.findings.slice(0, 5).map((finding) => `${finding.intent}: ${finding.title}`).join("\n") || "No findings"),
        ...(details.coverageGaps.length ? [theme.fg("warning", `gaps: ${details.coverageGaps.join("; ")}`)] : []),
      ].join("\n"), 0, 0);
    },
  });

  return orchestrator;
}
