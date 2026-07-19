// Persistent Pi session state for itsol-workflow-mode and itsol-execution-policy.
import type { Message } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
  TaskStateDefinitionSchema,
  type ExecutionPolicy,
  type ItsolDelegateInput,
  type ItsolDelegateParams,
  type TaskStateDefinition,
  type WorkflowState,
} from "./policy.ts";

const ENTRY_TYPE = "itsol-task-state";
const STATE_VERSION = 1;

export interface DelegationAccountingResult {
  agent: string;
  role?: "explore" | "plan" | "implement" | "review";
  status: string;
  usage: { input: number; output: number; cost: number };
}

export interface CompletionEvidenceRecord {
  criterion: string;
  evidence: string;
}

export interface ReviewVerdictRecord {
  plan_id: string;
  fingerprint: string;
  round: number;
  verdict: "approve" | "changes-requested" | "blocked";
  findings: number;
  coverage_gaps: string[];
  recorded_at: number;
}

export interface CompletionRecord {
  status: "completed" | "partial" | "blocked" | "failed";
  achieved_stage: ExecutionPolicy["stop_after"];
  evidence: CompletionEvidenceRecord[];
  review_evidence: string[];
  unverified: string[];
  completed_at: number;
}

export interface TaskRuntimeState extends TaskStateDefinition {
  used_agents: string[];
  active_agents: string[];
  delegation_count: number;
  status_counts: Record<string, number>;
  agent_results: Record<string, { status: string; role?: string; updated_at: number }>;
  review_runs: number;
  review_verdict?: ReviewVerdictRecord;
  completion_attempts: number;
  last_completion_problems: string[];
  completion?: CompletionRecord;
  parent_cost: number;
  child_cost: number;
  child_input_tokens: number;
  child_output_tokens: number;
  created_at: number;
  updated_at: number;
}

interface PersistedTaskState {
  version: number;
  activeTaskId?: string;
  tasks: TaskRuntimeState[];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function createRuntimeState(definition: TaskStateDefinition, previous?: TaskRuntimeState): TaskRuntimeState {
  const now = Date.now();
  return {
    ...clone(definition),
    used_agents: previous?.used_agents ?? [],
    active_agents: previous?.active_agents ?? [],
    delegation_count: previous?.delegation_count ?? 0,
    status_counts: previous?.status_counts ?? {},
    agent_results: previous?.agent_results ?? {},
    review_runs: previous?.review_runs ?? 0,
    review_verdict: previous?.review_verdict,
    completion_attempts: previous?.completion_attempts ?? 0,
    last_completion_problems: previous?.last_completion_problems ?? [],
    completion: previous?.completion,
    parent_cost: previous?.parent_cost ?? 0,
    child_cost: previous?.child_cost ?? 0,
    child_input_tokens: previous?.child_input_tokens ?? 0,
    child_output_tokens: previous?.child_output_tokens ?? 0,
    created_at: previous?.created_at ?? now,
    updated_at: now,
  };
}

export function applyPreset(current: ExecutionPolicy, preset: "economy" | "standard" | "deep"): ExecutionPolicy {
  const common = {
    policy_sources: { base: "explicit-user-task-instruction", constraints: [...current.policy_sources.constraints] },
    model_control: "advisory" as const,
    reasoning_control: "enforced" as const,
    budget_escalation: "ask" as const,
  };
  if (preset === "economy") {
    return {
      ...common,
      preset,
      model_profile: "economy",
      reasoning_profile: "low",
      max_subagents: 0,
      max_parallel: 0,
      max_review_rounds: 1,
      stop_after: current.stop_after,
    };
  }
  if (preset === "deep") {
    return {
      ...common,
      preset,
      model_profile: "frontier",
      reasoning_profile: "high",
      max_subagents: "unlimited",
      max_parallel: 3,
      max_review_rounds: 2,
      stop_after: "integration-validated",
    };
  }
  return {
    ...common,
    preset,
    model_profile: "balanced",
    reasoning_profile: "medium",
    max_subagents: "unlimited",
    max_parallel: 3,
    max_review_rounds: 2,
    stop_after: "implementation-reviewed",
  };
}

function transitionMode(current: WorkflowState, mode: WorkflowState["workflow_mode"]): WorkflowState {
  if (mode === "governed") {
    return {
      ...current,
      workflow_mode: mode,
      mode_source: "explicit-user-task-instruction",
      decision_authority: "user",
      artifact_state: current.workflow_mode === mode && current.artifact_state === "approved" ? "approved" : "draft",
      execution_mode: "pending",
    };
  }
  if (mode === "autonomous-planned") {
    return {
      ...current,
      workflow_mode: mode,
      mode_source: "explicit-user-task-instruction",
      decision_authority: "delegated",
      artifact_state: current.artifact_state === "ready-for-execution" ? "ready-for-execution" : "draft",
      execution_mode: "auto",
    };
  }
  return {
    ...current,
    workflow_mode: mode,
    mode_source: "explicit-user-task-instruction",
    decision_authority: "delegated",
    artifact_state: "not-required",
    execution_mode: "auto",
  };
}

export class TaskStateStore {
  private readonly tasks = new Map<string, TaskRuntimeState>();
  private activeTaskId?: string;
  private context?: ExtensionContext;
  private parentCostDirty = false;
  private definitionValidator?: (definition: TaskStateDefinition) => void;

