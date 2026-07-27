import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  BASELINE_INVENTORY_FILE,
  __testOnlyAtomicWriteAgentFile,
  buildSpecialistBody,
  discoverRuntimeAgentFiles,
  loadAgentSources,
  parseAgentSource,
  parseGeneratedAgent,
  renderAgentContract,
  renderAgentSource,
  semanticHash,
} from "./lib/agent-contract.mjs";

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatorPath = path.join(pluginRoot, "scripts", "generate-agent-contracts.mjs");

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

const statRecord = (target) => {
  const stat = fs.lstatSync(target, { bigint: true });
  const record = {
    mode: stat.mode.toString(),
    mtimeNs: stat.mtimeNs.toString(),
    size: stat.size.toString(),
    type: stat.isSymbolicLink()
      ? "symlink"
      : stat.isDirectory()
        ? "directory"
        : stat.isFile()
          ? "file"
          : "other",
  };
  if (stat.isSymbolicLink()) record.link = fs.readlinkSync(target);
  if (stat.isFile()) record.sha256 = sha256(fs.readFileSync(target));
  return record;
};

const snapshotTree = (root) => {
  const snapshot = {};
  const visit = (directory, relativeDirectory = "") => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => (
      a.name.localeCompare(b.name)
    ))) {
      const relativePath = path.join(relativeDirectory, entry.name);
      const target = path.join(directory, entry.name);
      snapshot[relativePath.split(path.sep).join("/")] = statRecord(target);
      if (entry.isDirectory() && !entry.isSymbolicLink()) visit(target, relativePath);
    }
  };
  visit(root);
  return snapshot;
};

