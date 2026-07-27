#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parsePorcelainV1ZPaths } from "./lib/git-status.mjs";

const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repositoryRoot = path.resolve(pluginRoot, "../..");
const manifestPath = path.join(pluginRoot, "evals/rollback-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const revision = manifest.baseline_revision;
const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

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

function retained(relativePath) {
  for (const rule of manifest.rules) {
    if (
        (rule.prefix && relativePath.startsWith(rule.prefix))
        || (rule.paths && rule.paths.includes(relativePath))
    ) {
      return rule.action.startsWith("retain-");
    }
  }
  return false;
}

const trackedChangedPaths = git([
  "diff",
  "--name-only",
  "--no-renames",
  "-z",
  revision,
  "--",
]).stdout
  .split("\0")
  .filter(Boolean);
const workingTreePaths = git([
  "status",
  "--porcelain=v1",
  "-z",
  "--untracked-files=all",
]).stdout;
const classifiedPaths = [...new Set([
  ...trackedChangedPaths,
  ...parsePorcelainV1ZPaths(workingTreePaths),
])]
  .filter((entry) => !entry.startsWith(".itsol/"))
  .sort();

const behaviorPaths = classifiedPaths.filter((relativePath) => !retained(relativePath));
const entries = behaviorPaths.map((relativePath) => {
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  assert(
    absolutePath.startsWith(`${repositoryRoot}${path.sep}`),
    `candidate path escapes repository: ${relativePath}`,
  );
  const candidate = existsSync(absolutePath)
    ? (() => {
        const stat = lstatSync(absolutePath);
        assert(stat.isFile() && !stat.isSymbolicLink(), `candidate must be a regular file: ${relativePath}`);
        return {
          state: "file",
          type: "regular",
          sha256: sha256(readFileSync(absolutePath)),
        };
      })()
    : { state: "absent" };

  const baselineResult = git(["show", `${revision}:${relativePath}`], {
    buffer: true,
    allowFailure: true,
  });
  const baseline = baselineResult.status === 0
    ? {
        state: "file",
        type: "regular",
        sha256: sha256(baselineResult.stdout),
      }
    : { state: "absent" };
  return { path: relativePath, candidate, baseline };
});

manifest.behavior_paths = entries;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(
  `context rollback manifest frozen: PASS (${entries.length} exact behavior paths)\n`,
);