  constructor(
    private readonly pi: ExtensionAPI,
    private readonly agentCount: number,
    private readonly pluginVersion: string,
  ) {}

  setDefinitionValidator(validator: (definition: TaskStateDefinition) => void): void {
    this.definitionValidator = validator;
  }

  startSession(ctx: ExtensionContext): void {
    this.tasks.clear();
    this.activeTaskId = undefined;
    this.context = ctx;
    const entries = ctx.sessionManager.getBranch();
    for (let index = entries.length - 1; index >= 0; index--) {
      const entry = entries[index];
      if (entry.type !== "custom" || entry.customType !== ENTRY_TYPE) continue;
      const data = entry.data as PersistedTaskState | undefined;
      if (!data || data.version !== STATE_VERSION || !Array.isArray(data.tasks)) break;
      for (const task of data.tasks) {
        this.tasks.set(task.task_id, { ...createRuntimeState(task, task), active_agents: [] });
      }
      this.activeTaskId = data.activeTaskId && this.tasks.has(data.activeTaskId) ? data.activeTaskId : undefined;
      break;
    }
    this.updateHud();
  }

  getActive(): TaskRuntimeState | undefined {
    return this.activeTaskId ? this.tasks.get(this.activeTaskId) : undefined;
  }

  get(taskId: string): TaskRuntimeState | undefined {
    return this.tasks.get(taskId);
  }

  getUsedAgents(taskId: string): Set<string> {
    return new Set(this.tasks.get(taskId)?.used_agents ?? []);
  }

  setDefinition(definition: TaskStateDefinition, persist = true): TaskRuntimeState {
    this.definitionValidator?.(definition);
    const previous = this.tasks.get(definition.task_id);
    const canonicalChanged = previous && JSON.stringify({
      workflow_state: previous.workflow_state,
      execution_policy: previous.execution_policy,
      done_when: previous.done_when,
    }) !== JSON.stringify({
      workflow_state: definition.workflow_state,
      execution_policy: definition.execution_policy,
      done_when: definition.done_when,
    });
    const state = createRuntimeState(definition, previous);
    if (canonicalChanged) {
      state.completion = undefined;
      state.review_verdict = undefined;
      state.review_runs = 0;
      state.completion_attempts = 0;
      state.last_completion_problems = [];
    }
    this.tasks.set(definition.task_id, state);
    this.activeTaskId = definition.task_id;
    if (persist) this.persist();
    this.updateHud();
    return state;
  }

  resolveDelegation(input: ItsolDelegateInput): ItsolDelegateParams {
    const existing = this.tasks.get(input.task_id);
    const workflowState = input.workflow_state ?? existing?.workflow_state;
    const executionPolicy = input.execution_policy ?? existing?.execution_policy;
    const doneWhen = input.done_when ?? existing?.done_when;
    if (!workflowState || !executionPolicy || !doneWhen?.length) {
      throw new Error(
        `Task state ${input.task_id} is incomplete. Call itsol_task_state first or include workflow_state, execution_policy, and done_when.`,
      );
    }
    const definition: TaskStateDefinition = {
      task_id: input.task_id,
      workflow_state: workflowState,
      execution_policy: executionPolicy,
      done_when: [...doneWhen],
      policy_context: input.policy_context ?? existing?.policy_context,
    };
    this.setDefinition(definition);
    return { ...definition, task: input.task, tasks: input.tasks };
  }

  prepareReviewers(taskId: string, agents: string[]): void {
    if (!agents.length) return;
    const state = this.require(taskId);
    for (const agent of agents) delete state.agent_results[agent];
    state.completion = undefined;
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
  }

