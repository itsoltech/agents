#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePorcelainV1ZPaths } from "./lib/git-status.mjs";

const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repositoryRoot = path.resolve(pluginRoot, "../..");
const manifest = JSON.parse(
  readFileSync(path.join(pluginRoot, "evals/rollback-manifest.json"), "utf8"),
);
const frozenBehaviorPaths = new Set(
  manifest.behavior_paths.map((entry) => entry.path),
);
const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

assert.equal(manifest.schema_version, "1.0.0");
assert.match(manifest.baseline_revision, /^[0-9a-f]{40}$/);

function run(command, args, cwd, { expect = 0 } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: process.env,
  });
  if (result.error) throw result.error;
  assert.equal(
    result.status,
    expect,
    `${[command, ...args].join(" ")} failed with exit ${String(result.status)}\n${result.stdout}\n${result.stderr}`,
  );
  return result;
}

function classify(relativePath) {
  if (frozenBehaviorPaths.has(relativePath)) return "revert-behavior";
  for (const rule of manifest.rules) {
    if (
      (rule.prefix && relativePath.startsWith(rule.prefix))
      || (rule.paths && rule.paths.includes(relativePath))
    ) {
      return rule.action;
    }
  }
  return null;
}

assert.deepEqual(
  parsePorcelainV1ZPaths("M  ordinary.md\0R  new.md\0old.md\0C  copy.md\0source.md\0"),
  ["ordinary.md", "new.md", "old.md", "copy.md"],
  "porcelain parser must classify both sides of renames without treating copy sources as changed",
);

const status = run(
  "git",
  ["status", "--porcelain=v1", "-z", "--untracked-files=all"],
  repositoryRoot,
).stdout;
const changedPaths = parsePorcelainV1ZPaths(status)
  .filter((entry) => !entry.startsWith(".itsol/"));
assert(changedPaths.length > 0, "rollback proof expects a cutover diff");
for (const changedPath of changedPaths) {
  assert(
    classify(changedPath),
    `rollback manifest does not classify changed path: ${changedPath}`,
  );
}

