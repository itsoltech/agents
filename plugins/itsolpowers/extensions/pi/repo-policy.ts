// Deterministic .itsol.md parsing and enforcement for itsol-workflow-mode and itsol-execution-policy.
import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { STOP_RANK, type DelegatedTask, type TaskStateDefinition } from "./policy.ts";

const WORKFLOW_MODES = ["governed", "autonomous-planned", "direct"] as const;
const REVIEW_PROFILES = ["off", "poc", "balanced", "strict"] as const;
const REVIEW_TRIGGERS = ["manual", "final", "checkpoint"] as const;
const REVIEW_DELEGATIONS = ["never", "risk-based", "always"] as const;
const REVIEW_REREVIEW = ["never", "after-fixes", "until-approved"] as const;
type WorkflowMode = typeof WORKFLOW_MODES[number];
export type ReviewProfile = typeof REVIEW_PROFILES[number];
export type ReviewTrigger = typeof REVIEW_TRIGGERS[number];
export type ReviewDelegation = typeof REVIEW_DELEGATIONS[number];
export type AutoRereview = typeof REVIEW_REREVIEW[number];

interface MatchRule {
  path?: string;
  operation?: string;
}

interface WorkflowRestriction {
  match: MatchRule;
  allowed_modes?: WorkflowMode[];
}

interface WorkflowPolicy {
  default_mode?: WorkflowMode;
  allowed_modes?: WorkflowMode[];
  restrictions: WorkflowRestriction[];
}

interface ExecutionRestriction {
  match: MatchRule;
  max_subagents?: number;
  max_parallel?: number;
  max_review_rounds?: number;
  stop_after?: keyof typeof STOP_RANK;
}

interface ExecutionPolicyConfig {
  default_preset?: "economy" | "standard" | "deep" | "custom";
  restrictions: ExecutionRestriction[];
}

interface ReviewRestriction {
  match: MatchRule;
  profile?: ReviewProfile;
  allowed_profiles?: ReviewProfile[];
  trigger?: ReviewTrigger;
  delegation?: ReviewDelegation;
  auto_rereview?: AutoRereview;
  max_rounds?: number;
  plan_max_rounds?: number;
}

interface ReviewPolicyConfig {
  default_profile?: ReviewProfile;
  allowed_profiles?: ReviewProfile[];
  trigger?: ReviewTrigger;
  delegation?: ReviewDelegation;
  auto_rereview?: AutoRereview;
  max_rounds?: number;
  plan_max_rounds?: number;
  restrictions: ReviewRestriction[];
}

export interface ResolvedReviewPolicy {
  profile: ReviewProfile;
  allowed_profiles: ReviewProfile[];
  trigger: ReviewTrigger;
  delegation: ReviewDelegation;
  auto_rereview: AutoRereview;
  max_rounds: number;
  plan_max_rounds: number;
  sources: string[];
}

interface ProjectMemory {
  path: string;
  stack?: string;
  tdd_mode?: string;
  verification?: string;
  details?: string;
}

interface ParsedRepoPolicy {
  filePath: string;
  baseDir: string;
  mtimeMs: number;
  workflow: WorkflowPolicy;
  execution: ExecutionPolicyConfig;
  review: ReviewPolicyConfig;
  projects: ProjectMemory[];
  verificationCommands: string[];
  agentWorkflowNotes: string[];
  knownConstraints: string[];
  errors: string[];
}

interface PolicyContext {
  paths?: string[];
  operations?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

interface YamlLine {
  indent: number;
  text: string;
  line: number;
}

function yamlScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    return inner ? inner.split(",").map((item) => yamlScalar(item.trim())) : [];
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1);
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  return trimmed;
}

function tokenizePolicyYaml(source: string): YamlLine[] {
  const result: YamlLine[] = [];
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    if (/^\s*#/.test(raw) || !raw.trim()) continue;
    if (raw.includes("\t")) throw new Error(`tabs are not supported at line ${index + 1}`);
    const indent = raw.match(/^ */)?.[0].length ?? 0;
    result.push({ indent, text: raw.trim(), line: index + 1 });
  }
  return result;
}

