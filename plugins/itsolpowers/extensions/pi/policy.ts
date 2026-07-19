// Machine-enforceable adapter for itsol-workflow-mode and itsol-execution-policy.
import path from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type, type Static } from "typebox";
import type { ItsolAgentConfig } from "./agents.ts";
import { agentCanWrite } from "./agents.ts";

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
  ], { description: "Distinct child agent identities/types for the task, not execution count. The same type may run multiple independent work items. Defaults to unlimited; use a number only for an explicit user or repository ceiling." }),
  max_parallel: Type.Integer({ minimum: 0, maximum: 10, description: "Concurrent execution-instance ceiling, independent of the distinct agent-type ceiling." }),
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

export const DelegatedTaskSchema = Type.Object({
  agent: Type.String({ minLength: 1, description: "ITSOL agent name, matching agents/<name>.md" }),
  role: Type.Optional(StringEnum(["explore", "plan", "implement", "review"] as const, {
    description: "Cost-routing role. Omit to infer it from the selected ITSOL agent.",
  })),
  model: Type.Optional(Type.String({
    pattern: "^[^/]+/.+$",
    description: "Exact Pi provider/model id for this child. Omit to use the configured model profile and role, then inherit the main model as fallback.",
  })),
  work_item_id: Type.Optional(Type.String({
    pattern: "^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$",
    description: "Stable work-item identity. Reuse it for follow-up runs of the same scoped assignment, especially when one agent type handles multiple areas.",
  })),
  task: Type.String({ minLength: 1 }),
  cwd: Type.Optional(Type.String()),
  operations: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  read_scope: Type.Array(Type.String(), { minItems: 1 }),
  write_scope: Type.Array(Type.String()),
  forbidden_scope: Type.Array(Type.String()),
  required_evidence: Type.Array(Type.String(), { minItems: 1 }),
  stop_after: Type.Optional(ExecutionPolicySchema.properties.stop_after),
});

export const TaskStateDefinitionSchema = Type.Object({
  task_id: Type.String({ minLength: 1, description: "Stable identifier for this top-level task" }),
  workflow_state: WorkflowStateSchema,
  execution_policy: ExecutionPolicySchema,
  done_when: Type.Array(Type.String({ minLength: 1 }), { minItems: 1 }),
  policy_context: Type.Optional(Type.Object({
    paths: Type.Array(Type.String()),
    operations: Type.Array(Type.String()),
  })),
});

export const ItsolDelegateParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1, description: "Stable identifier for this top-level task" }),
  workflow_state: Type.Optional(WorkflowStateSchema),
  execution_policy: Type.Optional(ExecutionPolicySchema),
  done_when: Type.Optional(Type.Array(Type.String({ minLength: 1 }), { minItems: 1 })),
  policy_context: Type.Optional(Type.Object({
    paths: Type.Array(Type.String()),
    operations: Type.Array(Type.String()),
  })),
  task: Type.Optional(DelegatedTaskSchema),
  tasks: Type.Optional(Type.Array(DelegatedTaskSchema, { minItems: 1, maxItems: 10 })),
});

export type WorkflowState = Static<typeof WorkflowStateSchema>;
export type ExecutionPolicy = Static<typeof ExecutionPolicySchema>;
export type DelegatedTask = Static<typeof DelegatedTaskSchema>;
export type TaskStateDefinition = Static<typeof TaskStateDefinitionSchema>;
export type ItsolDelegateInput = Static<typeof ItsolDelegateParamsSchema>;
export type ItsolDelegateParams = TaskStateDefinition & Pick<ItsolDelegateInput, "task" | "tasks">;

export const STOP_RANK: Record<ExecutionPolicy["stop_after"], number> = {
  analysis: 10,
  "business-plan": 20,
  "technical-plan": 30,
  implementation: 40,
  "implementation-reviewed": 50,
  "integration-validated": 60,
  "pr-created": 70,
  "first-review-batch": 80,
  "qa-handoff": 90,
  "deployment-ready": 100,
};

function normalizeScope(scope: string): string {
  const normalized = scope.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
  return normalized || ".";
}

