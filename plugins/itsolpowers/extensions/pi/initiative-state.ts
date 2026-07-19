// Durable initiative delivery state layered on itsol-workflow-mode and shared through repository artifacts.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import type { TaskStateStore } from "./task-state.ts";

const ENTRY_TYPE = "itsol-initiative-active";
const STATE_VERSION = 1;
const INITIATIVE_ROOT = ".itsol/initiatives";

const RequirementInputSchema = Type.Object({
  id: Type.String({ pattern: "^REQ-[0-9]{3,}$" }),
  summary: Type.String({ minLength: 1 }),
  acceptance_criteria: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  priority: StringEnum(["must", "should", "could"] as const),
});

const PhaseInputSchema = Type.Object({
  id: Type.String({ pattern: "^P[0-9]{2,}$" }),
  title: Type.String({ minLength: 1 }),
  objective: Type.String({ minLength: 1 }),
  requirement_ids: Type.Array(Type.String({ pattern: "^REQ-[0-9]{3,}$" }), { minItems: 1 }),
  depends_on: Type.Array(Type.String({ pattern: "^P[0-9]{2,}$" })),
  done_when: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

const StartSchema = Type.Object({
  action: Type.Literal("start"),
  task_id: Type.String({ minLength: 1 }),
  initiative_id: Type.String({ pattern: "^[a-z0-9][a-z0-9-]{1,63}$" }),
  title: Type.String({ minLength: 1 }),
  objective: Type.String({ minLength: 1 }),
  source_path: Type.String({ minLength: 1 }),
  completion_criteria: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  requirements: Type.Array(RequirementInputSchema, { minItems: 1 }),
  phases: Type.Array(PhaseInputSchema, { minItems: 1 }),
});

const UpdateSchema = Type.Object({
  action: Type.Literal("update"),
  initiative_id: Type.String({ minLength: 1 }),
  entity: StringEnum(["initiative", "requirement", "phase"] as const),
  entity_id: Type.Optional(Type.String()),
  status: StringEnum([
    "planning", "ready", "executing", "qa", "paused",
    "planned", "in-progress", "implemented", "blocked", "deferred", "rejected", "completed",
  ] as const),
  evidence: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  note: Type.Optional(Type.String()),
  decision_id: Type.Optional(Type.String()),
});

const DecisionSchema = Type.Object({
  action: Type.Literal("decision"),
  initiative_id: Type.String({ minLength: 1 }),
  operation: StringEnum(["open", "resolve"] as const),
  decision_id: Type.String({ pattern: "^(DEC|ADR)-[0-9]{3,}$" }),
  kind: Type.Optional(StringEnum(["business", "product", "architecture", "qa", "scope"] as const)),
  question: Type.Optional(Type.String()),
  options: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { minItems: 2 })),
  recommendation: Type.Optional(Type.String()),
  resolution: Type.Optional(Type.String()),
  resolved_by: Type.Optional(StringEnum(["user", "delegated"] as const)),
  impacts: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
});

const ReplanSchema = Type.Object({
  action: Type.Literal("replan"),
  initiative_id: Type.String({ minLength: 1 }),
  reason: Type.String({ minLength: 1 }),
  decision_ids: Type.Array(Type.String()),
  add_requirements: Type.Optional(Type.Array(RequirementInputSchema)),
  add_phases: Type.Optional(Type.Array(PhaseInputSchema)),
  move_requirements: Type.Optional(Type.Array(Type.Object({
    requirement_id: Type.String(),
    from_phase: Type.String(),
    to_phase: Type.String(),
  }))),
});

const CompleteSchema = Type.Object({
  action: Type.Literal("complete"),
  initiative_id: Type.String({ minLength: 1 }),
  verification_evidence: Type.Array(Type.Object({
    criterion: Type.String({ minLength: 1 }),
    evidence: Type.String({ minLength: 1 }),
  }), { minItems: 1 }),
});

const StatusSchema = Type.Object({
  action: Type.Literal("status"),
  initiative_id: Type.Optional(Type.String()),
});

export const ItsolInitiativeParamsSchema = Type.Union([
  StartSchema, UpdateSchema, DecisionSchema, ReplanSchema, CompleteSchema, StatusSchema,
]);
export type ItsolInitiativeParams = Static<typeof ItsolInitiativeParamsSchema>;

type InitiativeStatus = "planning" | "ready" | "executing" | "qa" | "blocked-decision" | "paused" | "completed";
type RequirementStatus = "planned" | "in-progress" | "implemented" | "blocked" | "deferred" | "rejected";
type PhaseStatus = "planned" | "in-progress" | "blocked" | "qa" | "completed";

interface RequirementRecord extends Static<typeof RequirementInputSchema> {
  status: RequirementStatus;
  evidence: string[];
  note?: string;
  decision_id?: string;
}

interface PhaseRecord extends Static<typeof PhaseInputSchema> {
  status: PhaseStatus;
  evidence: string[];
  note?: string;
}

