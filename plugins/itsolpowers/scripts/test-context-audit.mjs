#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  auditContext,
  formatAuditHuman,
  stableJson,
} from "./lib/context-audit.mjs";

const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "itsol-context-audit-"));

try {
  const pluginRoot = path.join(temporaryRoot, "plugin");
  const files = {
    "hooks/bootstrap-context.md": "Shared bootstrap words.\n",
    "hooks/bootstrap-context-codex.md": "Codex adapter words.\n",
    ".codex-plugin/plugin.json": JSON.stringify({
      interface: {
        defaultPrompt: ["First instruction.", "Second instruction."],
      },
    }),
    "skills/using-itsolpowers/SKILL.md": [
      "---",
      "name: using-itsolpowers",
      'description: "Fixture router description."',
      "---",
      "# Router",
      "Choose one process skill.",
      "[Guide](references/guide.md)",
      "",
    ].join("\n"),
    "skills/using-itsolpowers/references/guide.md":
      "alpha beta gamma delta epsilon zeta eta theta\n",
    "skills/sample/SKILL.md": [
      "---",
      "name: sample",
      'description: "Fixture skill description."',
      "---",
      "# Sample",
      "[Missing](references/missing.md)",
      "[Escaping](../../../outside.md)",
      "",
    ].join("\n"),
    "skills/sample/references/a.md":
      "Alpha beta gamma delta epsilon zeta eta theta [visible label](https://example.com/a).\n",
    "skills/sample/references/b.md":
      "alpha beta gamma delta epsilon zeta eta theta [visible label](https://different.example/b)\n",
    "skills/sample/references/c.md":
      "alpha beta gamma delta epsilon zeta eta theta [visible label](https://example.com/a).\n",
    "agents/sample.md": "# Sample agent\nDo bounded work.\n",
  };

  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = path.join(pluginRoot, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, contents);
  }

  const first = await auditContext({
    pluginRoot,
    revision: "fixture-revision",
  });
  const second = await auditContext({
    pluginRoot,
    revision: "fixture-revision",
  });

  assert.equal(stableJson(first), stableJson(second), "audit output must be deterministic");
  assert.equal(first.revision, "fixture-revision");
  assert.equal(first.plugin_root, path.resolve(pluginRoot));
  assert.equal(first.metrics.bootstrap.file_count, 1);
  assert.equal(first.metrics.adapters.file_count, 1);
  assert.equal(first.metrics.router.file_count, 1);
  assert.equal(first.metrics.router_guide.file_count, 1);
  assert.equal(first.metrics.codex_default_prompt.instruction_count, 2);
  assert.equal(first.metrics.skill_descriptions.file_count, 2);
  assert.equal(first.metrics.skill_bodies.file_count, 2);
  assert.equal(first.metrics.references.file_count, 4);
  assert.equal(first.metrics.agents.file_count, 1);

  assert.deepEqual(
    first.duplicates.exact.map((cluster) => cluster.paths),
    [[
      "skills/sample/references/a.md",
      "skills/sample/references/c.md",
    ]],
  );
  assert.ok(
    first.duplicates.near.some(
      (cluster) =>
        cluster.similarity >= 0.95 &&
        cluster.paths.includes("skills/sample/references/a.md") &&
        cluster.paths.includes("skills/sample/references/b.md"),
    ),
    "link destinations must be excluded from normalized near-duplicate comparison",
  );
  assert.deepEqual(
    first.links.findings.map(({ kind, source, target }) => ({
      kind,
      source,
      target,
    })),
    [
      {
        kind: "escaping",
        source: "skills/sample/SKILL.md",
        target: "../../../outside.md",
      },
      {
        kind: "missing",
        source: "skills/sample/SKILL.md",
        target: "references/missing.md",
      },
    ],
  );

  const human = formatAuditHuman(first);
  assert.equal(human, formatAuditHuman(second));
  assert.match(human, /Revision: fixture-revision/);
  assert.match(
    human,
    new RegExp(`Total measured words: ${first.totals.measured_words}`),
  );
  assert.match(
    human,
    new RegExp(`Link findings: ${first.links.findings.length}`),
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log("context audit fixtures: PASS");
