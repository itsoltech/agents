import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "../extensions/pi/agents.ts";
import { evaluateCompletion, registerCompletionGate } from "../extensions/pi/completion-gate.ts";
import { formatDuration, summarizeToolActivity } from "../extensions/pi/delegate-tool.ts";
import { classifyAgentRole, ModelRouter, supportedThinkingLevels } from "../extensions/pi/model-router.ts";
import { validateDelegation, type ItsolDelegateParams } from "../extensions/pi/policy.ts";
import { RepoPolicyManager } from "../extensions/pi/repo-policy.ts";
import { applyPreset, TaskStateStore } from "../extensions/pi/task-state.ts";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default async function testPiRuntime(_pi: ExtensionAPI): Promise<void> {
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
  assert.equal(classifyAgentRole(byName.get("itsol-feature-implementation")!), "implement");
  assert.equal(classifyAgentRole(byName.get("security-api-input-review")!), "review");
  assert.deepEqual(supportedThinkingLevels({
    reasoning: true,
    thinkingLevelMap: { xhigh: "xhigh", max: null },
  } as any), ["off", "minimal", "low", "medium", "high", "xhigh"]);

  const configCwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsol-pi-models-"));
  try {
    const projectConfigPath = path.join(configCwd, ".pi", "itsolpowers.json");
    const selections = [
      `Project · ${projectConfigPath}`,
      "balanced",
      "explore",
      "Choose available model",
      "test-provider",
      "cheap — Cheap Model",
      "low",
      "Configure another role",
      "review",
      "Choose available model",
      "test-provider",
      "strong — Strong Model",
      "medium",
      "Save and finish",
    ];
    const router = new ModelRouter();
    const configContext = {
      cwd: configCwd,
      hasUI: true,
      isProjectTrusted: () => true,
      modelRegistry: {
        getAvailable: () => [
          {
            provider: "test-provider",
            id: "cheap",
            name: "Cheap Model",
            reasoning: true,
            thinkingLevelMap: { xhigh: null, max: null },
          },
          {
            provider: "test-provider",
            id: "strong",
            name: "Strong Model",
            reasoning: true,
            thinkingLevelMap: { xhigh: "xhigh", max: "max" },
          },
        ],
        find: (provider: string, id: string) => provider === "test-provider" && ["cheap", "strong"].includes(id) ? {} : undefined,
      },
      ui: {
        select: async (title: string, options: string[]) => {
          if (title.includes("balanced.review reasoning")) {
            assert.ok(options.includes("xhigh"));
            assert.ok(options.includes("max"));
          }
          const selected = selections.shift();
          assert.ok(selected && options.includes(selected), `missing wizard option: ${selected}`);
          return selected;
        },
        confirm: async () => true,
        notify: () => {},
      },
    } as any;
    router.startSession(configContext);
    assert.equal(await router.configureInteractive(configContext), true);
    const saved = JSON.parse(await fs.promises.readFile(projectConfigPath, "utf8"));
    assert.deepEqual(saved.modelProfiles.balanced.explore, {
      model: "test-provider/cheap",
      thinking: "low",
    });
    assert.deepEqual(saved.modelProfiles.balanced.review, {
      model: "test-provider/strong",
      thinking: "medium",
    });
    assert.match(router.formatSummary(), /explore=test-provider\/cheap@low/);
    assert.match(router.formatSummary(), /review=test-provider\/strong@medium/);
    const routed = router.resolve({
      agent: "itsol-repo-memory",
      role: "explore",
      task: "Explore",
      read_scope: ["."],
      write_scope: [],
      forbidden_scope: [],
      required_evidence: ["summary"],
    }, byName.get("itsol-repo-memory")!, {
      model_profile: "balanced",
      reasoning_profile: "medium",
    } as any, undefined, configContext);
    assert.equal(routed.model, "test-provider/cheap");
    assert.equal(routed.thinking, "low");
    assert.equal(routed.thinkingSource, "profile");
    const clamped = router.resolve({
      agent: "security-api-input-review",
      role: "review",
      task: "Review",
      read_scope: ["."],
      write_scope: [],
      forbidden_scope: [],
      required_evidence: ["findings"],
    }, byName.get("security-api-input-review")!, {
      model_profile: "balanced",
      reasoning_profile: "low",
    } as any, undefined, configContext);
    assert.equal(clamped.thinking, "low");
    assert.equal(clamped.thinkingSource, "policy-clamp");
  } finally {
    await fs.promises.rm(configCwd, { recursive: true, force: true });
  }

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

  const policyCwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsol-pi-policy-"));
  try {
    await fs.promises.mkdir(path.join(policyCwd, ".git"));
    await fs.promises.writeFile(path.join(policyCwd, ".itsol.md"), `# ITSOL Repository Notes

## Workflow

\`\`\`yaml
workflow:
  default_mode: direct
  allowed_modes: [governed, autonomous-planned, direct]
  restrictions:
    - match:
        path: infra/production
      allowed_modes: [governed]
\`\`\`

## Execution

\`\`\`yaml
execution:
  default_preset: standard
  restrictions:
    - match:
        path: infra/production
      max_subagents: 1
      max_parallel: 1
      stop_after: technical-plan
\`\`\`

## Monorepo Map

| Path | Type | Stack | TDD mode | Verification |
|---|---|---|---|---|
| \`apps/web\` | frontend | SvelteKit | limited | typecheck, build |

## Verification Commands

- Test: npm test
`);
    const repoPolicy = new RepoPolicyManager();
    repoPolicy.startSession({ cwd: policyCwd } as any);
    assert.match(repoPolicy.formatStatus(), /Workflow default: direct/);
    assert.match(repoPolicy.formatPromptContext(), /apps\/web/);
    assert.throws(() => repoPolicy.validateDefinition({
      ...base,
      workflow_state: { ...base.workflow_state, workflow_mode: "direct" },
      policy_context: { paths: ["infra/production/app.hcl"], operations: [] },
    }), /allowed modes: governed/);
    assert.throws(() => repoPolicy.validateDefinition({
      ...base,
      workflow_state: { ...base.workflow_state, workflow_mode: "governed" },
      policy_context: { paths: ["infra/production/app.hcl"], operations: [] },
    }), /max_subagents to 1/);
    repoPolicy.validateDefinition({
      ...base,
      workflow_state: { ...base.workflow_state, workflow_mode: "governed" },
      execution_policy: {
        ...base.execution_policy,
        max_subagents: 1,
        max_parallel: 1,
        stop_after: "technical-plan",
      },
      policy_context: { paths: ["infra/production/app.hcl"], operations: [] },
    });
  } finally {
    await fs.promises.rm(policyCwd, { recursive: true, force: true });
  }

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
    /profile mapping/,
  );

  const persistedEntries: Array<{ customType: string; data: unknown }> = [];
  const fakePi = {
    appendEntry(customType: string, data: unknown) {
      persistedEntries.push({ customType, data });
    },
  } as unknown as ExtensionAPI;
  const fakeContext = {
    hasUI: false,
    sessionManager: { getBranch: () => [] },
  } as any;
  const store = new TaskStateStore(fakePi, agents.length, "0.19.0");
  store.startSession(fakeContext);
  assert.match(store.formatStatus(), /ITSOL Powers v0\.19\.0/);
  store.setDefinition(base);
  assert.match(store.formatStatus(), /ITSOL v0\.19\.0/);
  const reused = store.resolveDelegation({ task_id: base.task_id, task: writer });
  assert.equal(reused.execution_policy.preset, "standard");
  store.beginDelegation(base.task_id, [writer.agent]);
  store.finishDelegation(base.task_id, [writer.agent], [{
    agent: writer.agent,
    status: "completed",
    usage: { input: 100, output: 20, cost: 0.01 },
  }]);
  assert.equal(store.getActive()?.child_cost, 0.01);
  assert.equal(store.getActive()?.used_agents[0], writer.agent);
  const completionRequest = {
    task_id: base.task_id,
    status: "completed" as const,
    achieved_stage: "implementation-reviewed" as const,
    evidence: [{ criterion: "fixture passes", evidence: "npm test: PASS" }],
    review_evidence: ["inline self-review completed"],
    unverified: [],
  };
  assert.equal(evaluateCompletion(store.getActive()!, completionRequest).accepted, true);
  assert.match(
    evaluateCompletion(store.getActive()!, { ...completionRequest, review_evidence: [] }).problems.join("\n"),
    /implementation review/,
  );
  assert.equal(evaluateCompletion(store.getActive()!, {
    ...completionRequest,
    status: "partial",
    evidence: [],
    review_evidence: [],
    unverified: ["integration unavailable"],
  }).accepted, true);
  let completionTool: any;
  let settledHandler: (() => void) | undefined;
  let activeTools = ["read", "itsol_complete"];
  const completionPi = {
    registerTool(tool: unknown) { completionTool = tool; },
    on(event: string, handler: () => void) {
      if (event === "agent_settled") settledHandler = handler;
    },
    getActiveTools: () => [...activeTools],
    setActiveTools: (tools: string[]) => { activeTools = [...tools]; },
  } as unknown as ExtensionAPI;
  registerCompletionGate(completionPi, store);
  const gateResult = await completionTool.execute("gate", completionRequest);
  assert.equal(gateResult.terminate, undefined);
  assert.deepEqual(activeTools, []);
  assert.match(gateResult.content[0].text, /tool-free turn/);
  settledHandler?.();
  assert.deepEqual(activeTools.sort(), ["itsol_complete", "read"]);
  assert.match(store.formatStatus(), /completed/);
  assert.ok(persistedEntries.length >= 3);
  const persisted = persistedEntries.at(-1)!;
  const restoredStore = new TaskStateStore(fakePi, agents.length, "0.19.0");
  restoredStore.startSession({
    hasUI: false,
    sessionManager: {
      getBranch: () => [{ type: "custom", customType: persisted.customType, data: persisted.data }],
    },
  } as any);
  assert.equal(restoredStore.getActive()?.task_id, base.task_id);
  assert.deepEqual(restoredStore.getActive()?.active_agents, []);
  assert.equal(restoredStore.getActive()?.child_cost, 0.01);

  const economy = applyPreset(base.execution_policy, "economy");
  assert.equal(economy.model_profile, "economy");
  assert.equal(economy.max_subagents, 0);
  const deep = applyPreset(base.execution_policy, "deep");
  assert.equal(deep.model_profile, "frontier");
  assert.equal(deep.max_review_rounds, 2);

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
