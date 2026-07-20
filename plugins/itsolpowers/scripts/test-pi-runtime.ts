// Runtime fixtures for extension consumers of itsol-workflow-mode and itsol-execution-policy.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "../extensions/pi/agents.ts";
import { evaluateCompletion, registerCompletionGate } from "../extensions/pi/completion-gate.ts";
import { formatDuration, registerItsolDelegate, summarizeToolActivity, type DelegationResult } from "../extensions/pi/delegate-tool.ts";
import { renderDelegationWidgetLines, sanitizeTerminalText } from "../extensions/pi/delegation-widget.ts";
import { canonicalizeWriteScope, createDelegationCoordinator, writeScopesConflict } from "../extensions/pi/delegation-runtime.ts";
import { InitiativeManager } from "../extensions/pi/initiative-state.ts";
import { classifyAgentRole, ModelRouter, supportedThinkingLevels } from "../extensions/pi/model-router.ts";
import { validateDelegation, type ItsolDelegateParams } from "../extensions/pi/policy.ts";
import { RepoPolicyManager } from "../extensions/pi/repo-policy.ts";
import { initiativeReviewers, parsePlanReviewVerdict, PlanReviewOrchestrator } from "../extensions/pi/plan-review.ts";
import { QaOrchestrator } from "../extensions/pi/qa-orchestrator.ts";
import { currentWorktreeFingerprint, ReviewOrchestrator } from "../extensions/pi/review-orchestrator.ts";
import { applyPreset, classifyAdministrativeRequest, TaskStateStore } from "../extensions/pi/task-state.ts";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function runPiRuntimeFixtures(_pi: ExtensionAPI): Promise<void> {
  assert.equal(classifyAdministrativeRequest("commit"), "commit");
  assert.equal(classifyAdministrativeRequest("Please commit the verified changes with message feat(app): finish flow"), "commit");
  assert.equal(classifyAdministrativeRequest("zacommituj obecny zakres"), "commit");
  assert.equal(classifyAdministrativeRequest("git status"), "inspect");
  assert.equal(classifyAdministrativeRequest("show diff"), "inspect");
  assert.equal(classifyAdministrativeRequest("Initialize or improve the root .itsol.md through the ITSOL repo-memory workflow"), "policy-init");
  assert.equal(classifyAdministrativeRequest("commit and push"), undefined);
  assert.equal(classifyAdministrativeRequest("commit and then fix the failing endpoint"), undefined);
  assert.equal(classifyAdministrativeRequest("implement commit handling"), undefined);
  assert.deepEqual(initiativeReviewers("Account permissions, PostgreSQL migration, and QA rollout"), [
    "itsol-requirements-review",
    "itsol-technical-planning",
    "itsol-qa-handoff",
    "itsol-self-review",
    "security-api-input-review",
    "postgres-review",
  ]);
  assert.equal(parsePlanReviewVerdict("Rubber Duck Verdict: Ready", "ready for approval"), "ready for approval");
  assert.equal(parsePlanReviewVerdict("**Verdict:** changes required", "ready for execution"), "not ready for execution");
  assert.equal(parsePlanReviewVerdict("Plan Review Verdict: ready for execution", "ready for execution"), "ready for execution");
  assert.equal(formatDuration(5_900), "5s");
  assert.equal(formatDuration(126_000), "2min 6s");
  assert.equal(formatDuration(3_720_000), "1h 2min");
  assert.equal(summarizeToolActivity("read", { path: "README.md" }, pluginRoot), "reading README.md");
  assert.equal(sanitizeTerminalText("safe\u001b]8;;https://evil.invalid\u0007link\u001b]8;;\u0007\nnext", false), "safelink next");
  const widgetLines = renderDelegationWidgetLines([
    {
      id: "delegation-1:analysis",
      taskId: "fixture",
      delegationId: "delegation-1",
      agent: "itsol-repo-memory",
      workItemId: "analysis",
      description: "Inspect repository structure",
      status: "running",
      activity: "reading README.md",
      queuedAt: 1_000,
      startedAt: 2_000,
      model: "provider/model",
      modelSource: "profile:explore",
      thinking: "medium",
      thinkingSource: "profile",
    },
  ], 60, {
    now: 7_000,
    frame: 0,
    maxLines: 12,
    theme: { fg: (_color: string, text: string) => text, bold: (text: string) => text },
  });
  assert.ok(widgetLines.some((line) => line.includes("itsol-repo-memory [analysis]")));
  assert.ok(widgetLines.some((line) => line.includes("reading README.md")));
  assert.ok(widgetLines.every((line) => line.replace(/\u001b\[[0-9;]*m/g, "").length <= 60));
  const canonicalRoot = canonicalizeWriteScope(pluginRoot, ".");
  const canonicalDelegate = canonicalizeWriteScope(pluginRoot, "plugins/itsolpowers/extensions/pi");
  assert.equal(writeScopesConflict(canonicalRoot, canonicalDelegate), true);

  const runnerResolvers = new Map<string, (result: { status: string; output: string }) => void>();
  const runnerStarts: string[] = [];
  const coordinator = createDelegationCoordinator<{ label: string }, { status: string; output: string }>({
    runner: ({ workItemId }) => {
      runnerStarts.push(workItemId);
      return new Promise((resolve) => runnerResolvers.set(workItemId, resolve));
    },
  });
  const acknowledgement = coordinator.admit({
    taskId: "async-fixture",
    maxParallel: 1,
    runInBackground: true,
    delegationId: "delegation-fixture",
    items: [
      { agent: "itsol-repo-memory", workItemId: "one", description: "First", packet: { label: "one" }, cwd: pluginRoot },
      { agent: "itsol-repo-memory", workItemId: "two", description: "Second", packet: { label: "two" }, cwd: pluginRoot },
    ],
  });
  assert.equal(acknowledgement instanceof Promise, false);
  await Promise.resolve();
  assert.deepEqual(runnerStarts, ["one"]);
  assert.equal(coordinator.getGroup("delegation-fixture")?.records[1]?.status, "queued");
  runnerResolvers.get("one")?.({ status: "completed", output: "one done" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(runnerStarts, ["one", "two"]);
  runnerResolvers.get("two")?.({ status: "completed", output: "two done" });
  const completedCoordinatorGroup = await coordinator.waitForGroup("delegation-fixture");
  assert.equal(completedCoordinatorGroup.status, "terminal");
  assert.deepEqual(completedCoordinatorGroup.records.map((record) => record.status), ["completed", "completed"]);
  assert.equal(coordinator.releaseGroup("delegation-fixture"), true);

  const heldCoordinator = createDelegationCoordinator<{ label: string }, { status: string; output: string }>({
    maxOutstandingRecords: 1,
    shutdownTimeoutMs: 1,
    runner: () => new Promise(() => {}),
  });
  heldCoordinator.admit({
    taskId: "held",
    maxParallel: 1,
    items: [{ agent: "itsol-feature-implementation", workItemId: "writer", description: "Writer", packet: { label: "writer" }, cwd: pluginRoot, writeScopes: ["plugins/itsolpowers/extensions/pi"] }],
  });
  assert.throws(() => heldCoordinator.admit({
    taskId: "held",
    maxParallel: 1,
    items: [{ agent: "itsol-feature-implementation", workItemId: "other", description: "Other", packet: { label: "other" }, cwd: pluginRoot, writeScopes: ["plugins/itsolpowers/extensions/pi/delegate-tool.ts"] }],
  }), /backpressure|Write scope conflict/);
  await heldCoordinator.shutdown();

  const preAborted = new AbortController();
  preAborted.abort("already cancelled");
  const preAbortedStarts: string[] = [];
  const preAbortedCoordinator = createDelegationCoordinator<{ label: string }, { status: string; output: string }>({
    runner: async ({ workItemId }) => {
      preAbortedStarts.push(workItemId);
      return { status: "completed", output: workItemId };
    },
  });
  const preAbortedResult = await preAbortedCoordinator.admit({
    taskId: "pre-aborted",
    maxParallel: 2,
    runInBackground: false,
    signal: preAborted.signal,
    items: [
      { agent: "itsol-feature-implementation", workItemId: "a", description: "A", packet: { label: "a" }, cwd: pluginRoot },
      { agent: "itsol-feature-implementation", workItemId: "b", description: "B", packet: { label: "b" }, cwd: pluginRoot },
    ],
  });
  assert.deepEqual(preAbortedStarts, []);
  assert.deepEqual(preAbortedResult.records.map((record) => record.status), ["failed", "failed"]);

  const hookErrors: string[] = [];
  let recordChangeCalls = 0;
  const faultTolerantCoordinator = createDelegationCoordinator<{ label: string }, { status: string; output: string }>({
    runner: async ({ workItemId }) => ({ status: "completed", output: workItemId }),
    hooks: {
      onRecordChange() {
        recordChangeCalls++;
        if (recordChangeCalls === 1) throw new Error("widget failed");
      },
      async onRecordTerminal() { throw new Error("record accounting failed"); },
      async onGroupTerminal() { throw new Error("delivery hook failed"); },
      onHookError(error, phase) { hookErrors.push(`${phase}:${error instanceof Error ? error.message : String(error)}`); },
    },
  });
  const faultTolerantResult = await faultTolerantCoordinator.admit({
    taskId: "fault-tolerant",
    maxParallel: 1,
    runInBackground: false,
    items: [
      { agent: "itsol-feature-implementation", workItemId: "one", description: "One", packet: { label: "one" }, cwd: pluginRoot },
      { agent: "itsol-feature-implementation", workItemId: "two", description: "Two", packet: { label: "two" }, cwd: pluginRoot },
    ],
  });
  assert.deepEqual(faultTolerantResult.records.map((record) => record.status), ["completed", "completed"]);
  assert.ok(hookErrors.some((error) => error.startsWith("record-change:")));
  assert.ok(hookErrors.some((error) => error.startsWith("record-terminal:")));
  assert.ok(hookErrors.some((error) => error.startsWith("group-terminal:")));

  let resolveLingeringRunner: (() => void) | undefined;
  const lingeringCoordinator = createDelegationCoordinator<{ label: string }, { status: string; output: string }>({
    shutdownTimeoutMs: 1,
    runner: () => new Promise((resolve) => { resolveLingeringRunner = () => resolve({ status: "completed", output: "late" }); }),
  });
  lingeringCoordinator.admit({
    taskId: "lingering",
    maxParallel: 1,
    items: [{ agent: "itsol-feature-implementation", workItemId: "old", description: "Old", packet: { label: "old" }, cwd: pluginRoot, writeScopes: ["plugins/itsolpowers/extensions/pi"] }],
  });
  await Promise.resolve();
  await lingeringCoordinator.shutdown();
  assert.equal(lingeringCoordinator.lingeringRunnerCount, 1);
  assert.equal(lingeringCoordinator.activeWriteScopes().length, 1);
  lingeringCoordinator.startSession();
  assert.throws(() => lingeringCoordinator.admit({
    taskId: "new-session",
    maxParallel: 1,
    items: [{ agent: "itsol-feature-implementation", workItemId: "new", description: "New", packet: { label: "new" }, cwd: pluginRoot, writeScopes: ["plugins/itsolpowers/extensions/pi/delegate-tool.ts"] }],
  }), /Write scope conflict/);
  resolveLingeringRunner?.();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(lingeringCoordinator.lingeringRunnerCount, 0);
  assert.equal(lingeringCoordinator.activeWriteScopes().length, 0);

  let reusedStarts = 0;
  let resolveOldReuse: (() => void) | undefined;
  let resolveNewReuse: (() => void) | undefined;
  const reusedIdCoordinator = createDelegationCoordinator<{ label: string }, { status: string; output: string }>({
    shutdownTimeoutMs: 1,
    runner: () => new Promise((resolve) => {
      reusedStarts++;
      const finish = () => resolve({ status: "completed", output: `run-${reusedStarts}` });
      if (reusedStarts === 1) resolveOldReuse = finish;
      else resolveNewReuse = finish;
    }),
  });
  reusedIdCoordinator.admit({
    taskId: "reuse-old",
    delegationId: "reused-delegation",
    maxParallel: 1,
    items: [{ agent: "itsol-feature-implementation", workItemId: "same", description: "Old read", packet: { label: "old" }, cwd: pluginRoot }],
  });
  await Promise.resolve();
  await reusedIdCoordinator.shutdown();
  reusedIdCoordinator.startSession();
  reusedIdCoordinator.admit({
    taskId: "reuse-new",
    delegationId: "reused-delegation",
    maxParallel: 1,
    items: [{ agent: "itsol-feature-implementation", workItemId: "same", description: "New write", packet: { label: "new" }, cwd: pluginRoot, writeScopes: ["plugins/itsolpowers/extensions/pi"] }],
  });
  await Promise.resolve();
  resolveOldReuse?.();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await reusedIdCoordinator.shutdown();
  assert.equal(reusedIdCoordinator.lingeringRunnerCount, 1);
  assert.equal(reusedIdCoordinator.activeWriteScopes().length, 1);
  resolveNewReuse?.();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(reusedIdCoordinator.lingeringRunnerCount, 0);

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
        find: (provider: string, id: string) => provider === "test-provider" && ["cheap", "strong"].includes(id) ? {
          provider,
          id,
          name: id,
          reasoning: true,
          thinkingLevelMap: id === "strong" ? { xhigh: "xhigh", max: "max" } : { xhigh: null, max: null },
        } : undefined,
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
    saved.modelProfiles.balanced.review.thinking = "xhigh";
    await fs.promises.writeFile(projectConfigPath, `${JSON.stringify(saved, null, 2)}\n`);
    router.reload(configContext);
    const advisoryReasoning = router.resolve({
      agent: "security-api-input-review",
      role: "review",
      task: "Review with configured reasoning",
      read_scope: ["."],
      write_scope: [],
      forbidden_scope: [],
      required_evidence: ["findings"],
    }, byName.get("security-api-input-review")!, {
      model_profile: "balanced",
      reasoning_profile: "low",
      reasoning_control: "advisory",
    } as any, undefined, configContext);
    assert.equal(advisoryReasoning.thinking, "xhigh");
    assert.equal(advisoryReasoning.thinkingSource, "profile");
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
      reasoning_control: "enforced",
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
      reasoning_control: "advisory",
      max_subagents: 2,
      max_parallel: 2,
      max_review_rounds: 1,
      stop_after: "implementation-reviewed",
      budget_escalation: "ask",
    },
    done_when: ["fixture passes"],
  };

  const asyncBranch: any[] = [];
  const asyncTools = new Map<string, any>();
  const asyncHandlers = new Map<string, Array<(event: any, ctx: any) => unknown>>();
  const asyncMessages: Array<{ message: any; options: any }> = [];
  let resolveAsyncChild: ((result: DelegationResult) => void) | undefined;
  const asyncPi = {
    registerTool(tool: any) { asyncTools.set(tool.name, tool); },
    registerMessageRenderer() {},
    on(event: string, handler: (event: any, ctx: any) => unknown) {
      asyncHandlers.set(event, [...(asyncHandlers.get(event) ?? []), handler]);
    },
    appendEntry(customType: string, data: unknown) { asyncBranch.push({ type: "custom", customType, data }); },
    sendMessage(message: any, options: any) {
      asyncMessages.push({ message, options });
      asyncBranch.push({ type: "custom_message", customType: message.customType, content: message.content, details: message.details });
    },
  } as unknown as ExtensionAPI;
  const asyncContext = {
    cwd: pluginRoot,
    hasUI: false,
    model: undefined,
    sessionManager: { getBranch: () => asyncBranch },
    ui: { setWidget() {}, notify() {} },
  } as any;
  const asyncStore = new TaskStateStore(asyncPi, "fixture");
  asyncStore.startSession(asyncContext);
  asyncStore.setDefinition(base);
  const asyncRepoPolicy = new RepoPolicyManager(pluginRoot);
  asyncRepoPolicy.startSession(asyncContext);
  const asyncController = registerItsolDelegate(
    asyncPi,
    pluginRoot,
    agents,
    asyncStore,
    { resolve: () => ({ model: undefined, source: "inherited", role: "explore", thinking: "medium", thinkingSource: "policy", profileEnforced: true }) } as any,
    asyncRepoPolicy,
    { runner: (async () => await new Promise<DelegationResult>((resolve) => { resolveAsyncChild = resolve; })) as any },
  );
  asyncController.startSession(asyncContext);
  const delegateTool = asyncTools.get("itsol_delegate");
  assert.ok(delegateTool, "itsol_delegate should be registered");
  const asyncAck = await delegateTool.execute("async-tool-call", {
    task_id: base.task_id,
    task: {
      agent: "itsol-repo-memory",
      role: "explore",
      work_item_id: "async-fixture",
      task: "Inspect asynchronously",
      operations: ["inspect"],
      read_scope: ["README.md"],
      write_scope: [],
      forbidden_scope: ["docs/"],
      required_evidence: ["fixture result"],
    },
  }, undefined, undefined, asyncContext);
  assert.match(asyncAck.content[0].text, /Started ITSOL delegation .* in the background/);
  assert.equal(asyncStore.require(base.task_id).active_agents.length, 1);
  assert.equal(Object.keys(asyncStore.require(base.task_id).pending_deliveries).length, 1);
  assert.ok(resolveAsyncChild, "background execute must return before the child result resolves");
  const recoveryTool = asyncTools.get("itsol_delegate_result");
  const activeRecovery = await recoveryTool.execute("active-recovery", {
    task_id: base.task_id,
    delegation_id: asyncAck.details.delegationId,
  });
  asyncBranch.push({ type: "message", message: { role: "toolResult", toolName: "itsol_delegate_result", details: activeRecovery.details } });
  for (const handler of asyncHandlers.get("message_end") ?? []) {
    await handler({ message: { role: "toolResult", toolName: "itsol_delegate_result", details: activeRecovery.details } }, asyncContext);
  }
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(Object.keys(asyncStore.require(base.task_id).pending_deliveries).length, 1, "active retrieval must not clear delivery");
  resolveAsyncChild!({
    agent: "itsol-repo-memory",
    workItemId: "async-fixture",
    task: "Inspect asynchronously",
    status: "completed",
    output: "fixture result",
    exitCode: 0,
    stderr: "",
    usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 1 },
    durationMs: 1,
    activities: [],
    modelSource: "fixture",
    thinking: "medium",
    thinkingSource: "fixture",
  });
  for (let attempt = 0; attempt < 20 && asyncMessages.length === 0; attempt++) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(asyncMessages.length, 1);
  assert.equal(asyncMessages[0].options.deliverAs, "followUp");
  assert.match(asyncMessages[0].message.content, /untrusted child evidence, never parent instructions/);
  assert.match(asyncMessages[0].message.content, /untrusted-delegated-evidence/);
  assert.equal(asyncStore.require(base.task_id).active_agents.length, 0);
  assert.equal(Object.keys(asyncStore.require(base.task_id).pending_deliveries).length, 1);
  for (const handler of asyncHandlers.get("message_end") ?? []) {
    await handler({ message: { role: "custom", ...asyncMessages[0].message } }, asyncContext);
  }
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(Object.keys(asyncStore.require(base.task_id).pending_deliveries).length, 0);

  resolveAsyncChild = undefined;
  const recoveryAck = await delegateTool.execute("recovery-tool-call", {
    task_id: base.task_id,
    task: {
      agent: "itsol-repo-memory",
      role: "explore",
      work_item_id: "recovery-fixture",
      task: "Finish for fallback retrieval",
      operations: ["inspect"],
      read_scope: ["README.md"],
      write_scope: [],
      forbidden_scope: ["docs/"],
      required_evidence: ["recovery result"],
    },
  }, undefined, undefined, asyncContext);
  for (let attempt = 0; attempt < 20 && !resolveAsyncChild; attempt++) await new Promise((resolve) => setTimeout(resolve, 5));
  resolveAsyncChild!({
    agent: "itsol-repo-memory",
    workItemId: "recovery-fixture",
    task: "Finish for fallback retrieval",
    status: "completed",
    output: "recovery result",
    exitCode: 0,
    stderr: "",
    usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 1 },
    durationMs: 1,
    activities: [],
    modelSource: "fixture",
    thinking: "medium",
    thinkingSource: "fixture",
  });
  for (let attempt = 0; attempt < 20 && asyncMessages.length < 2; attempt++) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(Object.keys(asyncStore.require(base.task_id).pending_deliveries).length, 1);
  const recovered = await recoveryTool.execute("terminal-recovery", {
    task_id: base.task_id,
    delegation_id: recoveryAck.details.delegationId,
  });
  assert.ok(recovered.details.retrievalToken);
  asyncBranch.push({ type: "message", message: { role: "toolResult", toolName: "itsol_delegate_result", details: recovered.details } });
  for (const handler of asyncHandlers.get("message_end") ?? []) {
    await handler({ message: { role: "toolResult", toolName: "itsol_delegate_result", details: recovered.details } }, asyncContext);
  }
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(Object.keys(asyncStore.require(base.task_id).pending_deliveries).length, 0);

  resolveAsyncChild = undefined;
  const foregroundResult = delegateTool.execute("foreground-tool-call", {
    task_id: base.task_id,
    run_in_background: false,
    task: {
      agent: "itsol-repo-memory",
      role: "explore",
      work_item_id: "foreground-fixture",
      task: "Inspect in foreground",
      operations: ["inspect"],
      read_scope: ["README.md"],
      write_scope: [],
      forbidden_scope: ["docs/"],
      required_evidence: ["foreground result"],
    },
  }, undefined, undefined, asyncContext);
  for (let attempt = 0; attempt < 20 && !resolveAsyncChild; attempt++) await new Promise((resolve) => setTimeout(resolve, 5));
  assert.ok(resolveAsyncChild, "foreground execute should wait for its child result");
  assert.equal(Object.keys(asyncStore.require(base.task_id).pending_deliveries).length, 0);
  resolveAsyncChild!({
    agent: "itsol-repo-memory",
    workItemId: "foreground-fixture",
    task: "Inspect in foreground",
    status: "completed",
    output: "foreground result",
    exitCode: 0,
    stderr: "",
    usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 1 },
    durationMs: 1,
    activities: [],
    modelSource: "fixture",
    thinking: "medium",
    thinkingSource: "fixture",
  });
  const foregroundReport = await foregroundResult;
  assert.match(foregroundReport.content[0].text, /foreground result/);
  assert.equal(asyncStore.require(base.task_id).active_agents.length, 0);
  await asyncController.shutdown();

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
    - match:
        path: cost-sensitive
      reasoning_profile: medium
      reasoning_control: enforced
