import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { discoverItsolAgents } from "../extensions/pi/agents.ts";
import { detectItsolMemoryPresence, formatItsolMemoryPresence } from "../extensions/pi/index.ts";
import {
  applyPreset,
  TaskStateStore,
  type TaskStateDefinition,
} from "../extensions/pi/task-state.ts";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function runPiRuntimeFixtures(_pi: ExtensionAPI): Promise<void> {
  const memoryCwd = await fs.promises.mkdtemp(path.join(os.tmpdir(), "itsol-pi-memory-presence-"));
  try {
    await fs.promises.mkdir(path.join(memoryCwd, ".git"));
    const nestedCwd = path.join(memoryCwd, "apps", "api");
    await fs.promises.mkdir(nestedCwd, { recursive: true });
    assert.equal(detectItsolMemoryPresence(nestedCwd).exists, false);
    assert.match(formatItsolMemoryPresence(nestedCwd), /\.itsol\.md DOES NOT EXIST/);
    await fs.promises.writeFile(path.join(memoryCwd, ".itsol.md"), "this content is intentionally not parsed: [");
    const present = detectItsolMemoryPresence(nestedCwd);
    assert.equal(present.repositoryRoot, memoryCwd);
    assert.equal(present.filePath, path.join(memoryCwd, ".itsol.md"));
    assert.equal(present.exists, true);
    assert.match(formatItsolMemoryPresence(nestedCwd), /\.itsol\.md EXISTS/);
    assert.match(formatItsolMemoryPresence(nestedCwd), /did not read or parse/);
  } finally {
    await fs.promises.rm(memoryCwd, { recursive: true, force: true });
  }

  const agents = discoverItsolAgents(path.join(pluginRoot, "agents"));
  assert.equal(agents.length, 113);
  assert.equal(agents.find((agent) => agent.name === "itsol-feature-implementation")?.skills.includes("itsol-feature-implementation"), true);

  const definition: TaskStateDefinition = {
    task_id: "fixture",
    workflow_state: {
      workflow_mode: "direct",
      mode_source: "explicit-user-task-instruction",
      decision_authority: "delegated",
      scope: "current-task",
      artifact_state: "not-required",
      execution_mode: "inline",
      protected_constraints: [],
    },
    execution_policy: {
      preset: "standard",
      policy_sources: { base: "agent-default", constraints: [] },
      model_profile: "balanced",
      model_control: "advisory",
      reasoning_profile: "medium",
      reasoning_control: "advisory",
      max_subagents: 0,
      max_parallel: 0,
      max_review_rounds: 1,
      stop_after: "implementation-reviewed",
      budget_escalation: "ask",
    },
    done_when: ["fixture passes"],
  };

  const persistedEntries: Array<{ customType: string; data: unknown }> = [];
  const fakePi = {
    appendEntry(customType: string, data: unknown) {
      persistedEntries.push({ customType, data });
    },
  } as unknown as ExtensionAPI;
  const store = new TaskStateStore(fakePi, agents.length, "0.23.0");
  store.startSession({ hasUI: false, sessionManager: { getBranch: () => [] } } as any);
  assert.match(store.formatStatus(), /ITSOL Powers v0\.23\.0/);
  store.setDefinition(definition);
  assert.match(store.formatStatus(), /direct · standard · stop implementation-reviewed/);
  assert.doesNotMatch(store.formatDetails(), /Delegations|children|Cost:/);
  assert.match(store.formatPromptContext() ?? "", /informational/);

  const persisted = persistedEntries.at(-1)!;
  const restoredStore = new TaskStateStore(fakePi, agents.length, "0.23.0");
  restoredStore.startSession({
    hasUI: false,
    sessionManager: {
      getBranch: () => [{ type: "custom", customType: persisted.customType, data: persisted.data }],
    },
  } as any);
  assert.equal(restoredStore.getActive()?.task_id, definition.task_id);
  assert.equal(restoredStore.getActive()?.done_when[0], "fixture passes");

  restoredStore.setMode("governed");
  assert.equal(restoredStore.getActive()?.workflow_state.execution_mode, "pending");
  restoredStore.setMode("direct");
  assert.equal(restoredStore.getActive()?.workflow_state.execution_mode, "auto");

  const economy = applyPreset(definition.execution_policy, "economy");
  assert.equal(economy.model_profile, "economy");
  assert.equal(economy.max_subagents, 0);
  const standard = applyPreset(definition.execution_policy, "standard");
  assert.equal(standard.max_subagents, "unlimited");
  assert.equal(standard.max_parallel, 3);
  const deep = applyPreset(definition.execution_policy, "deep");
  assert.equal(deep.model_profile, "frontier");
  assert.equal(deep.max_review_rounds, 2);
}

export default function piRuntimeFixturesExtension(pi: ExtensionAPI): void {
  pi.registerCommand("itsol-test-pi-runtime", {
    description: "Run ITSOL Powers Pi runtime fixtures",
    handler: async () => {
      await runPiRuntimeFixtures(pi);
      process.stdout.write("pi runtime fixtures: PASS\n");
    },
  });
}