function readYamlValue(lines: YamlLine[], index: number, keyIndent: number, rawValue: string): {
  value: unknown;
  next: number;
} {
  if (rawValue.trim()) return { value: yamlScalar(rawValue), next: index + 1 };
  const values: unknown[] = [];
  let next = index + 1;
  while (next < lines.length && lines[next].indent > keyIndent && /^-\s+[^:]+$/.test(lines[next].text)) {
    values.push(yamlScalar(lines[next].text.replace(/^-\s+/, "")));
    next++;
  }
  return { value: values, next };
}

function parseRestrictionBlock(lines: YamlLine[], start: number, parentIndent: number): {
  restrictions: Record<string, unknown>[];
  next: number;
} {
  const restrictions: Record<string, unknown>[] = [];
  let current: Record<string, unknown> | undefined;
  let index = start;
  while (index < lines.length && lines[index].indent > parentIndent) {
    const line = lines[index];
    if (line.text.startsWith("- ")) {
      current = {};
      restrictions.push(current);
      const rest = line.text.slice(2).trim();
      if (!rest) {
        index++;
        continue;
      }
      const separator = rest.indexOf(":");
      if (separator < 0) throw new Error(`expected restriction mapping at line ${line.line}`);
      const key = rest.slice(0, separator).trim();
      const rawValue = rest.slice(separator + 1).trim();
      if (key === "match") current.match = {};
      else current[key] = rawValue ? yamlScalar(rawValue) : [];
      index++;
      continue;
    }
    if (!current) throw new Error(`restriction field without list item at line ${line.line}`);
    const separator = line.text.indexOf(":");
    if (separator < 0) throw new Error(`expected key:value at line ${line.line}`);
    const key = line.text.slice(0, separator).trim();
    const rawValue = line.text.slice(separator + 1).trim();
    if (["path", "operation"].includes(key) && line.indent >= parentIndent + 6) {
      const match = isRecord(current.match) ? current.match : {};
      match[key] = yamlScalar(rawValue);
      current.match = match;
      index++;
      continue;
    }
    if (key === "match") {
      current.match = {};
      index++;
      continue;
    }
    const parsed = readYamlValue(lines, index, line.indent, rawValue);
    current[key] = parsed.value;
    index = parsed.next;
  }
  return { restrictions, next: index };
}

/** Strict parser for the documented workflow/execution YAML subset in .itsol.md. */
function parsePolicyYaml(source: string): Record<string, unknown> {
  const lines = tokenizePolicyYaml(source);
  const result: Record<string, unknown> = {};
  let index = 0;
  while (index < lines.length) {
    const root = lines[index];
    const rootMatch = root.text.match(/^(workflow|execution|review):\s*$/);
    if (!rootMatch || root.indent !== 0) {
      index++;
      continue;
    }
    const section: Record<string, unknown> = {};
    result[rootMatch[1]] = section;
    index++;
    while (index < lines.length && lines[index].indent > root.indent) {
      const line = lines[index];
      const separator = line.text.indexOf(":");
      if (separator < 0) throw new Error(`expected key:value at line ${line.line}`);
      const key = line.text.slice(0, separator).trim();
      const rawValue = line.text.slice(separator + 1).trim();
      if (key === "restrictions") {
        const parsed = parseRestrictionBlock(lines, index + 1, line.indent);
        section.restrictions = parsed.restrictions;
        index = parsed.next;
        continue;
      }
      const parsed = readYamlValue(lines, index, line.indent, rawValue);
      section[key] = parsed.value;
      index = parsed.next;
    }
  }
  return result;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return [value];
  return [];
}

function workflowModes(value: unknown): WorkflowMode[] | undefined {
  const modes = stringArray(value).filter((mode): mode is WorkflowMode =>
    (WORKFLOW_MODES as readonly string[]).includes(mode));
  return modes.length ? modes : undefined;
}

