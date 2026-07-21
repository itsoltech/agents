// Persistent informational Pi session state for itsol-workflow-mode and itsol-execution-policy.
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type, type Static } from "typebox";

const ENTRY_TYPE = "itsol-task-state";
const STATE_VERSION = 1;

export const WorkflowStateSchema = Type.Object({
  workflow_mode: StringEnum(["governed", "autonomous-planned", "direct"] as const),
  mode_source: Type.String({ minLength: 1 }),
  decision_authority: StringEnum(["user", "delegated"] as const),
  scope: Type.String({ minLength: 1 }),
  artifact_state: StringEnum(["draft", "approved", "ready-for-execution", "not-required"] as const),
  execution_mode: StringEnum(["pending", "inline", "subagents", "auto"] as const),
  protected_constraints: Type.Array(Type.String()),
});

export const ExecutionPolicySchema = Type.Object({
  preset: StringEnum(["economy", "standard", "deep", "custom"] as const),
  policy_sources: Type.Object({
    base: Type.String({ minLength: 1 }),
    constraints: Type.Array(Type.String()),
  }),
  model_profile: StringEnum(["economy", "balanced", "frontier"] as const),
  model_control: StringEnum(["enforced", "advisory"] as const),
  reasoning_profile: StringEnum(["low", "medium", "high"] as const),
  reasoning_control: StringEnum(["enforced", "advisory"] as const),
  max_subagents: Type.Union([
    Type.Integer({ minimum: 0, maximum: 64 }),
    Type.Literal("unlimited"),
  ]),
  max_parallel: Type.Integer({ minimum: 0, maximum: 3 }),
  max_review_rounds: Type.Integer({ minimum: 0, maximum: 2 }),
  stop_after: StringEnum([
    "analysis",
    "business-plan",
    "technical-plan",
    "implementation",
    "implementation-reviewed",
    "integration-validated",
    "pr-created",
    "first-review-batch",
    "qa-handoff",
    "deployment-ready",
  ] as const),
  budget_escalation: StringEnum(["forbidden", "ask"] as const),
});

export const TaskStateDefinitionSchema = Type.Object({
  task_id: Type.String({ minLength: 1, description: "Stable identifier for this top-level task" }),
  workflow_state: WorkflowStateSchema,
  execution_policy: ExecutionPolicySchema,
  done_when: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
});

export type WorkflowState = Static<typeof WorkflowStateSchema>;
export type ExecutionPolicy = Static<typeof ExecutionPolicySchema>;
export type TaskStateDefinition = Static<typeof TaskStateDefinitionSchema>;

export interface TaskRuntimeState extends TaskStateDefinition {
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

function createRuntimeState(
  definition: TaskStateDefinition,
  previous?: Partial<TaskRuntimeState>,
): TaskRuntimeState {
  const now = Date.now();
  return {
    ...clone(definition),
    created_at: typeof previous?.created_at === "number" ? previous.created_at : now,
    updated_at: now,
  };
}

function normalizePersistedTask(value: unknown): TaskRuntimeState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const task = value as Partial<TaskRuntimeState>;
  if (typeof task.task_id !== "string" || !task.workflow_state || !task.execution_policy || !Array.isArray(task.done_when)) {
    return undefined;
  }
  return createRuntimeState({
    task_id: task.task_id,
    workflow_state: clone(task.workflow_state),
    execution_policy: clone(task.execution_policy),
    done_when: task.done_when.map(String),
  }, task);
}