function scopesOverlap(left: string, right: string): boolean {
  const a = normalizeScope(left);
  const b = normalizeScope(right);
  if (a === "." || b === ".") return true;
  if (/[*?{[]/.test(a) || /[*?{[]/.test(b)) return true;
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

export function validateDelegation(
  params: ItsolDelegateParams,
  tasks: DelegatedTask[],
  agentsByName: Map<string, ItsolAgentConfig>,
  previouslyUsedAgents: Set<string>,
  options: { modelControlEnforced?: boolean } = {},
): void {
  if (params.execution_policy.model_control === "enforced" && !options.modelControlEnforced) {
    throw new Error(
      "execution_policy.model_control=enforced requires a configured profile mapping for every delegated model",
    );
  }
  const agentLimit = params.execution_policy.max_subagents;
  if (tasks.length > params.execution_policy.max_parallel) {
    throw new Error(
      `Delegation requests ${tasks.length} parallel tasks, but max_parallel is ${params.execution_policy.max_parallel}`,
    );
  }

  const requestedNames = new Set(tasks.map((task) => task.agent));
  const allNames = new Set([...previouslyUsedAgents, ...requestedNames]);
  if (agentLimit !== "unlimited" && allNames.size > agentLimit) {
    throw new Error(
      `Delegation would use ${allNames.size} distinct agents, but max_subagents is ${agentLimit}`,
    );
  }

  const automaticPlanReviews = tasks.every((task) =>
    task.role === "review"
    && task.write_scope.length === 0
    && (task.operations ?? []).includes("rubber-duck-plan-review"));
  if ((params.workflow_state.execution_mode === "pending" || params.workflow_state.execution_mode === "inline")
    && !automaticPlanReviews) {
    throw new Error(`workflow_state.execution_mode=${params.workflow_state.execution_mode} does not authorize delegation`);
  }

  const writableTasks: Array<{ task: DelegatedTask; agent: ItsolAgentConfig }> = [];
  for (const task of tasks) {
    const agent = agentsByName.get(task.agent);
    if (!agent) throw new Error(`Unknown ITSOL agent: ${task.agent}`);
    if (task.stop_after && STOP_RANK[task.stop_after] > STOP_RANK[params.execution_policy.stop_after]) {
      throw new Error(`Child ${task.agent} stop_after cannot be later than the parent stop_after`);
    }

    if (agentCanWrite(agent)) {
      writableTasks.push({ task, agent });
      if (task.write_scope.length === 0) {
        throw new Error(`Writing agent ${agent.name} requires a non-empty write_scope`);
      }
      const expectedState: Record<WorkflowState["workflow_mode"], WorkflowState["artifact_state"]> = {
        governed: "approved",
        "autonomous-planned": "ready-for-execution",
        direct: "not-required",
      };
      if (params.workflow_state.artifact_state !== expectedState[params.workflow_state.workflow_mode]) {
        throw new Error(
          `Writing agent ${agent.name} is not authorized: ${params.workflow_state.workflow_mode} requires artifact_state=${expectedState[params.workflow_state.workflow_mode]}`,
        );
      }
    } else if (task.write_scope.length > 0) {
      throw new Error(`Read-only agent ${agent.name} must have an empty write_scope`);
    }

    for (const writePath of task.write_scope) {
      if (task.forbidden_scope.some((forbidden) => scopesOverlap(writePath, forbidden))) {
        throw new Error(`Task ${agent.name} write_scope overlaps forbidden_scope: ${writePath}`);
      }
    }
  }

  for (let left = 0; left < writableTasks.length; left++) {
    for (let right = left + 1; right < writableTasks.length; right++) {
      for (const leftPath of writableTasks[left].task.write_scope) {
        for (const rightPath of writableTasks[right].task.write_scope) {
          if (scopesOverlap(leftPath, rightPath)) {
            throw new Error(
              `Parallel writers ${writableTasks[left].agent.name} and ${writableTasks[right].agent.name} have overlapping write scopes: ${leftPath} / ${rightPath}`,
            );
          }
        }
      }
    }
  }
}

export function resolveTaskCwd(parentCwd: string, requested?: string): string {
  return requested ? path.resolve(parentCwd, requested) : parentCwd;
}