interface DecisionRecord {
  id: string;
  kind: "business" | "product" | "architecture" | "qa" | "scope";
  status: "pending" | "resolved";
  question: string;
  options: string[];
  recommendation: string;
  resolution?: string;
  resolved_by?: "user" | "delegated";
  impacts: string[];
  opened_at: number;
  resolved_at?: number;
}

export interface InitiativeState {
  version: number;
  initiative_id: string;
  task_id: string;
  title: string;
  objective: string;
  status: InitiativeStatus;
  source_path: string;
  source_snapshot: string;
  source_fingerprint: string;
  completion_criteria: string[];
  requirements: RequirementRecord[];
  phases: PhaseRecord[];
  decisions: DecisionRecord[];
  change_log: Array<{ at: number; summary: string; decision_ids: string[] }>;
  verification_evidence: Array<{ criterion: string; evidence: string }>;
  created_at: number;
  updated_at: number;
  completed_at?: number;
}

export interface InitiativeCompletionDecision {
  problems: string[];
  forceContinuation: boolean;
}

function isInitiativeState(value: unknown, expectedId: string): value is InitiativeState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<InitiativeState>;
  return state.version === STATE_VERSION
    && state.initiative_id === expectedId
    && typeof state.task_id === "string"
    && typeof state.status === "string"
    && Array.isArray(state.requirements)
    && Array.isArray(state.phases)
    && Array.isArray(state.decisions)
    && Array.isArray(state.change_log)
    && Array.isArray(state.completion_criteria)
    && Array.isArray(state.verification_evidence);
}

function fingerprint(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function safeRelative(cwd: string, requested: string): { absolute: string; relative: string } {
  const absolute = path.resolve(cwd, requested.replace(/^@/, ""));
  const relative = path.relative(cwd, absolute).replaceAll("\\", "/");
  if (!relative || relative.startsWith("../") || path.isAbsolute(relative)) {
    throw new Error("Initiative source must be a file inside the current repository");
  }
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) throw new Error(`Source file does not exist: ${relative}`);
  return { absolute, relative };
}

function uniqueIds(items: Array<{ id: string }>, label: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
}

function markdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function atomicWrite(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, filePath);
}

function writeManagedPrefix(filePath: string, managed: string, initialBody: string): void {
  const start = "<!-- ITSOL:MANAGED:START -->";
  const end = "<!-- ITSOL:MANAGED:END -->";
  const region = `${start}\n${managed.trim()}\n${end}`;
  if (!fs.existsSync(filePath)) {
    atomicWrite(filePath, `${region}\n\n${initialBody.trim()}\n`);
    return;
  }
  const current = fs.readFileSync(filePath, "utf8");
  const startIndex = current.indexOf(start);
  const endIndex = current.indexOf(end);
  if (startIndex >= 0 && endIndex > startIndex) {
    atomicWrite(filePath, `${current.slice(0, startIndex)}${region}${current.slice(endIndex + end.length)}`);
    return;
  }
  atomicWrite(filePath, `${region}\n\n${current}`);
}

export class InitiativeManager {
  private context?: ExtensionContext;
  private activeId?: string;
  private readonly states = new Map<string, InitiativeState>();
  private roadmapReviewValidator?: (taskId: string, roadmapPath: string, cwd: string) => boolean;

  constructor(private readonly pi: ExtensionAPI, private readonly tasks: TaskStateStore) {}

  setRoadmapReviewValidator(validator: (taskId: string, roadmapPath: string, cwd: string) => boolean): void {
    this.roadmapReviewValidator = validator;
  }

