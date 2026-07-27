#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePorcelainV1ZPaths } from "./lib/git-status.mjs";

const apply = process.argv.includes("--apply");
const repositoryRootArgument = process.argv.indexOf("--repository-root");
const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repositoryRoot = repositoryRootArgument >= 0
  ? path.resolve(process.argv[repositoryRootArgument + 1])
  : path.resolve(pluginRoot, "../..");
const manifest = JSON.parse(
  readFileSync(path.join(pluginRoot, "evals/rollback-manifest.json"), "utf8"),
);
const revision = manifest.baseline_revision;
const behaviorEntries = new Map(
  manifest.behavior_paths.map((entry) => [entry.path, entry]),
);
const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

function lstatIfPresent(absolutePath) {
  try {
    return lstatSync(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function git(args, { buffer = false, allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: buffer ? null : "utf8",
  });
  if (result.error) throw result.error;
  if (!allowFailure) {
    assert.equal(
      result.status,
      0,
      `git ${args.join(" ")} failed:\n${result.stderr?.toString() ?? ""}`,
    );
  }
  return result;
}

function classify(relativePath) {
  if (behaviorEntries.has(relativePath)) return "revert-behavior";
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

function changedPaths() {
  return parsePorcelainV1ZPaths(
    git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]).stdout,
  )
    .filter((entry) => !entry.startsWith(".itsol/"));
}

function containedPath(relativePath) {
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  assert(
    absolutePath.startsWith(`${repositoryRoot}${path.sep}`),
    `rollback path escapes repository: ${relativePath}`,
  );
  return absolutePath;
}

const behaviorPaths = [];
for (const relativePath of changedPaths()) {
  const action = classify(relativePath);
  assert(action, `rollback manifest does not classify: ${relativePath}`);
  if (action === "revert-behavior") behaviorPaths.push(relativePath);
}
behaviorPaths.sort();
assert.deepEqual(
  behaviorPaths,
  [...behaviorEntries.keys()].sort(),
  "working tree does not exactly match the frozen rollback behavior path set",
);

function validateState(relativePath, expected, label) {
  const absolutePath = containedPath(relativePath);
  if (expected.state === "absent") {
    assert(
      !lstatIfPresent(absolutePath),
      `${label} must be absent: ${relativePath}`,
    );
    return;
  }
  assert.equal(expected.state, "file", `${label} has invalid state: ${relativePath}`);
  assert.equal(expected.type, "regular", `${label} has invalid type: ${relativePath}`);
  const stat = lstatIfPresent(absolutePath);
  assert(stat, `${label} is missing: ${relativePath}`);
  assert(
    stat.isFile() && !stat.isSymbolicLink(),
    `${label} is not a regular file: ${relativePath}`,
  );
  assert.equal(
    sha256(readFileSync(absolutePath)),
    expected.sha256,
    `${label} preimage drift: ${relativePath}`,
  );
}

for (const [relativePath, entry] of behaviorEntries) {
  validateState(relativePath, entry.candidate, "candidate");
  const baselineResult = git(["show", `${revision}:${relativePath}`], {
    buffer: true,
    allowFailure: true,
  });
  if (entry.baseline.state === "absent") {
    assert.notEqual(
      baselineResult.status,
      0,
      `baseline unexpectedly contains: ${relativePath}`,
    );
  } else {
    assert.equal(
      baselineResult.status,
      0,
      `baseline is missing: ${relativePath}`,
    );
    assert.equal(
      sha256(baselineResult.stdout),
      entry.baseline.sha256,
      `baseline manifest drift: ${relativePath}`,
    );
  }
}

if (!apply) {
  process.stdout.write(
    `${JSON.stringify({
      baseline_revision: revision,
      behavior_path_count: behaviorPaths.length,
      behavior_paths: behaviorPaths,
      status: "dry-run",
    }, null, 2)}\n`,
  );
  process.exit(0);
}

let restored = 0;
let removed = 0;
for (const relativePath of behaviorPaths) {
  const absolutePath = containedPath(relativePath);
  const existsAtBaseline =
    git(["cat-file", "-e", `${revision}:${relativePath}`], {
      allowFailure: true,
    }).status === 0;
  if (existsAtBaseline) {
    const bytes = git(["show", `${revision}:${relativePath}`], {
      buffer: true,
    }).stdout;
    const current = lstatIfPresent(absolutePath);
    if (current) {
      assert(
        !current.isDirectory() || current.isSymbolicLink(),
        `refusing to replace directory rollback target: ${relativePath}`,
      );
      if (current.isSymbolicLink()) rmSync(absolutePath);
    }
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, bytes);
    const tree = git(["ls-tree", revision, "--", relativePath]).stdout.trim();
    const mode = tree.split(/\s+/, 1)[0];
    chmodSync(absolutePath, mode === "100755" ? 0o755 : 0o644);
    restored += 1;
  } else {
    const current = lstatIfPresent(absolutePath);
    if (!current) continue;
    assert(
      !current.isDirectory() || current.isSymbolicLink(),
      `refusing recursive removal of rollback target: ${relativePath}`,
    );
    rmSync(absolutePath);
    removed += 1;
  }
}

const remainingBehavior = changedPaths().filter(
  (relativePath) => classify(relativePath) === "revert-behavior",
);
assert.deepEqual(
  remainingBehavior,
  [],
  `behavior paths remain after rollback: ${remainingBehavior.join(", ")}`,
);
process.stdout.write(
  `context rollback applied: PASS (${restored} baseline files restored; ${removed} candidate-only files removed)\n`,
);