const write = (root, relativePath, content) => {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const source = ({
  name = "sample-agent",
  description = "Readable sample agent source.",
  skills = ["itsolpowers:sample-skill", "itsolpowers:sample-support"],
  tools = "Read, Grep, Glob",
  disallowedTools = "Write, Edit, MultiEdit, Agent",
  responseStyle,
  body = "# Sample Agent\n\nKeep the sample-specific purpose intact.\n",
} = {}) => `---
name: ${name}
description: ${JSON.stringify(description)}
skills:
${skills.map((skill) => `  - ${skill}`).join("\n")}
tools: ${tools}
disallowedTools: ${disallowedTools}${responseStyle ? `\nresponseStyle: ${responseStyle}` : ""}
---
${body}`;

const expectedSampleAgent = `---
name: sample-agent
description: "Readable sample agent source."
model: sonnet
effort: medium
skills:
  - itsolpowers:sample-skill
  - itsolpowers:sample-support
tools: Read, Grep, Glob
disallowedTools: Write, Edit, MultiEdit, Agent
---

# Sample Agent

Keep the sample-specific purpose intact.

## Required Response Envelope

End with exactly one ordered, column-one envelope without a code fence. Use \`completed\` only when the delegated acceptance criteria and verification are satisfied.

Status: completed|partial|blocked|failed
Verification: <non-empty command or evidence summary; use "not run: <reason>" only when not completed>
Unverified: <non-empty gap summary or "none">
`;

const createFixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "itsol-agent-contracts-"));
  fs.mkdirSync(path.join(root, "agents"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts", "agent-sources"), { recursive: true });
  return root;
};

const writeFixtureInventory = (root, contracts) => {
  const agents = Object.fromEntries(contracts.map((contract) => [
    `${contract.name}.md`,
    {
      raw_sha256: sha256(`fixture baseline: ${contract.name}`),
      semantic_sha256: semanticHash(contract),
    },
  ]));
  write(
    root,
    path.join("scripts", "agent-sources", BASELINE_INVENTORY_FILE),
    `${JSON.stringify({ schema_version: 1, agents }, null, 2)}\n`,
  );
};

const prepareFrozenFixture = (root) => {
  write(root, "scripts/agent-sources/sample-agent.md", source());
  const contracts = loadAgentSources(root);
  assert.equal(contracts.length, 1);
  writeFixtureInventory(root, contracts);
  return contracts;
};

const runGenerator = (root, ...args) => spawnSync(
  process.execPath,
  [generatorPath, "--root", root, ...args],
  { encoding: "utf8" },
);

const specialistSource = source({
  name: "sample-review",
  description: "Readable reviewer. Skill scope: Review the delegated sample.",
  skills: ["itsolpowers:sample-review"],
  body: "",
}).replace(
  "disallowedTools: Write, Edit, MultiEdit, Agent\n---",
  "disallowedTools: Write, Edit, MultiEdit, Agent\ntemplate: specialist\ntitle: Sample Review\n---",
);
const specialistContract = parseAgentSource(
  specialistSource,
  "scripts/agent-sources/sample-review.md",
);
assert.equal(specialistContract.template, "specialist");
assert.equal(
  specialistContract.body,
  buildSpecialistBody({
    name: "sample-review",
    title: "Sample Review",
    scope: "Review the delegated sample.",
    writable: false,
  }),
);
assert.equal(renderAgentSource(specialistContract), specialistSource);
assert.throws(
  () => parseAgentSource(
    `${specialistSource}Duplicated generated body.\n`,
    "scripts/agent-sources/sample-review.md",
  ),
  /specialist template must not duplicate generated body/,
);

const fixtureRoot = createFixture();
try {
  const contracts = prepareFrozenFixture(fixtureRoot);
  const inventoryPath = path.join(
    fixtureRoot,
    "scripts",
    "agent-sources",
    BASELINE_INVENTORY_FILE,
  );
  const frozenInventory = statRecord(inventoryPath);

  const initialCheck = runGenerator(fixtureRoot, "--check");
  assert.notEqual(initialCheck.status, 0, "missing generated output must fail --check");
  assert.match(initialCheck.stderr, /agents\/sample-agent\.md: missing generated agent/);
  assert.equal(fs.existsSync(path.join(fixtureRoot, "agents", "sample-agent.md")), false);

  const generated = runGenerator(fixtureRoot);
  assert.equal(generated.status, 0, generated.stderr);
  const generatedPath = path.join(fixtureRoot, "agents", "sample-agent.md");
  const firstBytes = fs.readFileSync(generatedPath, "utf8");
  assert.equal(firstBytes, expectedSampleAgent, "generated contract must match independent literal");
  assert.equal(firstBytes, renderAgentContract(contracts[0]));
  assert.equal(parseGeneratedAgent(firstBytes, "sample-agent.md").model, "sonnet");
  assert.match(firstBytes, /^effort: medium$/m);

  const firstHash = sha256(firstBytes);
  assert.equal(runGenerator(fixtureRoot).status, 0);
  assert.equal(sha256(fs.readFileSync(generatedPath, "utf8")), firstHash);
  const passingCheckSnapshot = snapshotTree(fixtureRoot);
  assert.equal(runGenerator(fixtureRoot, "--check").status, 0);
  assert.deepEqual(snapshotTree(fixtureRoot), passingCheckSnapshot, "passing --check must be read-only");
  assert.deepEqual(fs.readdirSync(path.join(fixtureRoot, "agents")), ["sample-agent.md"]);

  fs.appendFileSync(generatedPath, "\nmanual drift\n");
  const failingCheckSnapshot = snapshotTree(fixtureRoot);
  const drift = runGenerator(fixtureRoot, "--check");
  assert.notEqual(drift.status, 0);
  assert.match(drift.stderr, /agents\/sample-agent\.md: generated content drift/);
  assert.deepEqual(snapshotTree(fixtureRoot), failingCheckSnapshot, "failing --check must be read-only");
  assert.match(fs.readFileSync(generatedPath, "utf8"), /manual drift/);
  assert.equal(runGenerator(fixtureRoot).status, 0);
  assert.equal(sha256(fs.readFileSync(generatedPath, "utf8")), firstHash);
  assert.deepEqual(statRecord(inventoryPath), frozenInventory);

  const sourcePath = path.join(fixtureRoot, "scripts", "agent-sources", "sample-agent.md");
  const baselineSource = fs.readFileSync(sourcePath, "utf8");
  const sourceMutations = [
    [
      "description",
      (content) => content.replace(
        'description: "Readable sample agent source."',
        'description: "Mutated sample agent source."',
      ),
    ],
    [
      "body",
      (content) => content.replace(
        "Keep the sample-specific purpose intact.",
        "Mutate the sample-specific purpose.",
      ),
    ],
    [
      "tools",
      (content) => content.replace(
        "tools: Read, Grep, Glob",
        "tools: Read, Grep, Glob, Bash",
      ),
    ],
    [
      "disallowed tools",
      (content) => content.replace(
        "disallowedTools: Write, Edit, MultiEdit, Agent",
        "disallowedTools: Write, Edit, MultiEdit, Bash, Agent",
      ),
    ],
    [
      "ordered skills",
      (content) => content.replace(
        "  - itsolpowers:sample-skill\n  - itsolpowers:sample-support",
        "  - itsolpowers:sample-support\n  - itsolpowers:sample-skill",
      ),
    ],
  ];
  for (const [label, mutate] of sourceMutations) {
    const mutated = mutate(baselineSource);
    assert.notEqual(mutated, baselineSource, `${label} mutation must change literal source bytes`);
    fs.writeFileSync(sourcePath, mutated);
    const beforeMutationCheck = snapshotTree(fixtureRoot);
    const result = runGenerator(fixtureRoot, "--check");
    assert.notEqual(result.status, 0, `${label} source mutation must fail`);
    assert.match(
      result.stderr,
      /scripts\/agent-sources\/sample-agent\.md: semantic content differs from frozen baseline inventory/,
    );
    assert.deepEqual(snapshotTree(fixtureRoot), beforeMutationCheck, `${label} --check must be read-only`);
    assert.deepEqual(statRecord(inventoryPath), frozenInventory);
    fs.writeFileSync(sourcePath, baselineSource);
  }
  assert.equal(runGenerator(fixtureRoot, "--check").status, 0);

  const generatedMutations = [
    [
      "generated tools",
      (content) => content.replace(
        "tools: Read, Grep, Glob",
        "tools: Read, Grep, Glob, Bash",
      ),
    ],
    [
      "generated ordered skills",
      (content) => content.replace(
        "  - itsolpowers:sample-skill\n  - itsolpowers:sample-support",
        "  - itsolpowers:sample-support\n  - itsolpowers:sample-skill",
      ),
    ],
    [
      "generated terminal envelope",
      (content) => content.replace(
        "End with exactly one ordered, column-one envelope",
        "End with a mutated unordered envelope",
      ),
    ],
  ];
  for (const [label, mutate] of generatedMutations) {
    const mutated = mutate(firstBytes);
    assert.notEqual(mutated, firstBytes, `${label} mutation must change literal output bytes`);
    fs.writeFileSync(generatedPath, mutated);
    const beforeMutationCheck = snapshotTree(fixtureRoot);
    const result = runGenerator(fixtureRoot, "--check");
    assert.notEqual(result.status, 0, `${label} mutation must fail`);
    assert.match(result.stderr, /agents\/sample-agent\.md: generated content drift/);
    assert.deepEqual(snapshotTree(fixtureRoot), beforeMutationCheck, `${label} --check must be read-only`);
    assert.equal(runGenerator(fixtureRoot).status, 0, `${label} regeneration must pass`);
    assert.equal(fs.readFileSync(generatedPath, "utf8"), firstBytes);
    assert.deepEqual(statRecord(inventoryPath), frozenInventory);
  }

  write(fixtureRoot, "scripts/agent-sources/malformed.md", "not frontmatter\n");
  const malformed = runGenerator(fixtureRoot, "--check");
  assert.notEqual(malformed.status, 0);
  assert.match(malformed.stderr, /scripts\/agent-sources\/malformed\.md: missing YAML frontmatter/);
  fs.rmSync(path.join(fixtureRoot, "scripts", "agent-sources", "malformed.md"));

  write(
    fixtureRoot,
    "scripts/agent-sources/zz-duplicate.md",
    source({ name: "sample-agent", body: "# Duplicate\n\nMust be rejected.\n" }),
  );
  const duplicate = runGenerator(fixtureRoot, "--check");
  assert.notEqual(duplicate.status, 0);
  assert.match(duplicate.stderr, /duplicate agent name: sample-agent/);
  fs.rmSync(path.join(fixtureRoot, "scripts", "agent-sources", "zz-duplicate.md"));

  const sampleSourcePath = path.join(fixtureRoot, "scripts", "agent-sources", "sample-agent.md");
  const parkedSourcePath = path.join(fixtureRoot, "scripts", "agent-sources", "sample-agent.parked");
  fs.renameSync(sampleSourcePath, parkedSourcePath);
  const missing = runGenerator(fixtureRoot, "--check");
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /scripts\/agent-sources\/sample-agent\.md: baseline agent source is missing/);
  fs.renameSync(parkedSourcePath, sampleSourcePath);

  write(fixtureRoot, "agents/unexpected.md", "# Unexpected runtime agent\n");
  const extra = runGenerator(fixtureRoot, "--check");
  assert.notEqual(extra.status, 0);
  assert.match(extra.stderr, /agents\/unexpected\.md: unexpected generated agent/);
  assert.equal(runGenerator(fixtureRoot).status, 1, "generation must not delete unexpected output");
  assert.equal(fs.existsSync(path.join(fixtureRoot, "agents", "unexpected.md")), true);
} finally {
  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

const targetSymlinkRoot = createFixture();
const targetSymlinkVictimRoot = fs.mkdtempSync(path.join(os.tmpdir(), "itsol-agent-victim-"));
try {
  prepareFrozenFixture(targetSymlinkRoot);
  const victimPath = path.join(targetSymlinkVictimRoot, "victim.md");
  fs.writeFileSync(victimPath, "victim must remain unchanged\n");
  const victimBefore = snapshotTree(targetSymlinkVictimRoot);
  fs.symlinkSync(victimPath, path.join(targetSymlinkRoot, "agents", "sample-agent.md"));
  for (const args of [["--check"], []]) {
    const result = runGenerator(targetSymlinkRoot, ...args);
    assert.notEqual(result.status, 0, "target symlink must be rejected");
    assert.match(result.stderr, /agents\/sample-agent\.md: symbolic link is not allowed/);
    assert.deepEqual(snapshotTree(targetSymlinkVictimRoot), victimBefore);
  }
} finally {
  fs.rmSync(targetSymlinkRoot, { recursive: true, force: true });
  fs.rmSync(targetSymlinkVictimRoot, { recursive: true, force: true });
}

const agentsSymlinkRoot = createFixture();
const agentsSymlinkVictimRoot = fs.mkdtempSync(path.join(os.tmpdir(), "itsol-agents-victim-"));
try {
  prepareFrozenFixture(agentsSymlinkRoot);
  fs.rmSync(path.join(agentsSymlinkRoot, "agents"), { recursive: true });
  fs.writeFileSync(path.join(agentsSymlinkVictimRoot, "marker"), "victim tree\n");
  const victimBefore = snapshotTree(agentsSymlinkVictimRoot);
  fs.symlinkSync(agentsSymlinkVictimRoot, path.join(agentsSymlinkRoot, "agents"));
  for (const args of [["--check"], []]) {
    const result = runGenerator(agentsSymlinkRoot, ...args);
    assert.notEqual(result.status, 0, "agents directory symlink must be rejected");
    assert.match(result.stderr, /agents: directory must not be a symbolic link/);
    assert.deepEqual(snapshotTree(agentsSymlinkVictimRoot), victimBefore);
  }
} finally {
  fs.rmSync(agentsSymlinkRoot, { recursive: true, force: true });
  fs.rmSync(agentsSymlinkVictimRoot, { recursive: true, force: true });
}

const nonregularTargetRoot = createFixture();
try {
  prepareFrozenFixture(nonregularTargetRoot);
  fs.mkdirSync(path.join(nonregularTargetRoot, "agents", "sample-agent.md"));
  for (const args of [["--check"], []]) {
    const result = runGenerator(nonregularTargetRoot, ...args);
    assert.notEqual(result.status, 0, "non-regular generated target must be rejected");
    assert.match(result.stderr, /agents\/sample-agent\.md: existing target must be a regular file/);
  }
} finally {
  fs.rmSync(nonregularTargetRoot, { recursive: true, force: true });
}

const sourceSymlinkRoot = createFixture();
const sourceSymlinkVictimRoot = fs.mkdtempSync(path.join(os.tmpdir(), "itsol-source-victim-"));
try {
  prepareFrozenFixture(sourceSymlinkRoot);
  const sourcePath = path.join(sourceSymlinkRoot, "scripts", "agent-sources", "sample-agent.md");
  const victimPath = path.join(sourceSymlinkVictimRoot, "sample-agent.md");
  fs.renameSync(sourcePath, victimPath);
  const victimBefore = snapshotTree(sourceSymlinkVictimRoot);
  fs.symlinkSync(victimPath, sourcePath);
  for (const args of [["--check"], []]) {
    const result = runGenerator(sourceSymlinkRoot, ...args);
    assert.notEqual(result.status, 0, "source symlink must be rejected");
    assert.match(result.stderr, /scripts\/agent-sources\/sample-agent\.md: symbolic link is not allowed/);
    assert.deepEqual(snapshotTree(sourceSymlinkVictimRoot), victimBefore);
  }
} finally {
  fs.rmSync(sourceSymlinkRoot, { recursive: true, force: true });
  fs.rmSync(sourceSymlinkVictimRoot, { recursive: true, force: true });
}

const sourceRootSymlinkRoot = createFixture();
const sourceRootSymlinkVictim = fs.mkdtempSync(path.join(os.tmpdir(), "itsol-source-root-victim-"));
try {
  prepareFrozenFixture(sourceRootSymlinkRoot);
  const sourceRoot = path.join(sourceRootSymlinkRoot, "scripts", "agent-sources");
  for (const entry of fs.readdirSync(sourceRoot)) {
    fs.renameSync(path.join(sourceRoot, entry), path.join(sourceRootSymlinkVictim, entry));
  }
  fs.rmSync(sourceRoot, { recursive: true });
  const victimBefore = snapshotTree(sourceRootSymlinkVictim);
  fs.symlinkSync(sourceRootSymlinkVictim, sourceRoot);
  for (const args of [["--check"], []]) {
    const result = runGenerator(sourceRootSymlinkRoot, ...args);
    assert.notEqual(result.status, 0, "source root symlink must be rejected");
    assert.match(result.stderr, /scripts\/agent-sources: directory must not be a symbolic link/);
    assert.deepEqual(snapshotTree(sourceRootSymlinkVictim), victimBefore);
  }
} finally {
  fs.rmSync(sourceRootSymlinkRoot, { recursive: true, force: true });
  fs.rmSync(sourceRootSymlinkVictim, { recursive: true, force: true });
}

const atomicFailureRoot = createFixture();
try {
  prepareFrozenFixture(atomicFailureRoot);
  assert.equal(runGenerator(atomicFailureRoot).status, 0);
  const generatedPath = path.join(atomicFailureRoot, "agents", "sample-agent.md");
  const inventoryPath = path.join(
    atomicFailureRoot,
    "scripts",
    "agent-sources",
    BASELINE_INVENTORY_FILE,
  );
  const generatedBefore = statRecord(generatedPath);
  const inventoryBefore = statRecord(inventoryPath);
  assert.throws(
    () => __testOnlyAtomicWriteAgentFile({
      pluginRoot: atomicFailureRoot,
      filename: "sample-agent.md",
      content: "must never replace generated output\n",
      testHooks: {
        afterOpen: () => {
          throw new Error("induced atomic write failure");
        },
      },
    }),
    /induced atomic write failure/,
  );
  assert.deepEqual(statRecord(generatedPath), generatedBefore);
  assert.deepEqual(statRecord(inventoryPath), inventoryBefore);
  assert.deepEqual(
    fs.readdirSync(path.join(atomicFailureRoot, "agents")),
    ["sample-agent.md"],
    "induced failure must clean its unique temporary file",
  );
} finally {
  fs.rmSync(atomicFailureRoot, { recursive: true, force: true });
}

const runTempSubstitutionFixture = (kind) => {
  const root = createFixture();
  const victimRoot = fs.mkdtempSync(path.join(os.tmpdir(), "itsol-temp-swap-victim-"));
  try {
    prepareFrozenFixture(root);
    assert.equal(runGenerator(root).status, 0);
    const generatedPath = path.join(root, "agents", "sample-agent.md");
    const generatedBefore = statRecord(generatedPath);
    const victimPath = path.join(victimRoot, "victim.md");
    fs.writeFileSync(victimPath, "victim must remain unchanged\n");
    const victimBefore = statRecord(victimPath);
    let activeTemp;
    let displacedTemp;

    assert.throws(
      () => __testOnlyAtomicWriteAgentFile({
        pluginRoot: root,
        filename: "sample-agent.md",
        content: "must never replace generated output\n",
        testHooks: {
          beforeRename: (temporary) => {
            activeTemp = temporary;
            displacedTemp = `${temporary}.displaced`;
            fs.renameSync(temporary, displacedTemp);
            if (kind === "symlink") {
              fs.symlinkSync(victimPath, temporary);
            } else {
              fs.writeFileSync(temporary, "attacker substituted regular file\n");
            }
          },
        },
      }),
      /agents\/sample-agent\.md: temporary file identity changed before rename/,
    );

    assert.deepEqual(statRecord(generatedPath), generatedBefore);
    assert.deepEqual(statRecord(victimPath), victimBefore);
    assert.equal(fs.lstatSync(displacedTemp).isFile(), true);
    if (kind === "symlink") {
      assert.equal(fs.lstatSync(activeTemp).isSymbolicLink(), true);
      assert.equal(fs.readlinkSync(activeTemp), victimPath);
    } else {
      assert.equal(fs.lstatSync(activeTemp).isFile(), true);
      assert.equal(fs.readFileSync(activeTemp, "utf8"), "attacker substituted regular file\n");
    }
    assert.equal(fs.readFileSync(generatedPath, "utf8"), expectedSampleAgent);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(victimRoot, { recursive: true, force: true });
  }
};

runTempSubstitutionFixture("symlink");
runTempSubstitutionFixture("regular");

const sourceContracts = loadAgentSources(pluginRoot);
const runtimeFiles = discoverRuntimeAgentFiles(pluginRoot);
assert.equal(sourceContracts.length, 113);
assert.equal(runtimeFiles.length, 113);
assert.deepEqual(
  Object.fromEntries(
    [...sourceContracts.reduce(
      (counts, contract) => counts.set(contract.template, (counts.get(contract.template) ?? 0) + 1),
      new Map(),
    )].sort(),
  ),
  { custom: 64, specialist: 49 },
);
assert.deepEqual(
  Object.fromEntries(
    [...sourceContracts.reduce(
      (counts, contract) => counts.set(
        contract.responseStyle,
        (counts.get(contract.responseStyle) ?? 0) + 1,
      ),
      new Map(),
    )].sort(),
  ),
  { compact: 1, standard: 112 },
);
assert.deepEqual(
  Object.fromEntries(
    [...sourceContracts.reduce(
      (counts, contract) => counts.set(contract.tools, (counts.get(contract.tools) ?? 0) + 1),
      new Map(),
    )].sort(),
  ),
  {
    "Read, Grep, Glob": 7,
    "Read, Grep, Glob, Bash": 55,
    "Read, Grep, Glob, Bash, WebFetch, WebSearch": 4,
    "Read, Grep, Glob, Bash, Write, Edit, MultiEdit": 46,
    "Read, Grep, Glob, Bash, Write, Edit, WebFetch, WebSearch": 1,
  },
);
assert.ok(
  sourceContracts.every((contract) => !runtimeFiles.includes(path.join("scripts", "agent-sources", `${contract.name}.md`))),
  "agent sources must stay outside direct-child runtime discovery",
);

const productionCheck = runGenerator(pluginRoot, "--check");
assert.equal(productionCheck.status, 0, productionCheck.stderr);

const baselineInventory = JSON.parse(
  fs.readFileSync(path.join(pluginRoot, "scripts", "agent-sources", BASELINE_INVENTORY_FILE), "utf8"),
);
const semanticMismatches = [];
const rawMismatches = [];
for (const filename of runtimeFiles) {
  const generatedBytes = fs.readFileSync(path.join(pluginRoot, "agents", filename), "utf8");
  const generatedContract = parseGeneratedAgent(generatedBytes, `agents/${filename}`);
  const baseline = baselineInventory.agents[filename];
  if (semanticHash(generatedContract) !== baseline.semantic_sha256) semanticMismatches.push(filename);
  if (sha256(generatedBytes) !== baseline.raw_sha256) rawMismatches.push(filename);
}
assert.deepEqual(semanticMismatches, []);
assert.deepEqual(rawMismatches, []);

console.log(
  `agent-contract generation: PASS (${sourceContracts.length} agents; semantic parity 113/113; raw parity 113/113)`,
);
