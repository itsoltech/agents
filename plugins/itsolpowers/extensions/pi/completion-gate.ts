// Evidence-based completion gate for persisted itsol-workflow-mode and itsol-execution-policy state.
import { StringEnum } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import { ExecutionPolicySchema, STOP_RANK } from "./policy.ts";
import type { CompletionRecord, TaskRuntimeState, TaskStateStore } from "./task-state.ts";

const CompletionEvidenceSchema = Type.Object({
  criterion: Type.String({ minLength: 1, description: "Exact done_when criterion" }),
  evidence: Type.String({ minLength: 1, description: "Concrete command result or evidence summary" }),
});

export const ItsolCompleteParamsSchema = Type.Object({
  task_id: Type.String({ minLength: 1 }),
  status: StringEnum(["completed", "partial", "blocked", "failed"] as const),
  achieved_stage: ExecutionPolicySchema.properties.stop_after,
  evidence: Type.Array(CompletionEvidenceSchema),
  review_evidence: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
  unverified: Type.Array(Type.String({ minLength: 1 })),
});

export type ItsolCompleteParams = Static<typeof ItsolCompleteParamsSchema>;

export interface CompletionEvaluation {
  accepted: boolean;
  problems: string[];
}

function normalized(value: string): string {
  return value.trim();
}

export function evaluateCompletion(state: TaskRuntimeState, request: ItsolCompleteParams): CompletionEvaluation {
  const problems: string[] = [];
  const reviewEvidence = request.review_evidence ?? [];

  if (state.active_agents.length) {
    problems.push(`active delegated agents remain: ${state.active_agents.join(", ")}`);
  }
  if (STOP_RANK[request.achieved_stage] < STOP_RANK[state.execution_policy.stop_after]) {
    problems.push(
      `achieved_stage=${request.achieved_stage} is earlier than stop_after=${state.execution_policy.stop_after}`,
    );
  }

  if (request.status === "completed") {
    const evidenceByCriterion = new Map<string, string[]>();
    for (const item of request.evidence) {
      const criterion = normalized(item.criterion);
      const entries = evidenceByCriterion.get(criterion) ?? [];
      entries.push(normalized(item.evidence));
      evidenceByCriterion.set(criterion, entries);
      if (/^not run\b/i.test(item.evidence.trim())) {
        problems.push(`completed evidence cannot use not run: ${criterion}`);
      }
    }
    for (const criterion of state.done_when) {
      const matches = evidenceByCriterion.get(normalized(criterion)) ?? [];
      if (!matches.length) problems.push(`missing evidence for done_when: ${criterion}`);
      else if (matches.length > 1) problems.push(`duplicate evidence for done_when: ${criterion}`);
    }
    if (request.unverified.length) {
      problems.push(`completed status has unverified items: ${request.unverified.join("; ")}`);
    }

    const unresolvedAgents = Object.entries(state.agent_results)
      .filter(([, result]) => result.status !== "completed")
      .map(([agent, result]) => `${agent}=${result.status}`);
    if (unresolvedAgents.length) problems.push(`unresolved delegated results: ${unresolvedAgents.join(", ")}`);

    const reviewRequired = state.execution_policy.max_review_rounds > 0
      && STOP_RANK[state.execution_policy.stop_after] >= STOP_RANK["implementation-reviewed"];
    if (reviewRequired && state.review_runs === 0 && reviewEvidence.length === 0) {
      problems.push("required implementation review has no delegated run or inline review evidence");
    }

    if (STOP_RANK[request.achieved_stage] >= STOP_RANK.implementation) {
      const expectedArtifact = {
        governed: "approved",
        "autonomous-planned": "ready-for-execution",
        direct: "not-required",
      } as const;
      const expected = expectedArtifact[state.workflow_state.workflow_mode];
      if (state.workflow_state.artifact_state !== expected) {
        problems.push(
          `${state.workflow_state.workflow_mode} implementation completion requires artifact_state=${expected}`,
        );
      }
    }
  } else if (!request.unverified.length) {
    problems.push(`${request.status} status requires at least one unverified gap or blocker`);
  }

  return { accepted: problems.length === 0, problems };
}