function reviewValues<T extends string>(value: unknown, allowed: readonly T[]): T[] | undefined {
  const values = stringArray(value).filter((item): item is T => allowed.includes(item as T));
  return values.length ? values : undefined;
}

function reviewValue<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : undefined;
}

function reportInvalidEnum(
  errors: string[],
  record: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  label = `review.${key}`,
): void {
  if (record[key] !== undefined && reviewValue(record[key], allowed) === undefined) {
    errors.push(`${label} must be one of: ${allowed.join(", ")}`);
  }
}

function reportInvalidEnumList(
  errors: string[],
  record: Record<string, unknown>,
  key: string,
  allowed: readonly string[],
  label = `review.${key}`,
): void {
  if (record[key] === undefined) return;
  const values = stringArray(record[key]);
  const invalid = values.filter((value) => !allowed.includes(value));
  if (!values.length || invalid.length) errors.push(`${label} contains invalid values: ${invalid.join(", ") || "empty"}`);
}

function finiteInteger(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : undefined;
}

function matchRule(value: unknown): MatchRule {
  if (!isRecord(value)) return {};
  return {
    path: typeof value.path === "string" ? value.path : undefined,
    operation: typeof value.operation === "string" ? value.operation : undefined,
  };
}

function extractSection(content: string, heading: string): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start < 0) return "";
  let end = start + 1;
  while (end < lines.length && !lines[end].startsWith("## ")) end++;
  return lines.slice(start + 1, end).join("\n").trim();
}

function sectionLines(content: string, heading: string): string[] {
  return extractSection(content, heading)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") && line.replace(/^[-\s]+/, "").trim())
    .map((line) => line.replace(/^[-\s]+/, "").trim())
    .slice(0, 50);
}