\`\`\`

## Review

\`\`\`yaml
review:
  default_profile: poc
  trigger: final
  delegation: never
  auto_rereview: never
  max_rounds: 1
  plan_max_rounds: 10
  allowed_profiles: [off, poc, balanced, strict]
  restrictions:
    - match:
        path: infra/production
      profile: strict
      allowed_profiles: [balanced, strict]
      delegation: risk-based
      auto_rereview: until-approved
      max_rounds: 2
      plan_max_rounds: 6
\`\`\`

## QA

\`\`\`yaml
qa:
  profile: automatic
  max_cycles: 8
  application_types: [web-ui, api]
  commands: [npm run test:integration]
  targets: [http://localhost:3000]
  restrictions:
    - match:
        path: legacy/hard-to-run
      profile: off
\`\`\`

## Monorepo Map

| Path | Type | Stack | TDD mode | Verification |
|---|---|---|---|---|
| \`apps/web\` | frontend | SvelteKit | limited | typecheck, build |

## Verification Commands

- Test: npm test
`);
    await fs.promises.mkdir(path.join(policyCwd, "apps", "web"), { recursive: true });
    await fs.promises.writeFile(path.join(policyCwd, "apps", "web", ".itsol.md"), `# Web policy

\`\`\`yaml
review:
  default_profile: strict
  delegation: risk-based
\`\`\`
`);
    const repoPolicy = new RepoPolicyManager();
    repoPolicy.startSession({ cwd: policyCwd } as any);
    assert.match(repoPolicy.formatStatus(), /Workflow default: direct/);
    assert.match(repoPolicy.formatPromptContext(), /apps\/web/);
    assert.equal(repoPolicy.resolveReviewPolicy().profile, "poc");
    assert.equal(repoPolicy.resolveReviewPolicy().delegation, "never");
    assert.equal(repoPolicy.resolveReviewPolicy().plan_max_rounds, 10);
    assert.equal(repoPolicy.resolveReviewPolicy({ paths: ["apps/web/src/page.ts"] }).profile, "strict");
    const qaPolicy = repoPolicy.resolveQaPolicy({ paths: ["apps/web/src/page.ts"] });
    assert.equal(qaPolicy.profile, "automatic");
    assert.equal(qaPolicy.max_cycles, 8);
    assert.deepEqual(qaPolicy.application_types, ["web-ui", "api"]);
    assert.deepEqual(qaPolicy.commands, ["npm run test:integration"]);
    assert.equal(repoPolicy.resolveQaPolicy({ paths: ["legacy/hard-to-run/app.ts"] }).profile, "off");
    const productionReview = repoPolicy.resolveReviewPolicy({ paths: ["infra/production/app.hcl"] });
    assert.equal(productionReview.profile, "strict");
    assert.equal(productionReview.auto_rereview, "until-approved");
    assert.equal(productionReview.plan_max_rounds, 6);
    assert.throws(() => repoPolicy.resolveReviewPolicy({ paths: ["infra/production/app.hcl"] }, "poc"), /blocks review profile=poc/);
    assert.throws(() => repoPolicy.validateDefinition({
      ...base,
      policy_context: { paths: ["cost-sensitive/module.ts"], operations: [] },
    }), /requires reasoning_control=enforced/);
    repoPolicy.validateDefinition({
      ...base,
      execution_policy: { ...base.execution_policy, reasoning_profile: "medium", reasoning_control: "enforced" },
      policy_context: { paths: ["cost-sensitive/module.ts"], operations: [] },
    });
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
    assert.throws(() => repoPolicy.validateDefinition({
      ...base,
      workflow_state: { ...base.workflow_state, workflow_mode: "governed" },
      execution_policy: { ...base.execution_policy, max_subagents: "unlimited" },
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
    await fs.promises.writeFile(path.join(policyCwd, ".itsol.md"), "```yaml\nreview:\n  default_profile: turbo\n```\n");
    repoPolicy.reload();
    assert.throws(() => repoPolicy.resolveReviewPolicy(), /default_profile must be one of/);
  } finally {
    await fs.promises.rm(policyCwd, { recursive: true, force: true });
  }

  const initPolicyCwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsol-pi-init-policy-"));
  try {
    await fs.promises.mkdir(path.join(initPolicyCwd, ".git"));
    const initPolicy = new RepoPolicyManager();
    initPolicy.startSession({ cwd: initPolicyCwd } as any);
    const initialized = initPolicy.initializeMinimalPolicy();
    assert.equal(initialized.created, true);
    assert.match(await fs.promises.readFile(initialized.filePath, "utf8"), /qa:\n  profile: automatic/);
    assert.match(initPolicy.formatStatus(), /QA profile: automatic/);
    assert.equal(initPolicy.initializeMinimalPolicy().created, false);
  } finally {
    await fs.promises.rm(initPolicyCwd, { recursive: true, force: true });
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
  const store = new TaskStateStore(fakePi, agents.length, "0.22.0");
  store.startSession(fakeContext);
  assert.match(store.formatStatus(), /ITSOL Powers v0\.22\.0/);
  store.setDefinition(base);
  assert.match(store.formatStatus(), /ITSOL v0\.22\.0/);
  const reused = store.resolveDelegation({ task_id: base.task_id, task: writer });
  assert.equal(reused.execution_policy.preset, "standard");

  const deliveryStore = new TaskStateStore(fakePi, agents.length, "0.22.0");
  deliveryStore.startSession(fakeContext);
  deliveryStore.admitDelegation(base, [writer.agent], {
    delegation_id: "delivery-fixture",
    state: "pending",
    delivery_token: "token-fixture",
    work_items: [{ agent: writer.agent, work_item_id: "delivery-work" }],
  });
  assert.equal(deliveryStore.hasOutstandingObligations(base.task_id), true);
  assert.throws(() => deliveryStore.setPreset("deep"), /outstanding/);
  const pendingEvaluation = evaluateCompletion(deliveryStore.getActive()!, {
    task_id: base.task_id,
    status: "partial",
    achieved_stage: "implementation-reviewed",
    evidence: [],
    review_evidence: [],
    unverified: ["background result pending"],
  });
  assert.match(pendingEvaluation.problems.join("\n"), /active delegated agents|durably delivered/);
  deliveryStore.finishDelegation(base.task_id, [writer.agent], [{
    agent: writer.agent,
    workItemId: "delivery-work",
    status: "completed",
    usage: { input: 1, output: 1, cost: 0 },
  }]);
  assert.equal(deliveryStore.hasOutstandingObligations(base.task_id), true);
  deliveryStore.clearDelivery(base.task_id, "delivery-fixture");
  assert.equal(deliveryStore.hasOutstandingObligations(base.task_id), false);

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
  assert.equal(evaluateCompletion(store.getActive()!, { ...completionRequest, review_evidence: [] }, {
    managed: true,
    required: false,
    problems: [],
    profile: "off",
  }).accepted, true);
  assert.match(evaluateCompletion(store.getActive()!, completionRequest, {
    managed: true,
    required: true,
    problems: ["review profile requires itsol_review_verdict"],
    profile: "balanced",
  }).problems.join("\n"), /requires itsol_review_verdict/);
  assert.match(evaluateCompletion(store.getActive()!, {
    ...completionRequest,
    status: "partial",
    evidence: [],
    review_evidence: [],
    unverified: ["plan review pending"],
  }, {
    managed: true,
    required: false,
    problems: ["business plan requires automatic isolated Rubber Duck Review"],
    profile: "off",
    forceContinuation: true,
  }).problems.join("\n"), /continue the review loop/);
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
  const restoredStore = new TaskStateStore(fakePi, agents.length, "0.22.0");
  restoredStore.startSession({
    hasUI: false,
    sessionManager: {
      getBranch: () => [{ type: "custom", customType: persisted.customType, data: persisted.data }],
    },
  } as any);
  assert.equal(restoredStore.getActive()?.task_id, base.task_id);
  assert.deepEqual(restoredStore.getActive()?.active_agents, []);
  assert.equal(restoredStore.getActive()?.child_cost, 0.01);

  const initiativeCwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsol-pi-initiative-"));
  try {
    await fs.promises.writeFile(path.join(initiativeCwd, "business.md"), "Build the complete account module.\n");
    await _pi.exec("git", ["init"], { cwd: initiativeCwd });
    await _pi.exec("git", ["add", "business.md"], { cwd: initiativeCwd });
    await _pi.exec("git", ["-c", "user.name=ITSOL Test", "-c", "user.email=test@itsol.local", "commit", "-m", "fixture"], { cwd: initiativeCwd });
    const initiativeStore = new TaskStateStore(fakePi, agents.length, "0.22.0");
    initiativeStore.startSession({ ...fakeContext, cwd: initiativeCwd });
    initiativeStore.setDefinition({
      ...base,
      task_id: "initiative-fixture",
      workflow_state: {
        ...base.workflow_state,
        workflow_mode: "autonomous-planned",
        artifact_state: "draft",
        execution_mode: "auto",
      },
      execution_policy: { ...base.execution_policy, max_subagents: "unlimited", max_parallel: 3 },
    });
    const initiative = new InitiativeManager(fakePi, initiativeStore);
    initiative.startSession({ ...fakeContext, cwd: initiativeCwd });
    const started = initiative.start({
      action: "start",
      task_id: "initiative-fixture",
      initiative_id: "account-module",
      title: "Account module",
      objective: "Deliver the complete account module",
      source_path: "business.md",
      completion_criteria: ["Account lifecycle passes system QA"],
      requirements: [{
        id: "REQ-001",
        summary: "Users can manage an account",
        acceptance_criteria: ["Lifecycle test passes"],
        priority: "must",
      }],
      phases: [{
        id: "P01",
        title: "Account lifecycle",
        objective: "Deliver account lifecycle",
        requirement_ids: ["REQ-001"],
        depends_on: [],
        done_when: ["System QA passes"],
      }],
    }, initiativeCwd);
    assert.equal(started.status, "planning");
    assert.equal(initiative.completionDecision("initiative-fixture").forceContinuation, true);
    assert.throws(() => initiative.update({
      action: "update",
      initiative_id: "account-module",
      entity: "initiative",
      status: "ready",
    }), /passing Rubber Duck Review/);
    await fs.promises.appendFile(path.join(initiativeCwd, ".itsol", "initiatives", "account-module", "roadmap.md"), "\nDetailed rollout remains here.\n");
    initiative.setRoadmapReviewValidator(() => true);
    initiative.update({ action: "update", initiative_id: "account-module", entity: "initiative", status: "ready" });
    assert.match(await fs.promises.readFile(path.join(initiativeCwd, ".itsol", "initiatives", "account-module", "roadmap.md"), "utf8"), /Detailed rollout remains here/);
    initiative.update({ action: "update", initiative_id: "account-module", entity: "phase", entity_id: "P01", status: "in-progress" });
    initiative.update({
      action: "update",
      initiative_id: "account-module",
      entity: "requirement",
      entity_id: "REQ-001",
      status: "implemented",
      evidence: ["account lifecycle test: PASS"],
    });
    const qaRepoPolicy = new RepoPolicyManager();
    qaRepoPolicy.startSession({ cwd: initiativeCwd } as any);
    const qaPi = { appendEntry: () => {}, exec: _pi.exec.bind(_pi) } as unknown as ExtensionAPI;
    const qa = new QaOrchestrator(qaPi, initiativeStore, initiative, agents, qaRepoPolicy);
    qa.startSession({ ...fakeContext, cwd: initiativeCwd });
    initiativeStore.recordReviewVerdict("initiative-fixture", {
      plan_id: "code-review-before-qa",
      fingerprint: await currentWorktreeFingerprint(qaPi, initiativeCwd),
      round: 1,
      verdict: "approve",
      findings: 0,
      coverage_gaps: [],
      recorded_at: Date.now(),
    });
    const phaseQaPlan = await qa.createPlan({
      task_id: "initiative-fixture",
      initiative_id: "account-module",
      scope: "phase",
      phase_id: "P01",
      application_types: ["cli"],
      changed_paths: ["."],
      acceptance_criteria: ["Account lifecycle passes system QA"],
      available_targets: ["npm test"],
      existing_test_evidence: ["unit tests: PASS"],
    }, { cwd: initiativeCwd } as any);
    assert.equal(phaseQaPlan.status, "ready");
    assert.ok(phaseQaPlan.delegations.some((item) => item.operations?.includes("interactive-cli-qa")));
    await qa.recordVerdict({
      task_id: "initiative-fixture",
      initiative_id: "account-module",
      plan_id: phaseQaPlan.id,
      covered_surfaces: [...phaseQaPlan.requiredCoverage],
      checks: phaseQaPlan.requiredCoverage.map((surface) => ({ name: `CLI ${surface}`, surface, status: "pass" as const, evidence: `${surface}: PASS`, source: "itsol-qa-handoff" })),
      findings: [],
      unverified: [],
    }, { cwd: initiativeCwd } as any);
    initiative.update({
      action: "update",
      initiative_id: "account-module",
      entity: "phase",
      entity_id: "P01",
      status: "completed",
      evidence: ["system QA: PASS"],
    });
    const systemQaPlan = await qa.createPlan({
      task_id: "initiative-fixture",
      initiative_id: "account-module",
      scope: "system",
      application_types: ["cli"],
      changed_paths: ["."],
      acceptance_criteria: ["Account lifecycle passes system QA"],
      available_targets: ["npm test"],
      existing_test_evidence: ["phase QA: PASS"],
    }, { cwd: initiativeCwd } as any);
    await qa.recordVerdict({
      task_id: "initiative-fixture",
      initiative_id: "account-module",
      plan_id: systemQaPlan.id,
      covered_surfaces: [...systemQaPlan.requiredCoverage],
      checks: systemQaPlan.requiredCoverage.map((surface) => ({ name: `System ${surface}`, surface, status: "pass" as const, evidence: `${surface}: PASS`, source: "itsol-qa-handoff" })),
      findings: [],
      unverified: [],
    }, { cwd: initiativeCwd } as any);
    assert.equal((await qa.completionDecision("initiative-fixture", { cwd: initiativeCwd } as any)).problems.length, 0);
    await fs.promises.writeFile(path.join(initiativeCwd, "post-qa-change.ts"), "export const changed = true;\n");
    assert.match((await qa.completionDecision("initiative-fixture", { cwd: initiativeCwd } as any)).problems.join("\n"), /stale/);
    await fs.promises.rm(path.join(initiativeCwd, "post-qa-change.ts"));
    const completedInitiative = initiative.complete("account-module", [{
      criterion: "Account lifecycle passes system QA",
      evidence: "full regression: PASS",
    }]);
    assert.equal(completedInitiative.status, "completed");
    assert.deepEqual(initiative.completionDecision("initiative-fixture").problems, []);
    assert.ok(fs.existsSync(path.join(initiativeCwd, ".itsol", "initiatives", "account-module", "state.json")));
    assert.ok(fs.existsSync(path.join(initiativeCwd, ".itsol", "initiatives", "account-module", "qa", `${systemQaPlan.id}.md`)));
    assert.match(await fs.promises.readFile(path.join(initiativeCwd, ".itsol", "initiatives", "account-module", "requirements.md"), "utf8"), /REQ-001.*implemented/);
    const restoredInitiative = new InitiativeManager(fakePi, initiativeStore);
    restoredInitiative.startSession({ ...fakeContext, cwd: initiativeCwd });
    assert.equal(restoredInitiative.getActive()?.initiative_id, "account-module");
  } finally {
    await fs.promises.rm(initiativeCwd, { recursive: true, force: true });
  }

  const reviewCwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsol-pi-review-"));
  try {
    await _pi.exec("git", ["init"], { cwd: reviewCwd });
    await fs.promises.mkdir(path.join(reviewCwd, "src", "auth"), { recursive: true });
    const reviewFile = path.join(reviewCwd, "src", "auth", "session.ts");
    await fs.promises.writeFile(reviewFile, "export const session = 'v1';\n");
    await _pi.exec("git", ["add", "."], { cwd: reviewCwd });
    await _pi.exec("git", ["-c", "user.name=ITSOL Test", "-c", "user.email=test@itsol.local", "commit", "-m", "fixture"], { cwd: reviewCwd });
    await fs.promises.writeFile(reviewFile, "export const session = getUntrustedSession();\n");

    const reviewStore = new TaskStateStore(fakePi, agents.length, "0.22.0");
    reviewStore.startSession(fakeContext);
    reviewStore.setDefinition({
      ...base,
      task_id: "review-fixture",
      execution_policy: { ...base.execution_policy, max_review_rounds: 2 },
    });
    const reviewPi = {
      appendEntry: () => {},
      exec: _pi.exec.bind(_pi),
    } as unknown as ExtensionAPI;
    const reviewRepoPolicy = new RepoPolicyManager();
    reviewRepoPolicy.startSession({ cwd: reviewCwd } as any);
    const orchestrator = new ReviewOrchestrator(reviewPi, reviewStore, agents, reviewRepoPolicy);
    const plan = await orchestrator.createPlan({
      task_id: "review-fixture",
      target: "working-tree",
      acceptance_criteria: ["Session input remains trusted"],
      test_evidence: [],
    }, { cwd: reviewCwd } as any) as any;
    assert.equal(plan.mandatorySubagents, true);
    assert.equal(plan.status, "ready");
    assert.ok(plan.selectedReviewers.some((item: any) => item.agent === "security-auth-session-review"));
    reviewStore.beginDelegation("review-fixture", plan.selectedReviewers.map((item: any) => item.agent));
    reviewStore.finishDelegation("review-fixture", plan.selectedReviewers.map((item: any) => item.agent),
      plan.selectedReviewers.map((item: any) => ({
        agent: item.agent,
        workItemId: plan.delegations.find((packet: any) => packet.agent === item.agent)?.work_item_id,
        role: "review",
        status: "completed",
        usage: { input: 10, output: 5, cost: 0.001 },
      })));
    const verdict = await orchestrator.consolidate({
      task_id: "review-fixture",
      plan_id: plan.id,
      covered_surfaces: plan.requiredCoverage,
      findings: [
        {
          intent: "Should",
          severity: "medium",
          title: "Validate untrusted session",
          file: "src/auth/session.ts",
          line: 1,
          evidence: "Direct use of untrusted session data",
          source: "reviewer-a",
        },
        {
          intent: "Blocker",
          severity: "high",
          title: "Validate untrusted session",
          file: "src/auth/session.ts",
          line: 1,
          evidence: "Trust boundary is bypassed",
          source: "reviewer-b",
        },
      ],
      unverified: [],
    });
    assert.equal(verdict.verdict, "changes-requested");
    assert.equal(verdict.findings.length, 1);
    assert.equal(reviewStore.getActive()?.review_verdict?.verdict, "changes-requested");
    assert.equal(reviewStore.getActive()?.review_runs, 1);

    await fs.promises.writeFile(reviewFile, "export const session = validateSession(getUntrustedSession());\n");
    await assert.rejects(() => orchestrator.consolidate({
      task_id: "review-fixture",
      plan_id: plan.id,
      covered_surfaces: plan.requiredCoverage,
      findings: [],
      unverified: [],
    }, { cwd: reviewCwd } as any), /diff is stale/);
    assert.match(await orchestrator.autoRereviewNotice("edit", { cwd: reviewCwd } as any) ?? "", /round 2\/2/);
    assert.equal(await orchestrator.autoRereviewNotice("edit", { cwd: reviewCwd } as any), undefined);
    const secondPlan = await orchestrator.createPlan({
      task_id: "review-fixture",
      target: "working-tree",
      acceptance_criteria: ["Session input remains trusted"],
      test_evidence: ["fixture test passes"],
    }, { cwd: reviewCwd } as any) as any;
    assert.equal(secondPlan.round, 2);
    reviewStore.beginDelegation("review-fixture", secondPlan.selectedReviewers.map((item: any) => item.agent));
    reviewStore.finishDelegation("review-fixture", secondPlan.selectedReviewers.map((item: any) => item.agent),
      secondPlan.selectedReviewers.map((item: any) => ({
        agent: item.agent,
        workItemId: secondPlan.delegations.find((packet: any) => packet.agent === item.agent)?.work_item_id,
        role: "review",
        status: "completed",
        usage: { input: 8, output: 4, cost: 0.001 },
      })));
    const approved = await orchestrator.consolidate({
      task_id: "review-fixture",
      plan_id: secondPlan.id,
      covered_surfaces: secondPlan.requiredCoverage,
      findings: [],
      unverified: [],
    });
    assert.equal(approved.verdict, "approve");
    assert.equal(reviewStore.getActive()?.review_runs, 2);
    assert.deepEqual((await orchestrator.completionDecision("review-fixture", { cwd: reviewCwd } as any)).problems, []);
    await fs.promises.writeFile(reviewFile, "export const session = changedAfterApproval();\n");
    assert.match((await orchestrator.completionDecision("review-fixture", { cwd: reviewCwd } as any)).problems.join("\n"), /stale/);
    await assert.rejects(() => orchestrator.createPlan({
      task_id: "review-fixture",
      target: "working-tree",
      acceptance_criteria: [],
      test_evidence: [],
    }, { cwd: reviewCwd } as any), /round limit/);
    assert.equal(orchestrator.setProfile("review-fixture", "off").profile, "off");
    assert.equal((await orchestrator.completionDecision("review-fixture", { cwd: reviewCwd } as any)).required, false);
    assert.equal(reviewStore.getActive()?.review_runs, 0);
    assert.equal(orchestrator.setProfile("review-fixture", "poc").delegation, "never");
    const pocPlan = await orchestrator.createPlan({
      task_id: "review-fixture",
      target: "working-tree",
      acceptance_criteria: ["POC remains fast"],
      test_evidence: [],
    }, { cwd: reviewCwd } as any) as any;
    assert.equal(pocPlan.status, "inline");
    assert.equal(pocPlan.mandatorySubagents, false);
    assert.equal(pocPlan.selectedReviewers.length, 0);

    const businessPlanPath = path.join(reviewCwd, ".itsol", "plans", "business.md");
    await fs.promises.mkdir(path.dirname(businessPlanPath), { recursive: true });
    await fs.promises.writeFile(businessPlanPath, "# Business Plan\n\n**Status:** Draft\n\n## Scope\nFixture scope.\n");
    reviewStore.setDefinition({
      ...base,
      task_id: "plan-review-fixture",
      workflow_state: {
        ...base.workflow_state,
        workflow_mode: "governed",
        decision_authority: "user",
        artifact_state: "draft",
        execution_mode: "pending",
      },
      execution_policy: {
        ...base.execution_policy,
        max_subagents: 1,
        max_parallel: 1,
        max_review_rounds: 2,
        stop_after: "business-plan",
      },
    });
    const planReview = new PlanReviewOrchestrator(
      reviewPi,
      pluginRoot,
      agents,
      reviewStore,
      new ModelRouter(),
      reviewRepoPolicy,
    );
    planReview.startSession({
      cwd: reviewCwd,
      hasUI: false,
      sessionManager: { getBranch: () => [] },
    } as any);
    const missingPlanReview = planReview.completionDecision("plan-review-fixture", "business-plan", reviewCwd);
    assert.equal(missingPlanReview.forceContinuation, true);
    assert.match(missingPlanReview.problems.join("\n"), /automatic isolated Rubber Duck Review/);
  } finally {
    await fs.promises.rm(reviewCwd, { recursive: true, force: true });
  }

  store.setAgentLimit("unlimited");
  store.setParallelLimit(3);
  assert.equal(store.getActive()?.execution_policy.max_subagents, "unlimited");
  assert.equal(store.getActive()?.execution_policy.max_parallel, 3);
  store.setAgentLimit(1);
  assert.equal(store.getActive()?.execution_policy.max_subagents, 1);
  assert.equal(store.getActive()?.execution_policy.max_parallel, 3);
  store.setParallelLimit(2);
  assert.equal(store.getActive()?.execution_policy.max_parallel, 2);
  store.beginDelegation(base.task_id, [writer.agent, writer.agent]);
  assert.equal(store.getActive()?.active_agents.length, 2);
  store.finishDelegation(base.task_id, [writer.agent, writer.agent], [
    { agent: writer.agent, workItemId: "auth-api", status: "completed", role: "implement", usage: { input: 1, output: 1, cost: 0 } },
    { agent: writer.agent, workItemId: "billing-api", status: "completed", role: "implement", usage: { input: 1, output: 1, cost: 0 } },
  ]);
  assert.equal(store.getActive()?.active_agents.length, 0);
  assert.equal(store.getActive()?.agent_results[`${writer.agent}:auth-api`]?.status, "completed");
  assert.equal(store.getActive()?.agent_results[`${writer.agent}:billing-api`]?.status, "completed");
  store.setReasoningControl("enforced", "high");
  assert.equal(store.getActive()?.execution_policy.reasoning_control, "enforced");
  assert.equal(store.getActive()?.execution_policy.reasoning_profile, "high");
  store.setReasoningControl("advisory");
  assert.equal(store.getActive()?.execution_policy.reasoning_control, "advisory");
  store.setPreset("standard");
  assert.equal(store.getActive()?.execution_policy.max_subagents, "unlimited");
  assert.equal(store.getActive()?.execution_policy.max_parallel, 3);

  const economy = applyPreset(base.execution_policy, "economy");
  assert.equal(economy.model_profile, "economy");
  assert.equal(economy.max_subagents, 0);
  assert.equal(economy.max_review_rounds, 1);
  const standard = applyPreset(base.execution_policy, "standard");
  assert.equal(standard.max_subagents, "unlimited");
  assert.equal(standard.max_parallel, 3);
  assert.equal(standard.reasoning_control, "advisory");
  const deep = applyPreset(base.execution_policy, "deep");
  assert.equal(deep.model_profile, "frontier");
  assert.equal(deep.max_subagents, "unlimited");
  assert.equal(deep.max_parallel, 3);
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
  validateDelegation({
    ...base,
    execution_policy: { ...base.execution_policy, max_subagents: "unlimited" },
  }, [reviewer], byName, new Set(["itsol-self-review", "itsol-feature-implementation", "svelte-review"]));
  validateDelegation({
    ...base,
    execution_policy: { ...base.execution_policy, max_subagents: 1, max_parallel: 2 },
  }, [
    { ...reviewer, work_item_id: "auth-api", read_scope: ["src/auth"] },
    { ...reviewer, work_item_id: "billing-api", read_scope: ["src/billing"] },
  ], byName, new Set());

  const rubberDuckReviewer = {
    agent: "itsol-self-review",
    role: "review",
    task: "Rubber Duck review the Business Plan",
    operations: ["rubber-duck-plan-review"],
    read_scope: [".itsol/plans/business.md"],
    write_scope: [],
    forbidden_scope: [],
    required_evidence: ["Plan Review Verdict"],
    stop_after: "analysis",
  } as const;
  validateDelegation({
    ...base,
    workflow_state: {
      ...base.workflow_state,
      workflow_mode: "governed",
      decision_authority: "user",
      artifact_state: "draft",
      execution_mode: "pending",
    },
  }, [rubberDuckReviewer], byName, new Set());
  assert.throws(() => validateDelegation({
    ...base,
    workflow_state: { ...base.workflow_state, execution_mode: "pending" },
  }, [reviewer], byName, new Set()), /does not authorize delegation/);

  assert.throws(
    () => validateDelegation(base, [writer, { ...writer, agent: "itsol-bug-debugging" }], byName, new Set()),
    /overlapping write scopes/,
  );
  validateDelegation({
    ...base,
    execution_policy: { ...base.execution_policy, max_parallel: 1 },
  }, [writer, reviewer], byName, new Set());
  assert.throws(
    () => validateDelegation({
      ...base,
      execution_policy: { ...base.execution_policy, max_parallel: 0 },
    }, [reviewer], byName, new Set()),
    /max_parallel is 0/,
  );
  console.log("pi runtime fixtures: PASS");
}

export default function registerPiRuntimeFixtures(pi: ExtensionAPI): void {
  pi.registerCommand("itsol-test-pi-runtime", {
    description: "Run ITSOL Powers Pi runtime fixtures",
    handler: async () => runPiRuntimeFixtures(pi),
  });
}