  beginDelegation(taskId: string, agents: string[]): void {
    const state = this.require(taskId);
    state.used_agents = [...new Set([...state.used_agents, ...agents])];
    state.active_agents = [...new Set([...state.active_agents, ...agents])];
    state.delegation_count++;
    state.completion = undefined;
    state.last_completion_problems = [];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
  }

  finishDelegation(taskId: string, agents: string[], results: DelegationAccountingResult[] = []): void {
    const state = this.require(taskId);
    const finished = new Set(agents);
    state.active_agents = state.active_agents.filter((agent) => !finished.has(agent));
    for (const result of results) {
      state.child_cost += result.usage.cost;
      state.child_input_tokens += result.usage.input;
      state.child_output_tokens += result.usage.output;
      state.status_counts[result.status] = (state.status_counts[result.status] ?? 0) + 1;
      state.agent_results[result.agent] = {
        status: result.status,
        role: result.role,
        updated_at: Date.now(),
      };
    }
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
  }

  recordReviewVerdict(taskId: string, verdict: ReviewVerdictRecord): void {
    const state = this.require(taskId);
    state.review_verdict = clone(verdict);
    state.review_runs++;
    state.completion = undefined;
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
  }

  recordCompletionAttempt(taskId: string, problems: string[]): number {
    const state = this.require(taskId);
    state.completion_attempts++;
    state.last_completion_problems = [...problems];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
    return state.completion_attempts;
  }

  recordCompletion(taskId: string, completion: CompletionRecord): void {
    const state = this.require(taskId);
    state.completion = clone(completion);
    state.last_completion_problems = [];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
  }

  recordParentUsage(message: Message): void {
    const state = this.getActive();
    if (!state || message.role !== "assistant") return;
    const cost = message.usage?.cost?.total ?? 0;
    if (!cost) return;
    state.parent_cost += cost;
    state.updated_at = Date.now();
    this.parentCostDirty = true;
    this.updateHud();
  }

  flush(): void {
    if (!this.parentCostDirty) return;
    this.parentCostDirty = false;
    this.persist();
  }

  activate(taskId: string): TaskRuntimeState {
    const state = this.require(taskId);
    this.activeTaskId = taskId;
    this.persist();
    this.updateHud();
    return state;
  }

  resetReview(taskId: string): void {
    const state = this.require(taskId);
    state.review_verdict = undefined;
    state.review_runs = 0;
    for (const [agent, result] of Object.entries(state.agent_results)) {
      if (result.role === "review") delete state.agent_results[agent];
    }
    state.completion = undefined;
    state.completion_attempts = 0;
    state.last_completion_problems = [];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
  }

  reset(taskId?: string): void {
    const target = taskId ?? this.activeTaskId;
    if (!target) return;
    this.tasks.delete(target);
    if (this.activeTaskId === target) this.activeTaskId = this.tasks.keys().next().value;
    this.persist();
    this.updateHud();
  }

  setMode(mode: WorkflowState["workflow_mode"]): TaskRuntimeState {
    const state = this.requireActive();
    const workflowState = transitionMode(state.workflow_state, mode);
    this.definitionValidator?.({
      task_id: state.task_id,
      workflow_state: workflowState,
      execution_policy: state.execution_policy,
      done_when: state.done_when,
      policy_context: state.policy_context,
    });
    state.workflow_state = workflowState;
    state.completion = undefined;
    state.review_verdict = undefined;
    state.review_runs = 0;
    state.completion_attempts = 0;
    state.last_completion_problems = [];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
    return state;
  }

  setAgentLimit(limit: number | "unlimited"): TaskRuntimeState {
    const state = this.requireActive();
    if (state.active_agents.length) throw new Error("Cannot change agent limits while delegated agents are active");
    if (limit !== "unlimited" && (!Number.isInteger(limit) || limit < 0 || limit > 64)) {
      throw new Error("max_subagents must be unlimited or an integer from 0 to 64");
    }
    const maxParallel = limit === "unlimited" ? state.execution_policy.max_parallel : Math.min(limit, state.execution_policy.max_parallel);
    const executionPolicy: ExecutionPolicy = {
      ...state.execution_policy,
      max_subagents: limit,
      max_parallel: maxParallel,
      policy_sources: {
        base: "explicit-user-task-instruction",
        constraints: [...new Set([...state.execution_policy.policy_sources.constraints, `max_subagents=${limit}`])],
      },
    };
    this.definitionValidator?.({
      task_id: state.task_id,
      workflow_state: state.workflow_state,
      execution_policy: executionPolicy,
      done_when: state.done_when,
      policy_context: state.policy_context,
    });
    state.execution_policy = executionPolicy;
    state.completion = undefined;
    state.review_verdict = undefined;
    state.review_runs = 0;
    state.completion_attempts = 0;
    state.last_completion_problems = [];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
    return state;
  }

