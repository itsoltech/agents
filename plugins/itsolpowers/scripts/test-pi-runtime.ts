import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "../extensions/pi/agents.ts";
import { formatDuration, summarizeToolActivity } from "../extensions/pi/delegate-tool.ts";
import { validateDelegation, type ItsolDelegateParams } from "../extensions/pi/policy.ts";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default function testPiRuntime(_pi: ExtensionAPI): void {
  assert.equal(formatDuration(5_900), "5s");
  assert.equal(formatDuration(126_000), "2min 6s");
  assert.equal(formatDuration(3_720_000), "1h 2min");
  assert.equal(summarizeToolActivity("read", { path: "README.md" }, pluginRoot), "reading README.md");
  assert.equal(
    summarizeToolActivity("bash", { command: "npm test\necho done" }, pluginRoot),
    "running: npm test",
  );

  const agents = discoverItsolAgents(path.join(pluginRoot, "agents"));
  assert.equal(agents.length, 113);
  const byName = new Map(agents.map((agent) => [agent.name, agent]));

  const base: ItsolDelegateParams = {
    task_id: "fixture",
    workflow_state: {
      workflow_mode: "direct",
      mode_source: "explicit-user-task-instruction",
      decision_authority: "delegated",
      scope: "current-task",
      artifact_state: "not-required",
      execution_mode: "subagents",
      protected_constraints: [],
    },
    execution_policy: {
      preset: "standard",
      policy_sources: { base: "agent-default", constraints: [] },
      model_profile: "balanced",
      model_control: "advisory",
      reasoning_profile: "medium",
      reasoning_control: "enforced",
      max_subagents: 2,
      max_parallel: 2,
      max_review_rounds: 1,
      stop_after: "implementation-reviewed",
      budget_escalation: "ask",
    },
    done_when: ["fixture passes"],
  };

  const writer = {
    agent: "itsol-feature-implementation",
    task: "Implement fixture",
    read_scope: ["src"],
    write_scope: ["src/feature"],
    forbidden_scope: ["src/security"],
    required_evidence: ["tests pass"],
    stop_after: "implementation",
  } as const;
  validateDelegation(base, [writer], byName, new Set());

  assert.throws(
    () => validateDelegation({
      ...base,
      workflow_state: { ...base.workflow_state, artifact_state: "draft" },
    }, [writer], byName, new Set()),
    /not authorized/,
  );
  assert.throws(
    () => validateDelegation({
      ...base,
      execution_policy: { ...base.execution_policy, model_control: "enforced" },
    }, [writer], byName, new Set()),
    /model mapping/,
  );

  const reviewer = {
    agent: "security-api-input-review",
    task: "Review fixture",
    read_scope: ["src"],
    write_scope: [],
    forbidden_scope: [],
    required_evidence: ["file references"],
    stop_after: "analysis",
  } as const;
  validateDelegation({
    ...base,
    workflow_state: {
      ...base.workflow_state,
      workflow_mode: "governed",
      decision_authority: "user",
      artifact_state: "draft",
    },
  }, [reviewer], byName, new Set());

  assert.throws(
    () => validateDelegation(base, [writer, { ...writer, agent: "itsol-bug-debugging" }], byName, new Set()),
    /overlapping write scopes/,
  );
  assert.throws(
    () => validateDelegation({
      ...base,
      execution_policy: { ...base.execution_policy, max_parallel: 1 },
    }, [writer, reviewer], byName, new Set()),
    /max_parallel/,
  );
}