  startSession(ctx: ExtensionContext): void {
    this.context = ctx;
    this.states.clear();
    this.activeId = undefined;
    const root = path.join(ctx.cwd, INITIATIVE_ROOT);
    if (fs.existsSync(root)) {
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const statePath = path.join(root, entry.name, "state.json");
        if (!fs.existsSync(statePath)) continue;
        try {
          const state = JSON.parse(fs.readFileSync(statePath, "utf8")) as unknown;
          if (isInitiativeState(state, entry.name)) {
            this.validateGraph(state);
            this.states.set(entry.name, state);
          }
        } catch {
          // A malformed state remains on disk for diagnosis but is not activated.
        }
      }
    }
    const entries = ctx.sessionManager.getBranch();
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index];
      if (entry.type === "custom" && entry.customType === ENTRY_TYPE) {
        const candidate = (entry.data as { activeId?: string } | undefined)?.activeId;
        if (candidate && this.states.has(candidate)) this.activeId = candidate;
        break;
      }
    }
    if (!this.activeId && this.states.size === 1) this.activeId = this.states.keys().next().value;
    this.updateHud();
  }

  getActive(): InitiativeState | undefined {
    return this.activeId ? this.states.get(this.activeId) : undefined;
  }

  get(id: string): InitiativeState | undefined {
    return this.states.get(id);
  }

  start(params: Static<typeof StartSchema>, cwd: string): InitiativeState {
    const task = this.tasks.get(params.task_id);
    if (!task) throw new Error(`Unknown ITSOL task state: ${params.task_id}`);
    if (task.workflow_state.workflow_mode === "direct") {
      throw new Error("Initiative delivery requires governed or autonomous-planned workflow mode");
    }
    if (this.states.has(params.initiative_id)) throw new Error(`Initiative already exists: ${params.initiative_id}`);
    uniqueIds(params.requirements, "requirement");
    uniqueIds(params.phases, "phase");
    const requirementIds = new Set(params.requirements.map((item) => item.id));
    const phaseIds = new Set(params.phases.map((item) => item.id));
    const assigned = new Set<string>();
    for (const phase of params.phases) {
      for (const dependency of phase.depends_on) {
        if (!phaseIds.has(dependency) || dependency === phase.id) throw new Error(`${phase.id} has invalid dependency ${dependency}`);
      }
      for (const requirementId of phase.requirement_ids) {
        if (!requirementIds.has(requirementId)) throw new Error(`${phase.id} references unknown requirement ${requirementId}`);
        assigned.add(requirementId);
      }
    }
    const unassigned = [...requirementIds].filter((id) => !assigned.has(id));
    if (unassigned.length) throw new Error(`Every requirement must be assigned to a phase: ${unassigned.join(", ")}`);

    const source = safeRelative(cwd, params.source_path);
    const initiativeDirectory = path.join(cwd, INITIATIVE_ROOT, params.initiative_id);
    if (fs.existsSync(initiativeDirectory)) throw new Error(`Initiative artifact directory already exists: ${INITIATIVE_ROOT}/${params.initiative_id}`);
    fs.mkdirSync(path.join(initiativeDirectory, "source"), { recursive: true });
    const snapshotName = path.basename(source.relative);
    const snapshotRelative = `${INITIATIVE_ROOT}/${params.initiative_id}/source/${snapshotName}`;
    fs.copyFileSync(source.absolute, path.join(cwd, snapshotRelative));
    const now = Date.now();
    const state: InitiativeState = {
      version: STATE_VERSION,
      initiative_id: params.initiative_id,
      task_id: params.task_id,
      title: params.title,
      objective: params.objective,
      status: "planning",
      source_path: source.relative,
      source_snapshot: snapshotRelative,
      source_fingerprint: fingerprint(source.absolute),
      completion_criteria: [...params.completion_criteria],
      requirements: params.requirements.map((item) => ({ ...item, acceptance_criteria: [...item.acceptance_criteria], status: "planned", evidence: [] })),
      phases: params.phases.map((item) => ({ ...item, requirement_ids: [...item.requirement_ids], depends_on: [...item.depends_on], done_when: [...item.done_when], status: "planned", evidence: [] })),
      decisions: [],
      change_log: [{ at: now, summary: "Initiative created from the supplied business source", decision_ids: [] }],
      verification_evidence: [],
      created_at: now,
      updated_at: now,
    };
    this.validateGraph(state);
    this.states.set(state.initiative_id, state);
    this.activeId = state.initiative_id;
    this.createLivingArtifacts(state, cwd);
    this.persist(state);
    return state;
  }

  update(params: Static<typeof UpdateSchema>): InitiativeState {
    const state = this.require(params.initiative_id);
    if (state.status === "completed") throw new Error("Completed initiative state is immutable");
    const evidence = params.evidence ?? [];
    if (params.entity === "initiative") {
      if (!(["planning", "ready", "executing", "qa", "paused"] as string[]).includes(params.status)) {
        throw new Error(`Invalid initiative status: ${params.status}`);
      }
      const requiresRoadmapReview = params.status === "ready"
        || (params.status === "executing" && state.status === "planning");
      if (requiresRoadmapReview) {
        const roadmapPath = `${INITIATIVE_ROOT}/${state.initiative_id}/roadmap.md`;
        if (!this.context || !this.roadmapReviewValidator?.(state.task_id, roadmapPath, this.context.cwd)) {
          throw new Error(`Initiative roadmap requires a current passing Rubber Duck Review before status=${params.status}`);
        }
      }
      state.status = params.status as Exclude<InitiativeStatus, "blocked-decision" | "completed">;
    } else if (params.entity === "requirement") {
      if (!params.entity_id) throw new Error("Requirement update requires entity_id");
      const requirement = state.requirements.find((item) => item.id === params.entity_id);
      if (!requirement) throw new Error(`Unknown requirement: ${params.entity_id}`);
      if (!(["planned", "in-progress", "implemented", "blocked", "deferred", "rejected"] as string[]).includes(params.status)) {
        throw new Error(`Invalid requirement status: ${params.status}`);
      }
      if (params.status === "implemented" && !evidence.length) throw new Error("Implemented requirement requires verification evidence");
      if (["deferred", "rejected"].includes(params.status)) this.validateScopeDisposition(state, params.decision_id);
      requirement.status = params.status as RequirementStatus;
      requirement.evidence = [...evidence];
      requirement.note = params.note;
      requirement.decision_id = params.decision_id;
    } else {
      if (!params.entity_id) throw new Error("Phase update requires entity_id");
      const phase = state.phases.find((item) => item.id === params.entity_id);
      if (!phase) throw new Error(`Unknown phase: ${params.entity_id}`);
      if (!(["planned", "in-progress", "blocked", "qa", "completed"] as string[]).includes(params.status)) {
        throw new Error(`Invalid phase status: ${params.status}`);
      }
      if (params.status === "in-progress") {
        const incompleteDependencies = phase.depends_on.filter((id) => state.phases.find((item) => item.id === id)?.status !== "completed");
        if (incompleteDependencies.length) throw new Error(`Phase dependencies are incomplete: ${incompleteDependencies.join(", ")}`);
      }
      if (params.status === "completed") {
        const unresolved = phase.requirement_ids.filter((id) => {
          const status = state.requirements.find((item) => item.id === id)?.status;
          return !status || !["implemented", "deferred", "rejected"].includes(status);
        });
        if (unresolved.length) throw new Error(`Phase has unresolved requirements: ${unresolved.join(", ")}`);
        if (!evidence.length) throw new Error("Completed phase requires integration or QA evidence");
      }
      phase.status = params.status as PhaseStatus;
      phase.evidence = [...evidence];
      phase.note = params.note;
    }
    state.updated_at = Date.now();
    this.persist(state);
    return state;
  }

  decision(params: Static<typeof DecisionSchema>): InitiativeState {
    const state = this.require(params.initiative_id);
    if (state.status === "completed") throw new Error("Completed initiative state is immutable");
    const existing = state.decisions.find((item) => item.id === params.decision_id);
    if (params.operation === "open") {
      if (existing) throw new Error(`Decision already exists: ${params.decision_id}`);
      if (!params.kind || !params.question || !params.options?.length || !params.recommendation) {
        throw new Error("Opening a decision requires kind, question, at least two options, and recommendation");
      }
      state.decisions.push({
        id: params.decision_id,
        kind: params.kind,
        status: "pending",
        question: params.question,
        options: [...params.options],
        recommendation: params.recommendation,
        impacts: [...(params.impacts ?? [])],
        opened_at: Date.now(),
      });
      state.status = "blocked-decision";
    } else {
      if (!existing) throw new Error(`Unknown decision: ${params.decision_id}`);
      if (existing.status === "resolved") throw new Error(`Decision already resolved: ${params.decision_id}`);
      if (!params.resolution || !params.resolved_by) throw new Error("Resolving a decision requires resolution and resolved_by");
      if (["business", "product", "scope"].includes(existing.kind) && params.resolved_by !== "user") {
        throw new Error(`${existing.kind} decisions that materially change initiative intent require resolved_by=user`);
      }
      existing.status = "resolved";
      existing.resolution = params.resolution;
      existing.resolved_by = params.resolved_by;
      existing.resolved_at = Date.now();
      if (params.impacts) existing.impacts = [...params.impacts];
      if (!state.decisions.some((item) => item.status === "pending")) state.status = "planning";
    }
    state.updated_at = Date.now();
    this.persist(state);
    return state;
  }

  replan(params: Static<typeof ReplanSchema>): InitiativeState {
    const state = structuredClone(this.require(params.initiative_id));
    if (state.status === "completed") throw new Error("Completed initiative state is immutable");
    for (const decisionId of params.decision_ids) {
      const decision = state.decisions.find((item) => item.id === decisionId);
      if (!decision || decision.status !== "resolved") throw new Error(`Replan references unresolved or unknown decision: ${decisionId}`);
    }
    const additions = params.add_requirements ?? [];
    const newPhases = params.add_phases ?? [];
    uniqueIds([...state.requirements, ...additions], "requirement");
    uniqueIds([...state.phases, ...newPhases], "phase");
    state.requirements.push(...additions.map((item) => ({ ...item, acceptance_criteria: [...item.acceptance_criteria], status: "planned" as const, evidence: [] })));
    state.phases.push(...newPhases.map((item) => ({ ...item, requirement_ids: [...item.requirement_ids], depends_on: [...item.depends_on], done_when: [...item.done_when], status: "planned" as const, evidence: [] })));
    for (const move of params.move_requirements ?? []) {
      const from = state.phases.find((item) => item.id === move.from_phase);
      const to = state.phases.find((item) => item.id === move.to_phase);
      if (!from || !to) throw new Error(`Requirement move references unknown phase: ${move.from_phase} -> ${move.to_phase}`);
      if (!state.requirements.some((item) => item.id === move.requirement_id)) throw new Error(`Unknown requirement: ${move.requirement_id}`);
      from.requirement_ids = from.requirement_ids.filter((id) => id !== move.requirement_id);
      if (!to.requirement_ids.includes(move.requirement_id)) to.requirement_ids.push(move.requirement_id);
    }
    this.validateGraph(state);
    state.change_log.push({ at: Date.now(), summary: params.reason, decision_ids: [...params.decision_ids] });
    state.status = state.decisions.some((item) => item.status === "pending") ? "blocked-decision" : "planning";
    state.updated_at = Date.now();
    this.states.set(state.initiative_id, state);
    this.persist(state);
    return state;
  }

  complete(initiativeId: string, verificationEvidence: Array<{ criterion: string; evidence: string }>): InitiativeState {
    const state = this.require(initiativeId);
    const problems = this.completionProblems(state);
    const evidenceByCriterion = new Map<string, string[]>();
    for (const item of verificationEvidence) {
      const key = item.criterion.trim();
      evidenceByCriterion.set(key, [...(evidenceByCriterion.get(key) ?? []), item.evidence.trim()]);
    }
    for (const criterion of state.completion_criteria) {
      const matches = evidenceByCriterion.get(criterion.trim()) ?? [];
      if (!matches.length) problems.push(`missing completion evidence: ${criterion}`);
      if (matches.length > 1) problems.push(`duplicate completion evidence: ${criterion}`);
    }
    if (problems.length) throw new Error(`Initiative cannot complete:\n- ${problems.join("\n- ")}`);
    state.status = "completed";
    state.verification_evidence = verificationEvidence.map((item) => ({ ...item }));
    state.completed_at = Date.now();
    state.updated_at = state.completed_at;
    this.persist(state);
    return state;
  }

  activate(id: string): InitiativeState {
    const state = this.require(id);
    this.activeId = id;
    this.pi.appendEntry(ENTRY_TYPE, { activeId: id });
    this.updateHud();
    return state;
  }

  pause(): InitiativeState {
    const state = this.requireActive();
    if (state.status !== "completed") state.status = "paused";
    state.updated_at = Date.now();
    this.persist(state);
    return state;
  }

  resume(id?: string): InitiativeState {
    const state = id ? this.activate(id) : this.requireActive();
    if (state.status === "paused") {
      state.status = state.decisions.some((item) => item.status === "pending") ? "blocked-decision" : "executing";
      state.updated_at = Date.now();
      this.persist(state);
    }
    return state;
  }

  async handleCommand(args: string, ctx: ExtensionContext): Promise<void> {
    const [action, ...values] = args.trim() ? args.trim().split(/\s+/) : ["status"];
    const id = values.join(" ");
    if (action === "start" && id) {
      this.pi.sendUserMessage(`Start autonomous Initiative Delivery from the complete business source @${id}. Resolve autonomous-planned workflow, load itsol-initiative-delivery, analyze the entire source, create complete requirements traceability and outcome-oriented phases through the harness-native initiative-state capability, Rubber Duck-review the initiative roadmap, then continue execution without routine approval pauses.`);
      return;
    } else if (action === "activate" && id) this.activate(id);
    else if (action === "resume") this.resume(id);
    else if (action === "pause") this.pause();
    else if (action !== "status") throw new Error("Usage: initiative start <source-path> | status | activate <id> | resume [id] | pause");
    if (ctx.hasUI) ctx.ui.notify(this.formatDetails(), "info");
  }

  completionDecision(taskId: string): InitiativeCompletionDecision {
    const state = [...this.states.values()].find((item) => item.task_id === taskId && item.status !== "completed");
    if (!state) return { problems: [], forceContinuation: false };
    const problems = [`initiative ${state.initiative_id} is ${state.status}; task completion requires initiative completion`];
    const pending = state.decisions.filter((item) => item.status === "pending").map((item) => item.id);
    if (pending.length) problems.push(`pending user decisions: ${pending.join(", ")}`);
    const forceContinuation = state.status !== "paused" && !pending.length && this.hasExecutableWork(state);
    return { problems, forceContinuation };
  }

  formatStatus(state = this.getActive()): string {
    if (!state) return "No active ITSOL initiative.";
    const doneRequirements = state.requirements.filter((item) => ["implemented", "deferred", "rejected"].includes(item.status)).length;
    const donePhases = state.phases.filter((item) => item.status === "completed").length;
    const pending = state.decisions.filter((item) => item.status === "pending").length;
    return `Initiative ${state.initiative_id} · ${state.status} · phases ${donePhases}/${state.phases.length} · requirements ${doneRequirements}/${state.requirements.length} · decisions ${pending} pending`;
  }

  formatDetails(state = this.getActive()): string {
    if (!state) return "No active ITSOL initiative.";
    const current = state.phases.filter((item) => ["in-progress", "qa", "blocked"].includes(item.status)).map((item) => `${item.id}:${item.status}`);
    const pending = state.decisions.filter((item) => item.status === "pending").map((item) => item.id);
    return [
      this.formatStatus(state),
      `Title: ${state.title}`,
      `Task: ${state.task_id}`,
      `Current phases: ${current.join(", ") || "none"}`,
      `Pending decisions: ${pending.join(", ") || "none"}`,
      `State: ${INITIATIVE_ROOT}/${state.initiative_id}/state.json`,
      `Next action: ${this.nextAction(state)}`,
    ].join("\n");
  }

  formatPromptContext(): string {
    const state = this.getActive();
    if (!state) return "";
    return [
      "## Active ITSOL initiative (extension-managed)",
      this.formatDetails(state),
      "The repository initiative artifacts are canonical across sessions. Load `itsol-initiative-delivery`, inspect state.json and the living documents, then continue the next executable phase without a user approval pause.",
      "Do not silently reduce scope. Every requirement needs an explicit disposition. Update initiative state after decisions, implementation evidence, review, QA, and replanning.",
      "Return to the user only for a pending material decision, protected action, pause request, or genuine exhausted blocker.",
    ].join("\n");
  }

  private validateScopeDisposition(state: InitiativeState, decisionId?: string): void {
    if (!decisionId) throw new Error("Deferred or rejected requirements require a user-resolved decision_id");
    const decision = state.decisions.find((item) => item.id === decisionId);
    if (!decision || decision.status !== "resolved" || decision.resolved_by !== "user") {
      throw new Error(`Deferred or rejected requirements require a resolved user decision: ${decisionId}`);
    }
  }

  private validateGraph(state: InitiativeState): void {
    uniqueIds(state.requirements, "requirement");
    uniqueIds(state.phases, "phase");
    const requirements = new Set(state.requirements.map((item) => item.id));
    const phases = new Set(state.phases.map((item) => item.id));
    const assigned = new Set<string>();
    for (const phase of state.phases) {
      if (!phase.requirement_ids.length) throw new Error(`${phase.id} has no requirements`);
      for (const dependency of phase.depends_on) {
        if (!phases.has(dependency) || dependency === phase.id) throw new Error(`${phase.id} has invalid dependency ${dependency}`);
      }
      for (const requirement of phase.requirement_ids) {
        if (!requirements.has(requirement)) throw new Error(`${phase.id} references unknown requirement ${requirement}`);
        assigned.add(requirement);
      }
    }
    const unassigned = [...requirements].filter((id) => !assigned.has(id));
    if (unassigned.length) throw new Error(`Replan leaves requirements without a phase: ${unassigned.join(", ")}`);
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (phaseId: string) => {
      if (visiting.has(phaseId)) throw new Error(`Phase dependency cycle includes ${phaseId}`);
      if (visited.has(phaseId)) return;
      visiting.add(phaseId);
      const phase = state.phases.find((item) => item.id === phaseId)!;
      for (const dependency of phase.depends_on) visit(dependency);
      visiting.delete(phaseId);
      visited.add(phaseId);
    };
    for (const phase of state.phases) visit(phase.id);
  }

  private completionProblems(state: InitiativeState): string[] {
    const problems: string[] = [];
    const phases = state.phases.filter((item) => item.status !== "completed").map((item) => item.id);
    if (phases.length) problems.push(`incomplete phases: ${phases.join(", ")}`);
    const requirements = state.requirements.filter((item) => !["implemented", "deferred", "rejected"].includes(item.status)).map((item) => item.id);
    if (requirements.length) problems.push(`unresolved requirements: ${requirements.join(", ")}`);
    const decisions = state.decisions.filter((item) => item.status === "pending").map((item) => item.id);
    if (decisions.length) problems.push(`pending decisions: ${decisions.join(", ")}`);
    const invalidDispositions = state.requirements.filter((item) => ["deferred", "rejected"].includes(item.status)).filter((item) => {
      const decision = state.decisions.find((candidate) => candidate.id === item.decision_id);
      return !decision || decision.status !== "resolved" || decision.resolved_by !== "user";
    }).map((item) => item.id);
    if (invalidDispositions.length) problems.push(`deferred/rejected requirements lack a resolved user decision: ${invalidDispositions.join(", ")}`);
    return problems;
  }

  private hasExecutableWork(state: InitiativeState): boolean {
    if (["planning", "ready", "executing", "qa"].includes(state.status)) return true;
    return state.phases.some((phase) => phase.status !== "completed" && phase.status !== "blocked");
  }

  private nextAction(state: InitiativeState): string {
    if (state.status === "completed") return "initiative complete";
    if (state.status === "paused") return "resume when authorized";
    const pending = state.decisions.find((item) => item.status === "pending");
    if (pending) return `obtain and record user decision ${pending.id}`;
    if (state.status === "planning") return "complete and Rubber Duck-review initiative roadmap, then mark ready";
    const active = state.phases.find((item) => ["in-progress", "qa"].includes(item.status));
    if (active) return `continue ${active.id} through implementation, review, integration, and QA`;
    const next = state.phases.find((phase) => phase.status === "planned"
      && phase.depends_on.every((id) => state.phases.find((item) => item.id === id)?.status === "completed"));
    if (next) return `start phase ${next.id}: ${next.title}`;
    if (state.phases.every((item) => item.status === "completed")) return "run final system QA and complete the initiative";
    return "resolve blocked phase evidence or open a material decision";
  }

  private require(id: string): InitiativeState {
    const state = this.states.get(id);
    if (!state) throw new Error(`Unknown ITSOL initiative: ${id}`);
    return state;
  }

  private requireActive(): InitiativeState {
    const state = this.getActive();
    if (!state) throw new Error("No active ITSOL initiative");
    return state;
  }

  private persist(state: InitiativeState): void {
    if (!this.context) throw new Error("Initiative manager has no active session context");
    const directory = path.join(this.context.cwd, INITIATIVE_ROOT, state.initiative_id);
    atomicWrite(path.join(directory, "state.json"), `${JSON.stringify(state, null, 2)}\n`);
    this.writeManagedArtifacts(state, directory);
    this.pi.appendEntry(ENTRY_TYPE, { activeId: this.activeId });
    this.updateHud();
  }

  private createLivingArtifacts(state: InitiativeState, cwd: string): void {
    const directory = path.join(cwd, INITIATIVE_ROOT, state.initiative_id);
    const initiativePath = path.join(directory, "initiative.md");
    if (!fs.existsSync(initiativePath)) atomicWrite(initiativePath, [
      `# ${state.title}`,
      "",
      "## Objective",
      state.objective,
      "",
      "## Source of intent",
      `Immutable snapshot: \`${state.source_snapshot}\``,
      "",
      "## Completion criteria",
      ...state.completion_criteria.map((criterion) => `- [ ] ${criterion}`),
      "",
      "## Living product notes",
      "Maintain clarified product behavior here. Preserve material changes in decisions/ and the change log.",
      "",
    ].join("\n"));
    const architecturePath = path.join(directory, "architecture.md");
    if (!fs.existsSync(architecturePath)) atomicWrite(architecturePath, "# Architecture Baseline\n\nDocument system boundaries, contracts, data, security, observability, rollout, and accepted ADRs.\n");
    this.writeManagedArtifacts(state, directory);
  }

  private writeManagedArtifacts(state: InitiativeState, directory: string): void {
    atomicWrite(path.join(directory, "requirements.md"), [
      "# Requirements Traceability",
      "",
      "| ID | Priority | Status | Summary | Phases | Evidence / decision |",
      "| --- | --- | --- | --- | --- | --- |",
      ...state.requirements.map((requirement) => {
        const phases = state.phases.filter((phase) => phase.requirement_ids.includes(requirement.id)).map((phase) => phase.id).join(", ");
        const evidence = [...requirement.evidence, requirement.decision_id ?? ""].filter(Boolean).join("; ");
        return `| ${requirement.id} | ${requirement.priority} | ${requirement.status} | ${markdownCell(requirement.summary)} | ${phases} | ${markdownCell(evidence)} |`;
      }),
      "",
      "## Acceptance criteria",
      "",
      ...state.requirements.flatMap((requirement) => [
        `### ${requirement.id}: ${requirement.summary}`,
        ...requirement.acceptance_criteria.map((criterion) => `- [${requirement.status === "implemented" ? "x" : " "}] ${criterion}`),
        "",
      ]),
    ].join("\n"));
    writeManagedPrefix(path.join(directory, "roadmap.md"), [
      "# Initiative Roadmap",
      "",
      `**Status:** ${state.status}`,
      "",
      "| Phase | Status | Objective | Dependencies | Requirements |",
      "| --- | --- | --- | --- | --- |",
      ...state.phases.map((phase) => `| ${phase.id} ${markdownCell(phase.title)} | ${phase.status} | ${markdownCell(phase.objective)} | ${phase.depends_on.join(", ") || "none"} | ${phase.requirement_ids.join(", ")} |`),
      "",
      "## Change log",
      ...state.change_log.map((entry) => `- ${new Date(entry.at).toISOString()} — ${entry.summary}${entry.decision_ids.length ? ` (${entry.decision_ids.join(", ")})` : ""}`),
    ].join("\n"), [
      "## Delivery design",
      "",
      "Expand phase outcomes, cross-cutting dependencies, risk controls, rollout, rollback, and operational responsibilities here.",
      "",
      "## System QA and final acceptance",
      "",
      "Document end-to-end, regression, security, data, performance, and release evidence required across phases.",
    ].join("\n"));
    atomicWrite(path.join(directory, "progress.md"), [
      "# Initiative Progress",
      "",
      this.formatStatus(state),
      "",
      `**Next action:** ${this.nextAction(state)}`,
      "",
      "## Phases",
      ...state.phases.map((phase) => `- [${phase.status === "completed" ? "x" : " "}] **${phase.id} ${phase.title}** — ${phase.status}${phase.evidence.length ? ` — ${phase.evidence.join("; ")}` : ""}`),
      "",
      "## Pending decisions",
      ...state.decisions.filter((item) => item.status === "pending").map((item) => `- **${item.id}** ${item.question} — recommendation: ${item.recommendation}`),
      ...(state.decisions.some((item) => item.status === "pending") ? [] : ["- none"]),
      "",
      "## Initiative completion evidence",
      ...(state.verification_evidence.length
        ? state.verification_evidence.map((item) => `- **${item.criterion}:** ${item.evidence}`)
        : ["- not completed"]),
      "",
    ].join("\n"));
    fs.mkdirSync(path.join(directory, "decisions"), { recursive: true });
    for (const decision of state.decisions) {
      atomicWrite(path.join(directory, "decisions", `${decision.id}.md`), [
        `# ${decision.id}: ${decision.question}`,
        "",
        `**Kind:** ${decision.kind}`,
        `**Status:** ${decision.status}`,
        "",
        "## Options",
        ...decision.options.map((option) => `- ${option}`),
        "",
        "## Recommendation",
        decision.recommendation,
        "",
        "## Resolution",
        decision.resolution ?? "Pending user feedback.",
        "",
        `**Resolved by:** ${decision.resolved_by ?? "pending"}`,
        `**Impacts:** ${decision.impacts.join(", ") || "none recorded"}`,
        "",
      ].join("\n"));
    }
    for (const phase of state.phases) {
      const phaseDirectory = path.join(directory, "phases", `${phase.id}-${phase.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`);
      fs.mkdirSync(phaseDirectory, { recursive: true });
      const overview = path.join(phaseDirectory, "README.md");
      if (!fs.existsSync(overview)) atomicWrite(overview, [
        `# ${phase.id}: ${phase.title}`,
        "",
        `**Status:** ${phase.status}`,
        "",
        "## Objective",
        phase.objective,
        "",
        "## Requirements",
        ...phase.requirement_ids.map((id) => `- ${id}`),
        "",
        "## Done when",
        ...phase.done_when.map((criterion) => `- [ ] ${criterion}`),
        "",
        "Create reviewed Business/Technical artifacts here when required by the selected workflow mode.",
        "",
      ].join("\n"));
    }
  }

  private updateHud(): void {
    if (!this.context?.hasUI) return;
    const state = this.getActive();
    this.context.ui.setStatus("itsol-initiative", state ? this.formatStatus(state) : undefined);
  }
}

