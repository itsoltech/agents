#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: pluginRoot,
  encoding: "utf8",
});
assert.equal(
  result.status,
  0,
  `npm pack --dry-run failed:\n${result.stdout}\n${result.stderr}`,
);

const report = JSON.parse(result.stdout);
assert.equal(report.length, 1, "npm pack must describe exactly one package");
const packaged = new Set(report[0].files.map((file) => file.path));

for (const requiredPath of [
  "agents/itsol-feature-implementation.md",
  "context/context-profiles.json",
  "scripts/agent-sources/itsol-feature-implementation.md",
  "scripts/generate-agent-contracts.mjs",
  "scripts/lib/agent-contract.mjs",
  "skills/_shared/references/dotnet-web-api/api-design.md",
]) {
  assert(packaged.has(requiredPath), `package is missing ${requiredPath}`);
}

assert(
  !packaged.has("skills/_shared/SKILL.md"),
  "shared references must not expose a discoverable skill",
);
process.stdout.write(
  `context package fixtures: PASS (${packaged.size} packaged files)\n`,
);
