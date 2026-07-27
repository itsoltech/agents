#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  CANONICAL_REFERENCE_CLUSTERS,
  evaluateCanonicalReferences,
  materializeBaselineSkills,
  materializeSkillsPackage,
  validateExceptionManifest,
  validateMarkdownLinks,
} from "./lib/canonical-reference-contract.mjs";
import { stableJson } from "./lib/context-audit.mjs";

const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repositoryRoot = path.resolve(pluginRoot, "../..");
const baseline = JSON.parse(
  await readFile(
    path.join(pluginRoot, "evals/baselines/0.23.0.json"),
    "utf8",
  ),
);
const exceptionManifest = JSON.parse(
  await readFile(
    path.join(pluginRoot, "evals/canonical-reference-exceptions.json"),
    "utf8",
  ),
);
const revision = baseline.repository_revision;

assert.equal(
  revision,
  "7c0e5bc9f24c9b393998c2dfdd1e7abb6e2de824",
  "canonical RED proof must stay bound to the immutable 0.23.0 revision",
);
assert.equal(
  CANONICAL_REFERENCE_CLUSTERS.length,
  17,
  "all immutable near-duplicate clusters must be classified",
);
assert.deepEqual(
  CANONICAL_REFERENCE_CLUSTERS.map((cluster) => cluster.members),
  baseline.context_audit.duplicates.near.map((cluster) => cluster.paths),
  "canonical cluster map must exactly match the immutable baseline inventory",
);

const baselineTree = await materializeBaselineSkills({
  repositoryRoot,
  revision,
});
try {
  const baselineReport = await evaluateCanonicalReferences({
    exceptionManifest,
    pluginRoot: baselineTree.pluginRoot,
    repositoryRoot,
    revision,
  });
  assert.equal(
    baselineReport.status,
    "red",
    "the exact 0.23.0 baseline must prove the canonical-reference gate RED",
  );
  assert.equal(
    baselineReport.remaining_unexplained_clusters.length,
    17,
    "the baseline must expose all 17 unexplained clusters",
  );
} finally {
  await baselineTree.cleanup();
}

const sourceFirst = await evaluateCanonicalReferences({
  exceptionManifest,
  pluginRoot,
  repositoryRoot,
  revision,
});
const sourceSecond = await evaluateCanonicalReferences({
  exceptionManifest,
  pluginRoot,
  repositoryRoot,
  revision,
});
assert.equal(
  stableJson(sourceFirst),
  stableJson(sourceSecond),
  "source-tree report must be byte-identical across two runs",
);
assert.equal(
  sourceFirst.status,
  "green",
  `candidate canonical references must be GREEN:\n${stableJson(sourceFirst)}`,
);

const packageTree = await materializeSkillsPackage({ pluginRoot });
try {
  const packageFirst = await evaluateCanonicalReferences({
    exceptionManifest,
    pluginRoot: packageTree.pluginRoot,
    repositoryRoot,
    revision,
  });
  const packageSecond = await evaluateCanonicalReferences({
    exceptionManifest,
    pluginRoot: packageTree.pluginRoot,
    repositoryRoot,
    revision,
  });
  assert.equal(
    stableJson(packageFirst),
    stableJson(packageSecond),
    "package-shaped report must be byte-identical across two runs",
  );
  assert.equal(
    packageFirst.status,
    "green",
    `materialized skills package must be GREEN:\n${stableJson(packageFirst)}`,
  );
} finally {
  await packageTree.cleanup();
}

const syntheticClusters = [
  {
    paths: ["skills/a/references/a.md", "skills/b/references/b.md"],
    similarity: 0.99,
  },
  {
    paths: ["skills/c/references/c.md", "skills/d/references/d.md"],
    similarity: 0.98,
  },
];
const validSyntheticManifest = {
  exceptions: [
    {
      cluster_id: "intentional-distinct-procedures",
      paths: ["skills/a/references/a.md", "skills/b/references/b.md"],
      reason: "The files encode different task-stage procedures.",
    },
  ],
  normalization: {
    case: "lowercase",
    link_destinations: "excluded",
    shingle_size_tokens: 5,
    whitespace: "collapsed",
  },
  schema_version: "1.0.0",
  similarity_threshold: 0.95,
};
validateExceptionManifest({
  currentClusters: syntheticClusters,
  manifest: validSyntheticManifest,
});
assert.throws(
  () =>
    validateExceptionManifest({
      currentClusters: syntheticClusters,
      manifest: {
        ...validSyntheticManifest,
        exceptions: [
          {
            ...validSyntheticManifest.exceptions[0],
            paths: [
              "skills/a/references/a.md",
              "skills/unknown/references/unknown.md",
            ],
          },
        ],
      },
    }),
  /stale or unknown/,
);
assert.throws(
  () =>
    validateExceptionManifest({
      currentClusters: syntheticClusters,
      manifest: {
        ...validSyntheticManifest,
        exceptions: [
          {
            ...validSyntheticManifest.exceptions[0],
            paths: [
              "skills/a/references/a.md",
              "skills/c/references/c.md",
            ],
          },
        ],
      },
    }),
  /do not identify a current cluster/,
);

const invalidLinkRoot = await mkdtemp(
  path.join(os.tmpdir(), "itsol-canonical-invalid-links-"),
);
try {
  const referencesRoot = path.join(
    invalidLinkRoot,
    "skills/example/references",
  );
  await mkdir(referencesRoot, { recursive: true });
  await writeFile(
    path.join(referencesRoot, "invalid.md"),
    [
      "[Absolute](/workspace/private.md)",
      "[Escaping](../../../../outside.md)",
      "[Missing](missing.md)",
      "",
    ].join("\n"),
  );
  await symlink(
    path.join(referencesRoot, "invalid.md"),
    path.join(referencesRoot, "linked.md"),
  );
  const invalidLinkFindings = await validateMarkdownLinks(invalidLinkRoot);
  assert.deepEqual(
    [...new Set(invalidLinkFindings.map((finding) => finding.kind))].sort(),
    ["absolute-or-dynamic-link", "escaping-link", "missing-link", "symlink"],
    "link validator must reject absolute, escaping, missing, and symlink paths",
  );
} finally {
  await rm(invalidLinkRoot, { force: true, recursive: true });
}

console.log(
  "canonical references: PASS (baseline 17 -> unexplained 0; source/package deterministic)",
);