export function registerInitiativeManager(pi: ExtensionAPI, tasks: TaskStateStore): InitiativeManager {
  const manager = new InitiativeManager(pi, tasks);
  pi.registerTool({
    name: "itsol_initiative_state",
    label: "ITSOL Initiative State",
    description: "Create, inspect, advance, replan, and complete a durable multi-phase initiative from a large business source. Writes canonical traceability, roadmap, progress, decision, phase, and state artifacts under .itsol/initiatives. Completion is blocked until all requirements have explicit dispositions and all phases complete.",
    promptSnippet: "Manage durable autonomous initiative delivery state and progress",
    promptGuidelines: [
      "Use for broad business documents whose full scope needs multiple planned implementation and QA phases; do not silently select one slice and stop.",
      "Start only after analyzing the complete source and assigning every requirement to at least one outcome-oriented phase.",
      "Update state after plan review, decisions, implementation, specialist review, integration, QA, and replanning. Continue executable phases automatically.",
      "Open a decision only for material product, scope, data, security, rollout, or architecture ambiguity; provide options, recommendation, and impacts.",
    ],
    parameters: ItsolInitiativeParamsSchema,
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      let state: InitiativeState | undefined;
      if (params.action === "start") state = manager.start(params, ctx.cwd);
      else if (params.action === "update") state = manager.update(params);
      else if (params.action === "decision") state = manager.decision(params);
      else if (params.action === "replan") state = manager.replan(params);
      else if (params.action === "complete") state = manager.complete(params.initiative_id, params.verification_evidence);
      else state = params.initiative_id ? manager.get(params.initiative_id) : manager.getActive();
      if (!state) throw new Error("No matching ITSOL initiative");
      return {
        content: [{ type: "text", text: `${manager.formatDetails(state)}\nContinue autonomously unless the next action is a material user decision or protected action.` }],
        details: { initiative: state },
      };
    },
    renderCall(args, theme) {
      const id = "initiative_id" in args ? args.initiative_id : "";
      return new Text(`${theme.fg("toolTitle", theme.bold("itsol_initiative_state "))}${theme.fg("accent", args.action)}${theme.fg("muted", id ? ` · ${id}` : "")}`, 0, 0);
    },
    renderResult(result, _options, theme) {
      const content = result.content[0];
      return new Text(theme.fg("muted", content?.type === "text" ? content.text : "(no initiative output)"), 0, 0);
    },
  });
  pi.registerCommand("itsol-initiative", {
    description: "Start, show, activate, pause, or resume durable ITSOL initiative delivery",
    handler: async (args, ctx) => {
      try {
        await manager.handleCommand(args, ctx);
      } catch (error) {
        if (ctx.hasUI) ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
  return manager;
}