export function registerCompletionGate(pi: ExtensionAPI, store: TaskStateStore): void {
  let toolsToRestore: string[] | undefined;
  const forceFinalSummaryTurn = () => {
    if (!toolsToRestore) toolsToRestore = pi.getActiveTools();
    pi.setActiveTools([]);
  };
  pi.on("agent_settled", () => {
    if (!toolsToRestore) return;
    const current = pi.getActiveTools();
    pi.setActiveTools([...new Set([...current, ...toolsToRestore])]);
    toolsToRestore = undefined;
  });

  pi.registerTool({
    name: "itsol_complete",
    label: "ITSOL Complete",
    description: "Finish an ITSOL task with structured completion evidence. Validates exact done_when coverage, active and unresolved agents, review evidence, artifact authorization, and ranked stop_after. A rejected first attempt allows one corrective agent turn. Accepted or finally rejected gates force one tool-free final summary turn, then restore the previous tool set.",
    promptSnippet: "Submit final ITSOL task status and evidence through the completion gate",
    promptGuidelines: [
      "Use itsol_complete as the final tool for every extension-managed ITSOL task; after the gate result, write exactly one concise user-facing summary in the forced tool-free turn.",
      "Call itsol_complete with completed only when every exact done_when criterion has concrete evidence and unverified is empty.",
      "Use partial, blocked, or failed with explicit unverified gaps when the task cannot honestly complete.",
    ],
    parameters: ItsolCompleteParamsSchema,

    async execute(_toolCallId, params) {
      const state = store.get(params.task_id);
      if (!state) throw new Error(`Unknown ITSOL task state: ${params.task_id}`);
      const evaluation = evaluateCompletion(state, params);
      const attempt = store.recordCompletionAttempt(params.task_id, evaluation.problems);

      if (!evaluation.accepted) {
        const finalRejection = attempt >= 2;
        if (finalRejection) forceFinalSummaryTurn();
        const text = [
          `Completion rejected (attempt ${attempt}):`,
          ...evaluation.problems.map((problem) => `- ${problem}`),
          finalRejection
            ? "No automatic correction remains. In the next tool-free turn, write the final user-facing summary and report the task as partial or blocked."
            : "One corrective turn remains. Resolve the listed problems, then call itsol_complete once more.",
        ].join("\n");
        return {
          content: [{ type: "text", text }],
          details: { accepted: false, attempt, problems: evaluation.problems },
        };
      }

      const completion: CompletionRecord = {
        status: params.status,
        achieved_stage: params.achieved_stage,
        evidence: params.evidence.map((item) => ({ ...item })),
        review_evidence: [...(params.review_evidence ?? [])],
        unverified: [...params.unverified],
        completed_at: Date.now(),
      };
      store.recordCompletion(params.task_id, completion);
      forceFinalSummaryTurn();
      return {
        content: [{
          type: "text",
          text: [
            `ITSOL task ${params.task_id}: ${params.status}`,
            `Achieved stage: ${params.achieved_stage}`,
            `Evidence: ${params.evidence.length}`,
            `Unverified: ${params.unverified.length ? params.unverified.join("; ") : "none"}`,
            "In the next tool-free turn, write a concise final user-facing summary with: Result, Achieved, Key findings or lessons, Verification, and Remaining/unverified. Do not call tools or repeat the raw gate payload.",
          ].join("\n"),
        }],
        details: { accepted: true, attempt, completion },
      };
    },

    renderCall(args, theme) {
      return new Text(
        `${theme.fg("toolTitle", theme.bold("itsol_complete "))}${theme.fg("accent", args.task_id)}${theme.fg("muted", ` · ${args.status} · ${args.achieved_stage}`)}`,
        0,
        0,
      );
    },

    renderResult(result, _options, theme) {
      const details = result.details as { accepted?: boolean; attempt?: number; problems?: string[] } | undefined;
      const content = result.content[0];
      const raw = content?.type === "text" ? content.text : "(no output)";
      if (details?.accepted) return new Text(theme.fg("success", `✓ ${raw}`), 0, 0);
      if (details?.problems) {
        return new Text(
          `${theme.fg("warning", `! Completion rejected · attempt ${details.attempt}`)}\n${theme.fg("muted", details.problems.map((problem) => `- ${problem}`).join("\n"))}`,
          0,
          0,
        );
      }
      return new Text(raw, 0, 0);
    },
  });
}