const temporaryRoot = mkdtempSync(
  path.join(os.tmpdir(), "itsol-context-rollback-"),
);
try {
  const archivePath = path.join(temporaryRoot, "baseline.tar");
  const materializedRoot = path.join(temporaryRoot, "baseline");
  mkdirSync(materializedRoot);
  run(
    "git",
    [
      "archive",
      "--format=tar",
      `--output=${archivePath}`,
      manifest.baseline_revision,
    ],
    repositoryRoot,
  );
  run("tar", ["-xf", archivePath, "-C", materializedRoot], repositoryRoot);

  for (const relativePath of manifest.rollback_validation.overlay) {
    const source = path.join(repositoryRoot, relativePath);
    const destination = path.join(materializedRoot, relativePath);
    assert(existsSync(source), `rollback overlay source is missing: ${relativePath}`);
    mkdirSync(path.dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });
  }

  const materializedPlugin = path.join(
    materializedRoot,
    "plugins/itsolpowers",
  );
  for (const scriptName of manifest.rollback_validation.legacy_commands) {
    run("npm", ["run", scriptName], materializedPlugin);
  }
  run(process.execPath, ["./scripts/test-context-audit.mjs"], materializedPlugin);
  run(
    process.execPath,
    [
      "./scripts/validate-context-evals.mjs",
      "--self-test",
      "--result",
      "./evals/results/example-public-result.json",
    ],
    materializedPlugin,
  );
  run(
    process.execPath,
    [
      "./scripts/test-context-engineering.mjs",
      "--baseline-snapshot",
      "--plugin-root",
      materializedPlugin,
      "--eval-root",
      path.join(materializedPlugin, "evals"),
      "--revision",
      manifest.baseline_revision,
    ],
    materializedPlugin,
  );

  const safetyRoot = path.join(temporaryRoot, "rollback-safety");
  run(
    "git",
    ["clone", "--shared", "--no-checkout", repositoryRoot, safetyRoot],
    repositoryRoot,
  );
  run(
    "git",
    ["checkout", "--detach", manifest.baseline_revision],
    safetyRoot,
  );

  for (const entry of manifest.behavior_paths) {
    const source = path.join(repositoryRoot, entry.path);
    const destination = path.join(safetyRoot, entry.path);
    if (entry.candidate.state === "absent") {
      if (existsSync(destination)) rmSync(destination);
    } else {
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(source, destination);
    }
  }

  const unrelatedTrackedPath =
    "plugins/itsolpowers/skills/itsol-workflow-mode/SKILL.md";
  assert(
    !manifest.behavior_paths.some((entry) => entry.path === unrelatedTrackedPath),
    "safety fixture requires an unrelated tracked path",
  );
  const unrelatedTracked = path.join(safetyRoot, unrelatedTrackedPath);
  const unrelatedTrackedOriginal = readFileSync(unrelatedTracked);
  const unrelatedTrackedChanged = Buffer.concat([
    unrelatedTrackedOriginal,
    Buffer.from("\nUNRELATED_TRACKED_USER_CHANGE\n"),
  ]);
  writeFileSync(unrelatedTracked, unrelatedTrackedChanged);

  const unrelatedUntracked = path.join(
    safetyRoot,
    "plugins/itsolpowers/UNRELATED_USER_NOTE.txt",
  );
  const unrelatedUntrackedBytes = Buffer.from(
    "UNRELATED_UNTRACKED_USER_CHANGE\n",
  );
  writeFileSync(unrelatedUntracked, unrelatedUntrackedBytes);

  const unchangedCandidateEntry = manifest.behavior_paths.find(
    (entry) => entry.candidate.state === "file",
  );
  assert(unchangedCandidateEntry, "safety fixture needs a candidate file");
  const unchangedCandidatePath = path.join(
    safetyRoot,
    unchangedCandidateEntry.path,
  );
  const candidateHashBeforeRefusal = sha256(
    readFileSync(unchangedCandidatePath),
  );
  const refusedUnknown = run(
    process.execPath,
    [
      path.join(pluginRoot, "scripts/apply-context-rollback.mjs"),
      "--apply",
      "--repository-root",
      safetyRoot,
    ],
    pluginRoot,
    { expect: 1 },
  );
  assert.match(
    `${refusedUnknown.stdout}\n${refusedUnknown.stderr}`,
    /rollback manifest does not classify/,
  );
  assert.deepEqual(readFileSync(unrelatedTracked), unrelatedTrackedChanged);
  assert.deepEqual(readFileSync(unrelatedUntracked), unrelatedUntrackedBytes);
  assert.equal(
    sha256(readFileSync(unchangedCandidatePath)),
    candidateHashBeforeRefusal,
    "unknown-path preflight failure must not mutate candidate files",
  );

  writeFileSync(unrelatedTracked, unrelatedTrackedOriginal);
  rmSync(unrelatedUntracked);

  const driftEntry = manifest.behavior_paths.find(
    (entry) =>
      entry.candidate.state === "file"
      && entry.path !== unchangedCandidateEntry.path,
  );
  assert(driftEntry, "safety fixture needs a second candidate file");
  const driftPath = path.join(safetyRoot, driftEntry.path);
  const driftedBytes = Buffer.concat([
    readFileSync(driftPath),
    Buffer.from("\nCANDIDATE_PREIMAGE_DRIFT\n"),
  ]);
  writeFileSync(driftPath, driftedBytes);
  const refusedDrift = run(
    process.execPath,
    [
      path.join(pluginRoot, "scripts/apply-context-rollback.mjs"),
      "--apply",
      "--repository-root",
      safetyRoot,
    ],
    pluginRoot,
    { expect: 1 },
  );
  assert.match(
    `${refusedDrift.stdout}\n${refusedDrift.stderr}`,
    /candidate preimage drift/,
  );
  assert.deepEqual(readFileSync(driftPath), driftedBytes);
  assert.equal(
    sha256(readFileSync(unchangedCandidatePath)),
    candidateHashBeforeRefusal,
    "preimage failure must happen before any rollback mutation",
  );

  cpSync(path.join(repositoryRoot, driftEntry.path), driftPath);
  run(
    process.execPath,
    [
      path.join(pluginRoot, "scripts/apply-context-rollback.mjs"),
      "--apply",
      "--repository-root",
      safetyRoot,
    ],
    pluginRoot,
  );
  for (const entry of manifest.behavior_paths) {
    const target = path.join(safetyRoot, entry.path);
    if (entry.baseline.state === "absent") {
      assert(!existsSync(target), `rollback retained candidate-only file: ${entry.path}`);
    } else {
      assert.equal(
        sha256(readFileSync(target)),
        entry.baseline.sha256,
        `rollback baseline mismatch: ${entry.path}`,
      );
    }
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

process.stdout.write(
  `context rollback fixtures: PASS (${changedPaths.length} changed paths classified; baseline restored with retained measurement tooling)\n`,
);