  setParallelLimit(limit: number): TaskRuntimeState {
    const state = this.requireActive();
    if (state.active_agents.length) throw new Error("Cannot change parallel limits while delegated agents are active");
    if (!Number.isInteger(limit) || limit < 0 || limit > 10) throw new Error("max_parallel must be an integer from 0 to 10");
    if (state.execution_policy.max_subagents !== "unlimited" && limit > state.execution_policy.max_subagents) {
      throw new Error(`max_parallel=${limit} exceeds max_subagents=${state.execution_policy.max_subagents}`);
    }
    const executionPolicy: ExecutionPolicy = {
      ...state.execution_policy,
      max_parallel: limit,
      policy_sources: {
        base: "explicit-user-task-instruction",
        constraints: [...new Set([...state.execution_policy.policy_sources.constraints, `max_parallel=${limit}`])],
      },
    };
    this.definitionValidator?.({
      task_id: state.task_id,
      workflow_state: state.workflow_state,
      execution_policy: executionPolicy,
      done_when: state.done_when,
      policy_context: state.policy_context,
    });
    state.execution_policy = executionPolicy;
    state.completion = undefined;
    state.completion_attempts = 0;
    state.last_completion_problems = [];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
    return state;
  }

  setPreset(preset: "economy" | "standard" | "deep"): TaskRuntimeState {
    const state = this.requireActive();
    const executionPolicy = applyPreset(state.execution_policy, preset);
    this.definitionValidator?.({
      task_id: state.task_id,
      workflow_state: state.workflow_state,
      execution_policy: executionPolicy,
      done_when: state.done_when,
      policy_context: state.policy_context,
    });
    state.execution_policy = executionPolicy;
    state.completion = undefined;
    state.review_verdict = undefined;
    state.review_runs = 0;
    state.completion_attempts = 0;
    state.last_completion_problems = [];
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
    return state;
  }

  formatStatus(state = this.getActive()): string {
    if (!state) return `ITSOL Powers v${this.pluginVersion} · ${this.agentCount} agents`;
    const policy = state.execution_policy;
    const totalCost = state.parent_cost + state.child_cost;
    const active = state.active_agents.length ? ` · ${state.active_agents.length} active` : "";
    const completion = state.completion
      ? ` · ${state.completion.status}`
      : state.completion_attempts ? ` · gate rejected ${state.completion_attempts}` : "";
    const agentLimit = policy.max_subagents === "unlimited" ? "∞" : String(policy.max_subagents);
    return `ITSOL v${this.pluginVersion}${completion} · ${state.workflow_state.workflow_mode} · ${policy.preset} · agents ${state.used_agents.length}/${agentLimit}${active} · $${totalCost.toFixed(4)}`;
  }

  formatDetails(state = this.getActive()): string {
    if (!state) return "No active ITSOL task state.";
    const totalCost = state.parent_cost + state.child_cost;
    const statuses = Object.entries(state.status_counts).map(([status, count]) => `${status}=${count}`).join(", ") || "none";
    return [
      `Task: ${state.task_id}`,
      `Workflow: ${state.workflow_state.workflow_mode} (${state.workflow_state.artifact_state}, ${state.workflow_state.execution_mode})`,
      `Policy: ${state.execution_policy.preset} · ${state.execution_policy.model_profile}/${state.execution_policy.reasoning_profile}`,
      `Agents: ${state.used_agents.length}/${state.execution_policy.max_subagents === "unlimited" ? "∞" : state.execution_policy.max_subagents} used, ${state.active_agents.length} active`,
      `Delegations: ${state.delegation_count} · results: ${statuses}`,
      `Review runs: ${state.review_runs} · verdict: ${state.review_verdict?.verdict ?? "none"} · completion attempts: ${state.completion_attempts}`,
      `Completion: ${state.completion ? `${state.completion.status} at ${state.completion.achieved_stage}` : "not accepted"}`,
      `Cost: $${totalCost.toFixed(4)} (main $${state.parent_cost.toFixed(4)}, children $${state.child_cost.toFixed(4)})`,
      `Child tokens: ${state.child_input_tokens} input, ${state.child_output_tokens} output`,
      `Stop after: ${state.execution_policy.stop_after}`,
      `Done when: ${state.done_when.join("; ")}`,
    ].join("\n");
  }

