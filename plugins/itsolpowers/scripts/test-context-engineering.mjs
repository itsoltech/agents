#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateTargetArchitecture,
  runTargetArchitectureCli,
  verifyStoredBaselineReport,
} from "./lib/context-target-architecture.mjs";

async function writeFixture(root, relativePath, contents) {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents);
}

async function runSelfTest() {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "itsol-target-architecture-"),
  );
  try {
    const emptyRoot = path.join(temporaryRoot, "empty");
    await mkdir(emptyRoot);
    await assert.rejects(
      () =>
        evaluateTargetArchitecture({
          pluginRoot: emptyRoot,
          revision: "empty",
        }),
      /structural failure: missing essential file/,
    );

    const fixtureRoot = path.join(temporaryRoot, "fixture");
    for (const relativePath of [
      "hooks/bootstrap-context.md",
      "hooks/bootstrap-context-claude.md",
      "hooks/bootstrap-context-codex.md",
      "hooks/bootstrap-context-pi.md",
    ]) {
      await writeFixture(fixtureRoot, relativePath, "fixture context\n");
    }
    await writeFixture(
      fixtureRoot,
      "skills/using-itsolpowers/SKILL.md",
      "---\nname: using-itsolpowers\ndescription: fixture\n---\nrouter\n",
    );
    await writeFixture(
      fixtureRoot,
      "skills/using-itsolpowers/references/guide.md",
      "fixture guide\n",
    );
    await writeFixture(fixtureRoot, "agents/sample.md", "fixture agent\n");
    await writeFixture(
      fixtureRoot,
      ".codex-plugin/plugin.json",
      JSON.stringify({ interface: { defaultPrompt: ["fixture instruction"] } }),
    );
    const fixtureReport = await evaluateTargetArchitecture({
      pluginRoot: fixtureRoot,
      revision: "fixture",
    });
    assert.equal(fixtureReport.status, "expected-red");

    await rm(
      path.join(fixtureRoot, "skills/using-itsolpowers/SKILL.md"),
    );
    await assert.rejects(
      () =>
        evaluateTargetArchitecture({
          pluginRoot: fixtureRoot,
          revision: "fixture-deletion",
        }),
      /structural failure: missing essential file skills\/using-itsolpowers\/SKILL\.md/,
    );

    const scriptRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
    );
    const evalRoot = path.join(scriptRoot, "evals");
    const storedReport = JSON.parse(
      await readFile(
        path.join(evalRoot, "baselines/0.23.0-target-red.json"),
        "utf8",
      ),
    );
    await verifyStoredBaselineReport({ evalRoot, report: storedReport });

    const driftedReport = structuredClone(storedReport);
    driftedReport.checks[0].actual += 1;
    await assert.rejects(
      () =>
        verifyStoredBaselineReport({
          evalRoot,
          report: driftedReport,
        }),
      /snapshot drifted/,
    );

    const corruptEvalRoot = path.join(temporaryRoot, "corrupt-evals");
    await mkdir(path.join(corruptEvalRoot, "baselines"), { recursive: true });
    await writeFile(
      path.join(corruptEvalRoot, "baseline-manifest.json"),
      await readFile(path.join(evalRoot, "baseline-manifest.json")),
    );
    await writeFile(
      path.join(corruptEvalRoot, "baselines/0.23.0-target-red.json"),
      '{"corrupt":true}\n',
    );
    await assert.rejects(
      () =>
        verifyStoredBaselineReport({
          evalRoot: corruptEvalRoot,
          report: storedReport,
        }),
      /snapshot hash changed/,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
  console.log("context target architecture fixtures: PASS");
}

if (process.argv.includes("--self-test")) {
  await runSelfTest();
} else {
  process.exitCode = await runTargetArchitectureCli(process.argv.slice(2));
}
