import { createHash } from "node:crypto";
import { access, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { auditContext, stableJson } from "./context-audit.mjs";

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function requireNonEmptyFile(pluginRoot, relativePath) {
  const absolutePath = path.join(pluginRoot, relativePath);
  let fileStat;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    throw new Error(`structural failure: missing essential file ${relativePath}`);
  }
  if (!fileStat.isFile()) {
    throw new Error(`structural failure: essential path is not a file ${relativePath}`);
  }
  const contents = await readFile(absolutePath, "utf8");
  if (contents.trim().length === 0) {
    throw new Error(`structural failure: essential file is empty ${relativePath}`);
  }
  return contents;
}

export async function validateTargetStructure(pluginRoot) {
  let rootStat;
  try {
    rootStat = await stat(pluginRoot);
  } catch {
    throw new Error(`structural failure: plugin root does not exist ${pluginRoot}`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`structural failure: plugin root is not a directory ${pluginRoot}`);
  }
  for (const relativePath of [
    "hooks/bootstrap-context.md",
    "hooks/bootstrap-context-claude.md",
    "hooks/bootstrap-context-codex.md",
    "hooks/bootstrap-context-pi.md",
    "skills/using-itsolpowers/SKILL.md",
  ]) {
    await requireNonEmptyFile(pluginRoot, relativePath);
  }
  const hookEntries = await readdir(path.join(pluginRoot, "hooks"));
  const adapterBootstraps = hookEntries
    .filter((name) => /^bootstrap-context-.+\.md$/.test(name))
    .sort();
  if (
    JSON.stringify(adapterBootstraps) !==
    JSON.stringify([
      "bootstrap-context-claude.md",
      "bootstrap-context-codex.md",
      "bootstrap-context-pi.md",
    ])
  ) {
    throw new Error(
      `structural failure: expected exactly three adapter bootstraps; got ${adapterBootstraps.join(", ")}`,
    );
  }
  const skillEntries = await readdir(path.join(pluginRoot, "skills"), {
    withFileTypes: true,
  });
  if (!skillEntries.some((entry) => entry.isDirectory())) {
    throw new Error("structural failure: skills directory has no skill directories");
  }
  const agentEntries = await readdir(path.join(pluginRoot, "agents"), {
    withFileTypes: true,
  });
  if (
    !agentEntries.some(
      (entry) => entry.isFile() && entry.name.endsWith(".md"),
    )
  ) {
    throw new Error("structural failure: agents directory has no Markdown agents");
  }
  const codexManifestText = await requireNonEmptyFile(
    pluginRoot,
    ".codex-plugin/plugin.json",
  );
  let codexManifest;
  try {
    codexManifest = JSON.parse(codexManifestText);
  } catch (error) {
    throw new Error(`structural failure: invalid Codex manifest: ${error.message}`);
  }
  if (
    !Array.isArray(codexManifest?.interface?.defaultPrompt) ||
    codexManifest.interface.defaultPrompt.length === 0 ||
    codexManifest.interface.defaultPrompt.some(
      (instruction) =>
        typeof instruction !== "string" || instruction.trim().length === 0,
    )
  ) {
    throw new Error(
      "structural failure: Codex defaultPrompt must be a non-empty string array",
    );
  }
}