  formatPromptContext(): string | undefined {
    const state = this.getActive();
    if (!state) return undefined;
    return [
      "## Active ITSOL task state (extension-managed)",
      "Use this state as the canonical task state. Update it with `itsol_task_state` instead of silently changing fields.",
      "```json",
      JSON.stringify({
        task_id: state.task_id,
        workflow_state: state.workflow_state,
        execution_policy: state.execution_policy,
        done_when: state.done_when,
        policy_context: state.policy_context,
        runtime: {
          used_agents: state.used_agents,
          active_agents: state.active_agents,
          delegation_count: state.delegation_count,
          status_counts: state.status_counts,
          agent_results: state.agent_results,
          review_runs: state.review_runs,
          review_verdict: state.review_verdict,
          completion_attempts: state.completion_attempts,
          last_completion_problems: state.last_completion_problems,
          completion: state.completion,
        },
      }, null, 2),
      "```",
    ].join("\n");
  }

  private require(taskId: string): TaskRuntimeState {
    const state = this.tasks.get(taskId);
    if (!state) throw new Error(`Unknown ITSOL task state: ${taskId}`);
    return state;
  }

  private requireActive(): TaskRuntimeState {
    const state = this.getActive();
    if (!state) throw new Error("No active ITSOL task. Call itsol_task_state first.");
    return state;
  }

  private persist(): void {
    this.pi.appendEntry(ENTRY_TYPE, {
      version: STATE_VERSION,
      activeTaskId: this.activeTaskId,
      tasks: [...this.tasks.values()].map((task) => clone(task)),
    } satisfies PersistedTaskState);
  }

  private updateHud(): void {
    if (this.context?.hasUI) this.context.ui.setStatus("itsolpowers", this.formatStatus());
  }
}

export function registerTaskState(pi: ExtensionAPI, store: TaskStateStore): void {
  pi.registerTool({
    name: "itsol_task_state",
    label: "ITSOL Task State",
    description: "Create or update the canonical workflow mode, execution policy, and observable done_when criteria for the current ITSOL task. The state persists in the Pi session and can be reused by itsol_delegate using only task_id.",
    promptSnippet: "Persist canonical ITSOL workflow and execution state for the current task",
    promptGuidelines: [
      "Use itsol_task_state once the workflow mode and execution policy are resolved, before planning, implementation, or delegation.",
      "Use itsol_task_state whenever an authorized mode, policy, stop boundary, protected constraint, or done_when criterion changes.",
    ],
    parameters: TaskStateDefinitionSchema,
    async execute(_toolCallId, params) {
      const state = store.setDefinition(params);
      return {
        content: [{ type: "text", text: `Stored ITSOL task state: ${state.task_id}\n${store.formatDetails(state)}` }],
        details: { taskState: clone(state) },
      };
    },
  });

  pi.registerCommand("itsol", {
    description: "Show or update ITSOL task state: status, activate, mode, preset, agents, parallel, reset",
    handler: async (args, ctx) => {
      const [action = "status", value] = args.trim().split(/\s+/, 2);
      try {
        if (action === "activate" && value) store.activate(value);
        else if (action === "reset") store.reset(value);
        else if (action === "mode" && ["governed", "autonomous-planned", "direct"].includes(value)) {
          store.setMode(value as WorkflowState["workflow_mode"]);
        } else if (action === "preset" && ["economy", "standard", "deep"].includes(value)) {
          store.setPreset(value as "economy" | "standard" | "deep");
        } else if (action === "agents" && value === "unlimited") {
          store.setAgentLimit("unlimited");
        } else if (action === "agents" && /^\d+$/.test(value ?? "")) {
          store.setAgentLimit(Number(value));
        } else if (action === "parallel" && /^\d+$/.test(value ?? "")) {
          store.setParallelLimit(Number(value));
        } else if (action !== "status") {
          throw new Error("Usage: /itsol status | activate <task-id> | mode <mode> | preset <preset> | agents <unlimited|0..64> | parallel <0..10> | reset [task-id]");
        }
        if (ctx.hasUI) ctx.ui.notify(store.formatDetails(), "info");
      } catch (error) {
        if (ctx.hasUI) ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
}