export function applyPreset(current: ExecutionPolicy, preset: "economy" | "standard" | "deep"): ExecutionPolicy {
  const common = {
    policy_sources: { base: "explicit-user-task-instruction", constraints: [...current.policy_sources.constraints] },
    model_control: "advisory" as const,
    reasoning_control: "advisory" as const,
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

  constructor(
    private readonly pi: ExtensionAPI,
    private readonly agentCount: number,
    private readonly pluginVersion: string,
  ) {}

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
      for (const candidate of data.tasks) {
        const task = normalizePersistedTask(candidate);
        if (task) this.tasks.set(task.task_id, task);
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

  setDefinition(definition: TaskStateDefinition, persist = true): TaskRuntimeState {
    const state = createRuntimeState(definition, this.tasks.get(definition.task_id));
    this.tasks.set(definition.task_id, state);
    this.activeTaskId = definition.task_id;
    if (persist) this.persist();
    this.updateHud();
    return state;
  }

  activate(taskId: string): TaskRuntimeState {
    const state = this.require(taskId);
    this.activeTaskId = taskId;
    this.persist();
    this.updateHud();
    return state;
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
    state.workflow_state = transitionMode(state.workflow_state, mode);
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
    return state;
  }

  setPreset(preset: "economy" | "standard" | "deep"): TaskRuntimeState {
    const state = this.requireActive();
    state.execution_policy = applyPreset(state.execution_policy, preset);
    state.updated_at = Date.now();
    this.persist();
    this.updateHud();
    return state;
  }

  formatStatus(state = this.getActive()): string {
    if (!state) return `ITSOL Powers v${this.pluginVersion} · ${this.agentCount} agents`;
    return `ITSOL v${this.pluginVersion} · ${state.workflow_state.workflow_mode} · ${state.execution_policy.preset} · stop ${state.execution_policy.stop_after}`;
  }

  formatDetails(state = this.getActive()): string {
    if (!state) return "No active ITSOL task state.";
    return [
      `Task: ${state.task_id}`,
      `Workflow: ${state.workflow_state.workflow_mode} (${state.workflow_state.artifact_state}, ${state.workflow_state.execution_mode})`,
      `Policy: ${state.execution_policy.preset} · ${state.execution_policy.model_profile}/${state.execution_policy.reasoning_profile}`,
      `Stop after: ${state.execution_policy.stop_after}`,
      `Done when: ${state.done_when.join("; ")}`,
    ].join("\n");
  }

  formatPromptContext(): string | undefined {
    const state = this.getActive();
    if (!state) return undefined;
    return [
      "## Active ITSOL task state (informational)",
      "Use this state as the current task context. Update it with `itsol_task_state` instead of silently changing fields.",
      "```json",
      JSON.stringify({
        task_id: state.task_id,
        workflow_state: state.workflow_state,
        execution_policy: state.execution_policy,
        done_when: state.done_when,
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
    description: "Store informational workflow mode, execution policy, and observable done_when criteria for the current ITSOL task in the Pi session.",
    promptSnippet: "Persist ITSOL workflow and execution context for the current task",
    promptGuidelines: [
      "Use itsol_task_state once the workflow mode and execution policy are resolved.",
      "Update it whenever an authorized mode, policy, stop boundary, protected constraint, or done_when criterion changes.",
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
    description: "Show or update ITSOL task state: status, activate, mode, preset, reset",
    handler: async (args, ctx) => {
      const [action = "status", value] = args.trim().split(/\s+/, 2);
      try {
        if (action === "activate" && value) store.activate(value);
        else if (action === "reset") store.reset(value);
        else if (action === "mode" && ["governed", "autonomous-planned", "direct"].includes(value)) {
          store.setMode(value as WorkflowState["workflow_mode"]);
        } else if (action === "preset" && ["economy", "standard", "deep"].includes(value)) {
          store.setPreset(value as "economy" | "standard" | "deep");
        } else if (action !== "status") {
          throw new Error("Usage: /itsol status | activate <task-id> | mode <mode> | preset <preset> | reset [task-id]");
        }
        if (ctx.hasUI) ctx.ui.notify(store.formatDetails(), "info");
      } catch (error) {
        if (ctx.hasUI) ctx.ui.notify(error instanceof Error ? error.message : String(error), "error");
      }
    },
  });
}
