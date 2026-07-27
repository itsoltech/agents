#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const commands = [
  ["npm", ["run", "validate:workflow-modes"]],
  ["npm", ["run", "validate:execution-policy"]],
  ["npm", ["run", "test:subagent-stop"]],
  ["npm", ["run", "test:opencode-adapter"]],
  ["npm", ["run", "test:pi-adapter"]],
  ["npm", ["run", "test:execution-policy"]],
  ["npm", ["run", "test:codex-agent-setup"]],
  ["npm", ["run", "test:pi-runtime"]],
  ["npm", ["run", "test:context-audit"]],
  ["npm", ["run", "validate:context-evals"]],
  ["npm", ["run", "test:context-engineering"]],
  ["npm", ["run", "test:context-profiles"]],
  ["npm", ["run", "validate:canonical-references"]],
  ["npm", ["run", "check:agent-contracts"]],
  ["npm", ["run", "test:agent-contracts"]],
  ["npm", ["run", "test:context-package"]],
  ["npm", ["run", "test:skill-layout"]],
  ["npm", ["run", "test:context-rollback"]],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    cwd: pluginRoot,
    encoding: "utf8",
    env: process.env,
  });
  assert.equal(
    result.status,
    0,
    `${[command, ...args].join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
  );
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
}

process.stdout.write(
  `context engineering validation: PASS (${commands.length} commands)\n`,
);