async function hasMarkdownFile(root) {
  try {
    const entries = await readdir(root, { recursive: true, withFileTypes: true });
    return entries.some((entry) => entry.isFile() && entry.name.endsWith(".md"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

function check(id, expectation, actual, met, evidence = {}) {
  return {
    actual,
    evidence,
    expectation,
    id,
    status: met ? "met" : "unmet",
  };
}

async function profileCheck(pluginRoot) {
  const profilePath = path.join(pluginRoot, "context", "context-profiles.json");
  if (!(await exists(profilePath))) {
    return check(
      "capability-profiles",
      "frontier and compatibility profiles exist",
      "context/context-profiles.json is absent",
      false,
    );
  }
  try {
    const document = JSON.parse(await readFile(profilePath, "utf8"));
    const profiles = document.profiles ?? document;
    const profileNames = Object.keys(profiles).sort();
    const validProfiles = ["frontier", "compatibility"].every(
      (name) =>
        profiles[name] &&
        typeof profiles[name] === "object" &&
        !Array.isArray(profiles[name]) &&
        Object.keys(profiles[name]).length > 0,
    );
    return check(
      "capability-profiles",
      "frontier and compatibility profiles exist",
      profileNames,
      validProfiles,
      { path: "context/context-profiles.json" },
    );
  } catch (error) {
    throw new Error(`invalid context/context-profiles.json: ${error.message}`);
  }
}

async function canonicalAgentCheck(pluginRoot) {
  const required = [
    "scripts/lib/agent-contract.mjs",
    "scripts/generate-agent-contracts.mjs",
  ];
  const missing = [];
  for (const relativePath of required) {
    if (!(await exists(path.join(pluginRoot, relativePath)))) {
      missing.push(relativePath);
    }
  }
  const sourceRoot = path.join(pluginRoot, "scripts", "agent-sources");
  if (!(await hasMarkdownFile(sourceRoot))) {
    missing.push("scripts/agent-sources/*.md");
  }
  return check(
    "canonical-agent-contract",
    "one generator contract plus agent-specific sources exist",
    missing.length === 0 ? "present" : { missing },
    missing.length === 0,
  );
}

async function canonicalReferenceCheck(pluginRoot) {
  const sharedRoot = path.join(pluginRoot, "skills", "_shared", "references");
  const exceptionsPath = path.join(
    pluginRoot,
    "evals",
    "canonical-reference-exceptions.json",
  );
  const sharedReferences = await hasMarkdownFile(sharedRoot);
  const exceptionManifest = await exists(exceptionsPath);
  return check(
    "canonical-reference-architecture",
    "shared canonical references and an exception manifest exist",
    {
      exception_manifest: exceptionManifest,
      shared_references: sharedReferences,
    },
    sharedReferences && exceptionManifest,
  );
}

export async function evaluateTargetArchitecture({ pluginRoot, revision }) {
  if (!pluginRoot || !revision) {
    throw new Error(
      "target architecture evaluation requires explicit pluginRoot and revision",
    );
  }
  await validateTargetStructure(pluginRoot);
  const audit = await auditContext({ pluginRoot, revision });
  if (
    audit.metrics.bootstrap.file_count !== 1 ||
    audit.metrics.adapters.file_count !== 3 ||
    audit.metrics.router.file_count !== 1 ||
    audit.metrics.router_guide.file_count > 1 ||
    audit.metrics.codex_default_prompt.file_count === 0
  ) {
    throw new Error(
      "structural failure: audit inventory does not contain the required context surfaces",
    );
  }
  const checks = [
    check(
      "bootstrap-budget",
      "<= 180 words",
      audit.metrics.bootstrap.word_count,
      audit.metrics.bootstrap.word_count <= 180,
      { paths: audit.metrics.bootstrap.files.map((file) => file.path) },
    ),
    check(
      "router-budget",
      "<= 800 words",
      audit.metrics.router.word_count,
      audit.metrics.router.word_count <= 800,
      { paths: audit.metrics.router.files.map((file) => file.path) },
    ),
    check(
      "router-guide-budget",
      "absent or <= 300 words",
      audit.metrics.router_guide.word_count,
      audit.metrics.router_guide.file_count === 0 ||
        audit.metrics.router_guide.word_count <= 300,
      { paths: audit.metrics.router_guide.files.map((file) => file.path) },
    ),
    check(
      "codex-default-prompt-budget",
      "<= 5 instructions",
      audit.metrics.codex_default_prompt.instruction_count,
      audit.metrics.codex_default_prompt.instruction_count <= 5,
      { path: ".codex-plugin/plugin.json#/interface/defaultPrompt" },
    ),
    await profileCheck(pluginRoot),
    await canonicalAgentCheck(pluginRoot),
    await canonicalReferenceCheck(pluginRoot),
  ];
  const unmetCount = checks.filter((item) => item.status === "unmet").length;
  return {
    checks,
    report_schema_version: "1.0.0",
    revision,
    status: unmetCount === 0 ? "satisfied" : "expected-red",
    summary: {
      met: checks.length - unmetCount,
      tooling_failures: 0,
      total: checks.length,
      unmet: unmetCount,
    },
  };
}

function parseArguments(argumentsList, defaults) {
  const options = {
    baselineSnapshot: false,
    evalRoot: defaults.evalRoot,
    only: null,
    output: null,
    pluginRoot: defaults.pluginRoot,
    revision: "working-tree",
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--plugin-root") {
      options.pluginRoot = path.resolve(argumentsList[++index]);
    } else if (argument === "--revision") {
      options.revision = argumentsList[++index];
    } else if (argument === "--output") {
      options.output = path.resolve(argumentsList[++index]);
    } else if (argument === "--baseline-snapshot") {
      options.baselineSnapshot = true;
    } else if (argument === "--eval-root") {
      options.evalRoot = path.resolve(argumentsList[++index]);
    } else if (argument === "--only") {
      options.only = argumentsList[++index];
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function verifyStoredBaselineReport({ evalRoot, report }) {
  const manifestPath = path.join(evalRoot, "baseline-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const key of ["target_red_path", "target_red_sha256"]) {
    if (typeof manifest[key] !== "string" || manifest[key].length === 0) {
      throw new Error(`baseline snapshot manifest missing ${key}`);
    }
  }
  if (report.revision !== manifest.repository_revision) {
    throw new Error(
      `baseline snapshot revision mismatch: ${report.revision} != ${manifest.repository_revision}`,
    );
  }
  if (report.status !== "expected-red" || report.summary.tooling_failures !== 0) {
    throw new Error("baseline snapshot must be a clean expected-red report");
  }
  const storedPath = path.join(evalRoot, manifest.target_red_path);
  const storedBytes = await readFile(storedPath);
  if (sha256(storedBytes) !== manifest.target_red_sha256) {
    throw new Error("baseline target RED snapshot hash changed");
  }
  const generated = stableJson(report);
  if (storedBytes.toString("utf8") !== generated) {
    throw new Error("baseline target RED snapshot drifted from generated report");
  }
}

export async function runTargetArchitectureCli(argumentsList) {
  const libraryPath = fileURLToPath(import.meta.url);
  const defaultPluginRoot = path.resolve(path.dirname(libraryPath), "../..");
  try {
    const options = parseArguments(argumentsList, {
      evalRoot: path.join(defaultPluginRoot, "evals"),
      pluginRoot: defaultPluginRoot,
    });
    let report = await evaluateTargetArchitecture(options);
    if (options.only === "profiles") {
      const checks = report.checks.filter(
        (item) => item.id === "capability-profiles",
      );
      const unmet = checks.filter((item) => item.status === "unmet").length;
      report = {
        ...report,
        checks,
        status: unmet === 0 ? "satisfied" : "expected-red",
        summary: {
          met: checks.length - unmet,
          tooling_failures: 0,
          total: checks.length,
          unmet,
        },
      };
    } else if (options.only !== null) {
      throw new Error(`unknown --only target: ${options.only}`);
    }
    const output = stableJson(report);
    if (options.baselineSnapshot) {
      if (options.only !== null) {
        throw new Error("--baseline-snapshot does not support --only");
      }
      await verifyStoredBaselineReport({
        evalRoot: options.evalRoot,
        report,
      });
    }
    if (options.output) {
      await writeFile(options.output, output);
    }
    process.stdout.write(output);
    if (options.baselineSnapshot) return 0;
    return report.status === "satisfied" ? 0 : 1;
  } catch (error) {
    const failure = {
      error: error.message,
      report_schema_version: "1.0.0",
      status: "tooling-failure",
      summary: {
        met: 0,
        tooling_failures: 1,
        total: 0,
        unmet: 0,
      },
    };
    console.error(stableJson(failure).trimEnd());
    return 2;
  }
}