function parseProjects(content: string): ProjectMemory[] {
  const projects = new Map<string, ProjectMemory>();
  const table = extractSection(content, "Monorepo Map");
  for (const line of table.split("\n")) {
    if (!line.trim().startsWith("|") || /^\|?\s*[-:]+/.test(line.replaceAll(" ", ""))) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/^`|`$/g, ""));
    if (cells.length < 4 || /^path$/i.test(cells[0])) continue;
    projects.set(cells[0], {
      path: cells[0],
      stack: cells[2] || undefined,
      tdd_mode: cells[3] || undefined,
      verification: cells[4] || undefined,
    });
  }

  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const heading = lines[index].match(/^## Project:\s*(.+?)\s*$/);
    if (!heading) continue;
    let end = index + 1;
    while (end < lines.length && !lines[end].startsWith("## ")) end++;
    const projectPath = heading[1].trim().replace(/^`|`$/g, "");
    const body = lines.slice(index + 1, end).join("\n").trim();
    const field = (name: string) => body.match(new RegExp(`^- ${name}:\\s*(.+)$`, "mi"))?.[1]?.trim();
    const previous = projects.get(projectPath);
    projects.set(projectPath, {
      path: projectPath,
      stack: field("Stack") ?? previous?.stack,
      tdd_mode: field("TDD mode") ?? previous?.tdd_mode,
      verification: field("Required replacement verification") ?? previous?.verification,
      details: body.slice(0, 4000),
    });
    index = end - 1;
  }
  return [...projects.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function parsePolicyFile(filePath: string): ParsedRepoPolicy {
  const content = fs.readFileSync(filePath, "utf8");
  const errors: string[] = [];
  let workflowRaw: Record<string, unknown> = {};
  let executionRaw: Record<string, unknown> = {};
  let reviewRaw: Record<string, unknown> = {};
  for (const block of content.matchAll(/```ya?ml\s*\n([\s\S]*?)```/gi)) {
    try {
      const parsed = parsePolicyYaml(block[1]) as unknown;
      if (!isRecord(parsed)) continue;
      if (isRecord(parsed.workflow)) workflowRaw = { ...workflowRaw, ...parsed.workflow };
      if (isRecord(parsed.execution)) executionRaw = { ...executionRaw, ...parsed.execution };
      if (isRecord(parsed.review)) reviewRaw = { ...reviewRaw, ...parsed.review };
    } catch (error) {
      errors.push(`YAML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const workflowRestrictions: WorkflowRestriction[] = [];
  if (Array.isArray(workflowRaw.restrictions)) {
    for (const restriction of workflowRaw.restrictions) {
      if (!isRecord(restriction)) continue;
      workflowRestrictions.push({
        match: matchRule(restriction.match),
        allowed_modes: workflowModes(restriction.allowed_modes),
      });
    }
  }
  const executionRestrictions: ExecutionRestriction[] = [];
  if (Array.isArray(executionRaw.restrictions)) {
    for (const restriction of executionRaw.restrictions) {
      if (!isRecord(restriction)) continue;
      const stop = typeof restriction.stop_after === "string" && restriction.stop_after in STOP_RANK
        ? restriction.stop_after as keyof typeof STOP_RANK
        : undefined;
      executionRestrictions.push({
        match: matchRule(restriction.match),
        max_subagents: finiteInteger(restriction.max_subagents),
        max_parallel: finiteInteger(restriction.max_parallel),
        max_review_rounds: finiteInteger(restriction.max_review_rounds),
        stop_after: stop,
      });
    }
  }

  reportInvalidEnum(errors, reviewRaw, "default_profile", REVIEW_PROFILES);
  reportInvalidEnum(errors, reviewRaw, "trigger", REVIEW_TRIGGERS);
  reportInvalidEnum(errors, reviewRaw, "delegation", REVIEW_DELEGATIONS);
  reportInvalidEnum(errors, reviewRaw, "auto_rereview", REVIEW_REREVIEW);
  reportInvalidEnumList(errors, reviewRaw, "allowed_profiles", REVIEW_PROFILES);
  if (reviewRaw.max_rounds !== undefined
    && (finiteInteger(reviewRaw.max_rounds) === undefined || Number(reviewRaw.max_rounds) > 2)) {
    errors.push("review.max_rounds must be an integer from 0 to 2");
  }
  if (reviewRaw.plan_max_rounds !== undefined
    && (finiteInteger(reviewRaw.plan_max_rounds) === undefined
      || Number(reviewRaw.plan_max_rounds) < 1
      || Number(reviewRaw.plan_max_rounds) > 10)) {
    errors.push("review.plan_max_rounds must be an integer from 1 to 10");
  }

  const reviewRestrictions: ReviewRestriction[] = [];
  if (Array.isArray(reviewRaw.restrictions)) {
    for (const [index, restriction] of reviewRaw.restrictions.entries()) {
      if (!isRecord(restriction)) continue;
      const label = `review.restrictions[${index}]`;
      reportInvalidEnum(errors, restriction, "profile", REVIEW_PROFILES, `${label}.profile`);
      reportInvalidEnum(errors, restriction, "trigger", REVIEW_TRIGGERS, `${label}.trigger`);
      reportInvalidEnum(errors, restriction, "delegation", REVIEW_DELEGATIONS, `${label}.delegation`);
      reportInvalidEnum(errors, restriction, "auto_rereview", REVIEW_REREVIEW, `${label}.auto_rereview`);
      reportInvalidEnumList(errors, restriction, "allowed_profiles", REVIEW_PROFILES, `${label}.allowed_profiles`);
      if (restriction.max_rounds !== undefined
        && (finiteInteger(restriction.max_rounds) === undefined || Number(restriction.max_rounds) > 2)) {
        errors.push(`${label}.max_rounds must be an integer from 0 to 2`);
      }
      if (restriction.plan_max_rounds !== undefined
        && (finiteInteger(restriction.plan_max_rounds) === undefined
          || Number(restriction.plan_max_rounds) < 1
          || Number(restriction.plan_max_rounds) > 10)) {
        errors.push(`${label}.plan_max_rounds must be an integer from 1 to 10`);
      }
      reviewRestrictions.push({
        match: matchRule(restriction.match),
        profile: reviewValue(restriction.profile, REVIEW_PROFILES),
        allowed_profiles: reviewValues(restriction.allowed_profiles, REVIEW_PROFILES),
        trigger: reviewValue(restriction.trigger, REVIEW_TRIGGERS),
        delegation: reviewValue(restriction.delegation, REVIEW_DELEGATIONS),
        auto_rereview: reviewValue(restriction.auto_rereview, REVIEW_REREVIEW),
        max_rounds: finiteInteger(restriction.max_rounds),
        plan_max_rounds: finiteInteger(restriction.plan_max_rounds),
      });
    }
  }

  const defaultMode = typeof workflowRaw.default_mode === "string"
    && (WORKFLOW_MODES as readonly string[]).includes(workflowRaw.default_mode)
    ? workflowRaw.default_mode as WorkflowMode
    : undefined;
  const preset = typeof executionRaw.default_preset === "string"
    && ["economy", "standard", "deep", "custom"].includes(executionRaw.default_preset)
    ? executionRaw.default_preset as ExecutionPolicyConfig["default_preset"]
    : undefined;
  const stat = fs.statSync(filePath);
  return {
    filePath,
    baseDir: path.dirname(filePath),
    mtimeMs: stat.mtimeMs,
    workflow: {
      default_mode: defaultMode,
      allowed_modes: workflowModes(workflowRaw.allowed_modes),
      restrictions: workflowRestrictions,
    },
    execution: { default_preset: preset, restrictions: executionRestrictions },
    review: {
      default_profile: reviewValue(reviewRaw.default_profile, REVIEW_PROFILES),
      allowed_profiles: reviewValues(reviewRaw.allowed_profiles, REVIEW_PROFILES),
      trigger: reviewValue(reviewRaw.trigger, REVIEW_TRIGGERS),
      delegation: reviewValue(reviewRaw.delegation, REVIEW_DELEGATIONS),
      auto_rereview: reviewValue(reviewRaw.auto_rereview, REVIEW_REREVIEW),
      max_rounds: finiteInteger(reviewRaw.max_rounds),
      plan_max_rounds: finiteInteger(reviewRaw.plan_max_rounds),
      restrictions: reviewRestrictions,
    },
    projects: parseProjects(content),
    verificationCommands: sectionLines(content, "Verification Commands"),
    agentWorkflowNotes: sectionLines(content, "Agent Workflow Notes"),
    knownConstraints: sectionLines(content, "Known Constraints"),
    errors,
  };
}

function findRepositoryRoot(cwd: string): string {
  let current = path.resolve(cwd);
  while (true) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(cwd);
    current = parent;
  }
}

function normalizeRepoPath(repoRoot: string, value: string): string {
  const raw = value.replace(/^@/, "");
  const absolute = path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
  return path.relative(repoRoot, absolute).replaceAll("\\", "/").replace(/^\.\//, "") || ".";
}

function pathMatches(value: string, pattern: string): boolean {
  const normalizedValue = value.replaceAll("\\", "/").replace(/^\.\//, "");
  const normalizedPattern = pattern.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (!/[*?]/.test(normalizedPattern)) {
    return normalizedValue === normalizedPattern || normalizedValue.startsWith(`${normalizedPattern}/`);
  }
  const escaped = normalizedPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = escaped.replaceAll("**", "§§").replaceAll("*", "[^/]*").replaceAll("§§", ".*").replaceAll("?", ".");
  return new RegExp(`^${regex}(?:/.*)?$`).test(normalizedValue);
}

const REVIEW_PROFILE_DEFAULTS: Record<ReviewProfile, Omit<ResolvedReviewPolicy, "profile" | "allowed_profiles" | "plan_max_rounds" | "sources">> = {
  off: { trigger: "manual", delegation: "never", auto_rereview: "never", max_rounds: 0 },
  poc: { trigger: "final", delegation: "never", auto_rereview: "never", max_rounds: 1 },
  balanced: { trigger: "final", delegation: "risk-based", auto_rereview: "after-fixes", max_rounds: 2 },
  strict: { trigger: "final", delegation: "risk-based", auto_rereview: "until-approved", max_rounds: 2 },
};

function restrictionMatches(match: MatchRule, paths: string[], operations: string[]): boolean {
  const pathOk = !match.path || paths.some((item) => pathMatches(item, match.path!));
  const operationOk = !match.operation || operations.includes(match.operation);
  return pathOk && operationOk;
}

export class RepoPolicyManager {
  private repoRoot = "";
  private rootPolicy?: ParsedRepoPolicy;
  private readonly cache = new Map<string, ParsedRepoPolicy>();

  startSession(ctx: ExtensionContext): void {
    this.repoRoot = findRepositoryRoot(ctx.cwd);
    this.reload();
  }

  reload(): void {
    this.cache.clear();
    const rootPath = path.join(this.repoRoot, ".itsol.md");
    this.rootPolicy = fs.existsSync(rootPath) ? this.load(rootPath) : undefined;
  }

  refreshIfChanged(): void {
    const rootPath = path.join(this.repoRoot, ".itsol.md");
    if (!fs.existsSync(rootPath)) {
      if (this.rootPolicy) this.reload();
      return;
    }
    const mtime = fs.statSync(rootPath).mtimeMs;
    if (!this.rootPolicy || this.rootPolicy.mtimeMs !== mtime) this.reload();
  }

  resolveReviewPolicy(context?: PolicyContext, override?: ReviewProfile): ResolvedReviewPolicy {
    this.refreshIfChanged();
    const paths = this.normalizePaths(context?.paths ?? []);
    const operations = context?.operations ?? [];
    const policies = this.policiesFor(paths);
    this.assertValid();
    let profile: ReviewProfile = "balanced";
    let allowed = new Set<ReviewProfile>(REVIEW_PROFILES);
    let explicit: Partial<Pick<ResolvedReviewPolicy, "trigger" | "delegation" | "auto_rereview" | "max_rounds" | "plan_max_rounds">> = {};

    for (const policy of policies) {
      if (policy.review.allowed_profiles) {
        allowed = new Set([...allowed].filter((item) => policy.review.allowed_profiles!.includes(item)));
      }
      if (policy.review.default_profile) profile = policy.review.default_profile;
      explicit = {
        ...explicit,
        ...(policy.review.trigger ? { trigger: policy.review.trigger } : {}),
        ...(policy.review.delegation ? { delegation: policy.review.delegation } : {}),
        ...(policy.review.auto_rereview ? { auto_rereview: policy.review.auto_rereview } : {}),
        ...(policy.review.max_rounds !== undefined ? { max_rounds: policy.review.max_rounds } : {}),
        ...(policy.review.plan_max_rounds !== undefined ? { plan_max_rounds: policy.review.plan_max_rounds } : {}),
      };
      for (const restriction of policy.review.restrictions) {
        if (!restrictionMatches(restriction.match, paths, operations)) continue;
        if (restriction.allowed_profiles) {
          allowed = new Set([...allowed].filter((item) => restriction.allowed_profiles!.includes(item)));
        }
        if (restriction.profile) profile = restriction.profile;
        explicit = {
          ...explicit,
          ...(restriction.trigger ? { trigger: restriction.trigger } : {}),
          ...(restriction.delegation ? { delegation: restriction.delegation } : {}),
          ...(restriction.auto_rereview ? { auto_rereview: restriction.auto_rereview } : {}),
          ...(restriction.max_rounds !== undefined ? { max_rounds: restriction.max_rounds } : {}),
          ...(restriction.plan_max_rounds !== undefined ? { plan_max_rounds: restriction.plan_max_rounds } : {}),
        };
      }
    }
    if (override) profile = override;
    if (!allowed.has(profile)) {
      throw new Error(`.itsol.md blocks review profile=${profile}; allowed profiles: ${[...allowed].join(", ") || "none"}`);
    }
    const defaults = REVIEW_PROFILE_DEFAULTS[profile];
    return {
      profile,
      allowed_profiles: [...allowed],
      trigger: explicit.trigger ?? defaults.trigger,
      delegation: explicit.delegation ?? defaults.delegation,
      auto_rereview: explicit.auto_rereview ?? defaults.auto_rereview,
      max_rounds: Math.min(2, explicit.max_rounds ?? defaults.max_rounds),
      plan_max_rounds: Math.min(10, explicit.plan_max_rounds ?? 10),
      sources: policies.map((policy) => policy.filePath),
    };
  }

  validateDefinition(definition: TaskStateDefinition): void {
    const paths = this.normalizePaths(definition.policy_context?.paths ?? []);
    const operations = definition.policy_context?.operations ?? [];
    const policies = this.policiesFor(paths);
    this.assertValid();
    let allowed = new Set<WorkflowMode>(WORKFLOW_MODES);
    const matchedExecution: ExecutionRestriction[] = [];

    for (const policy of policies) {
      if (policy.workflow.allowed_modes) {
        allowed = new Set([...allowed].filter((mode) => policy.workflow.allowed_modes!.includes(mode)));
      }
      for (const restriction of policy.workflow.restrictions) {
        if (restriction.allowed_modes && restrictionMatches(restriction.match, paths, operations)) {
          allowed = new Set([...allowed].filter((mode) => restriction.allowed_modes!.includes(mode)));
        }
      }
      matchedExecution.push(...policy.execution.restrictions.filter((restriction) =>
        restrictionMatches(restriction.match, paths, operations)));
    }
    if (!allowed.has(definition.workflow_state.workflow_mode)) {
      throw new Error(
        `.itsol.md blocks workflow_mode=${definition.workflow_state.workflow_mode}; allowed modes: ${[...allowed].join(", ") || "none"}`,
      );
    }

    const policy = definition.execution_policy;
    for (const restriction of matchedExecution) {
      if (restriction.max_subagents !== undefined && policy.max_subagents > restriction.max_subagents) {
        throw new Error(`.itsol.md limits max_subagents to ${restriction.max_subagents}`);
      }
      if (restriction.max_parallel !== undefined && policy.max_parallel > restriction.max_parallel) {
        throw new Error(`.itsol.md limits max_parallel to ${restriction.max_parallel}`);
      }
      if (restriction.max_review_rounds !== undefined && policy.max_review_rounds > restriction.max_review_rounds) {
        throw new Error(`.itsol.md limits max_review_rounds to ${restriction.max_review_rounds}`);
      }
      if (restriction.stop_after && STOP_RANK[policy.stop_after] > STOP_RANK[restriction.stop_after]) {
        throw new Error(`.itsol.md limits stop_after to ${restriction.stop_after}`);
      }
    }
  }

  validateDelegation(definition: TaskStateDefinition, tasks: DelegatedTask[]): void {
    const paths = tasks.flatMap((task) => [...task.read_scope, ...task.write_scope]);
    const operations = tasks.flatMap((task) => task.operations ?? []);
    this.validateDefinition({
      ...definition,
      policy_context: {
        paths: [...new Set([...(definition.policy_context?.paths ?? []), ...paths])],
        operations: [...new Set([...(definition.policy_context?.operations ?? []), ...operations])],
      },
    });
  }

  formatPromptContext(context?: PolicyContext): string {
    this.refreshIfChanged();
    if (!this.rootPolicy) {
      return [
        "## ITSOL repository policy (extension-managed)",
        "No root .itsol.md was found. Use governed workflow, standard execution, and balanced final-review fallbacks unless the user explicitly selects an allowed alternative for the current task.",
      ].join("\n");
    }
    const paths = this.normalizePaths(context?.paths ?? []);
    const operations = context?.operations ?? [];
    const policies = this.policiesFor(paths);
    return [
      "## ITSOL repository policy (extension-managed)",
      "The extension parsed and normalized .itsol.md. Use this data directly; do not read or parse .itsol.md again unless the user asks to inspect, edit, or audit that file.",
      "```json",
      JSON.stringify({
        sources: policies.map((policy) => policy.filePath),
        task_context: { paths, operations },
        policies: policies.map((policy) => ({
          workflow: policy.workflow,
          execution: policy.execution,
          review: policy.review,
          projects: policy.projects,
          verification_commands: policy.verificationCommands,
          agent_workflow_notes: policy.agentWorkflowNotes,
          known_constraints: policy.knownConstraints,
          errors: policy.errors,
        })),
      }, null, 2),
      "```",
    ].join("\n");
  }

  formatStatus(): string {
    if (!this.rootPolicy) return `Repository root: ${this.repoRoot}\nPolicy: no .itsol.md`;
    return [
      `Repository root: ${this.repoRoot}`,
      `Policy: ${this.rootPolicy.filePath}`,
      `Workflow default: ${this.rootPolicy.workflow.default_mode ?? "governed fallback"}`,
      `Allowed modes: ${this.rootPolicy.workflow.allowed_modes?.join(", ") ?? "all"}`,
      `Execution default: ${this.rootPolicy.execution.default_preset ?? "standard fallback"}`,
      `Review default: ${this.rootPolicy.review.default_profile ?? "balanced fallback"}`,
      `Projects: ${this.rootPolicy.projects.length}`,
      `Errors: ${this.rootPolicy.errors.length ? this.rootPolicy.errors.join("; ") : "none"}`,
    ].join("\n");
  }

  private policiesFor(paths: string[]): ParsedRepoPolicy[] {
    const policies = new Map<string, ParsedRepoPolicy>();
    if (this.rootPolicy) policies.set(this.rootPolicy.filePath, this.rootPolicy);
    for (const repoPath of paths) {
      const raw = repoPath.split(/[*?]/, 1)[0] || ".";
      const absolute = path.resolve(this.repoRoot, raw);
      let current = fs.existsSync(absolute) && fs.statSync(absolute).isDirectory() ? absolute : path.dirname(absolute);
      while (current.startsWith(this.repoRoot) && current !== this.repoRoot) {
        const candidate = path.join(current, ".itsol.md");
        if (fs.existsSync(candidate)) policies.set(candidate, this.load(candidate));
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
      }
    }
    return [...policies.values()].sort((left, right) => {
      const depth = (value: ParsedRepoPolicy) => path.relative(this.repoRoot, value.baseDir).split(path.sep).filter(Boolean).length;
      return depth(left) - depth(right) || left.filePath.localeCompare(right.filePath);
    });
  }

  private normalizePaths(paths: string[]): string[] {
    return [...new Set(paths.map((item) => normalizeRepoPath(this.repoRoot, item)))];
  }

  private load(filePath: string): ParsedRepoPolicy {
    const cached = this.cache.get(filePath);
    const mtime = fs.statSync(filePath).mtimeMs;
    if (cached?.mtimeMs === mtime) return cached;
    const parsed = parsePolicyFile(filePath);
    this.cache.set(filePath, parsed);
    return parsed;
  }

  private assertValid(): void {
    const errors = [...this.cache.values()].flatMap((policy) =>
      policy.errors.map((error) => `${policy.filePath}: ${error}`));
    if (errors.length) throw new Error(`Invalid .itsol.md policy: ${errors.join("; ")}`);
  }
}

export function registerRepoPolicy(pi: ExtensionAPI, manager: RepoPolicyManager): void {
  pi.registerCommand("itsol-policy", {
    description: "Show or reload extension-parsed .itsol.md repository policy",
    handler: async (args, ctx) => {
      const action = args.trim() || "status";
      if (action === "reload") manager.reload();
      else if (action !== "status") {
        if (ctx.hasUI) ctx.ui.notify("Usage: /itsol-policy [status|reload]", "error");
        return;
      }
      if (ctx.hasUI) ctx.ui.notify(manager.formatStatus(), "info");
    },
  });
}
