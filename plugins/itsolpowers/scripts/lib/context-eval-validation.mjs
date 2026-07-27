import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileJsonSchema } from "./context-json-schema.mjs";

const ADAPTERS = new Set(["claude", "codex", "opencode", "pi"]);
const PROFILES = new Set(["frontier", "compatibility"]);
const SETS = new Set(["development", "acceptance", "challenge"]);
const CATEGORIES = new Set([
  "administration",
  "governed",
  "autonomous",
  "direct",
  "implementation",
  "bug",
  "review",
  "migration",
  "browser-qa",
  "security",
  "data",
  "infra",
  "protected-action",
  "honest-status",
  "delegation-safety",
]);
const WORKFLOW_REQUIREMENTS = new Set([
  "none",
  "governed",
  "autonomous-planned",
  "direct",
]);
const DELEGATION_VALUES = new Set(["none", "inline", "subagents", "auto"]);
const HIDDEN_REASONING_KEYS = new Set([
  "analysis",
  "chain_of_thought",
  "hidden_reasoning",
  "reasoning",
  "thoughts",
]);
const CORPUS_KEYS = [
  "schema_version",
  "corpus_version",
  "set",
  "frozen",
  "cases",
];
const CASE_KEYS = [
  "case_id",
  "prompt",
  "adapter",
  "context_profile",
  "category",
  "critical",
  "expected",
  "budget",
];
const EXPECTED_KEYS = [
  "primary_process_skill",
  "domain_skills",
  "forbidden_skills",
  "workflow_requirement",
  "execution_policy_requirement",
  "delegation",
  "protected_constraints",
];
const BUDGET_KEYS = [
  "max_bootstrap_words",
  "max_router_words",
  "max_initial_skills",
];
const RESULT_KEYS = [
  "schema_version",
  "result_id",
  "repo_revision",
  "corpus",
  "model",
  "public_routing_output",
  "selections",
  "usage",
  "segment_results",
  "case_results",
  "repetitions",
  "pass_fail_reasons",
];

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value, requiredKeys, label) {
  invariant(isObject(value), `${label} must be an object`);
  const actualKeys = Object.keys(value);
  const missing = requiredKeys.filter((key) => !actualKeys.includes(key));
  const unknown = actualKeys.filter((key) => !requiredKeys.includes(key));
  invariant(missing.length === 0, `${label} missing fields: ${missing.join(", ")}`);
  invariant(unknown.length === 0, `${label} unknown fields: ${unknown.join(", ")}`);
}

function assertString(value, label, { min = 1, max = Infinity } = {}) {
  invariant(typeof value === "string", `${label} must be a string`);
  invariant(
    value.length >= min && value.length <= max,
    `${label} length must be between ${min} and ${max}`,
  );
}

function assertStringArray(
  value,
  label,
  { max = Infinity, allowEmpty = true } = {},
) {
  invariant(Array.isArray(value), `${label} must be an array`);
  invariant(value.length <= max, `${label} exceeds maximum length ${max}`);
  invariant(allowEmpty || value.length > 0, `${label} must not be empty`);
  const seen = new Set();
  for (const item of value) {
    assertString(item, `${label} item`);
    invariant(!seen.has(item), `${label} contains duplicate value: ${item}`);
    seen.add(item);
  }
}

function assertInteger(value, label, minimum, maximum = Infinity) {
  invariant(Number.isInteger(value), `${label} must be an integer`);
  invariant(
    value >= minimum && value <= maximum,
    `${label} must be between ${minimum} and ${maximum}`,
  );
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${filePath}: invalid JSON: ${error.message}`);
  }
}

async function loadSchemaValidators(evalRoot) {
  const caseSchema = await readJson(
    path.join(evalRoot, "schemas", "context-eval-case.schema.json"),
  );
  const resultSchema = await readJson(
    path.join(evalRoot, "schemas", "model-result.schema.json"),
  );
  return {
    caseSchema,
    resultSchema,
    validateCaseSchema: compileJsonSchema(caseSchema, "context eval case schema"),
    validateResultSchema: compileJsonSchema(resultSchema, "model result schema"),
  };
}

function hashBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function discoverSkills(pluginRoot) {
  const skillsRoot = path.join(pluginRoot, "skills");
  const entries = await readdir(skillsRoot, { withFileTypes: true });
  return new Set(
    entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name),
  );
}

export function validateEvalCase(evaluationCase, { knownSkills }) {
  const label = `case ${evaluationCase?.case_id ?? "<unknown>"}`;
  assertExactKeys(evaluationCase, CASE_KEYS, label);
  assertString(evaluationCase.case_id, `${label}.case_id`, { min: 3, max: 80 });
  invariant(
    /^[a-z0-9][a-z0-9-]+$/.test(evaluationCase.case_id),
    `${label}.case_id has invalid format`,
  );
  assertString(evaluationCase.prompt, `${label}.prompt`, { min: 1, max: 1200 });
  invariant(
    ADAPTERS.has(evaluationCase.adapter),
    `${label} unknown adapter: ${evaluationCase.adapter}`,
  );
  invariant(
    PROFILES.has(evaluationCase.context_profile),
    `${label} unknown profile: ${evaluationCase.context_profile}`,
  );
  invariant(
    CATEGORIES.has(evaluationCase.category),
    `${label} unknown category: ${evaluationCase.category}`,
  );
  invariant(typeof evaluationCase.critical === "boolean", `${label}.critical must be boolean`);

  assertExactKeys(evaluationCase.expected, EXPECTED_KEYS, `${label}.expected`);
  const primary = evaluationCase.expected.primary_process_skill;
  invariant(
    primary === null || typeof primary === "string",
    `${label}.expected.primary_process_skill must be string or null`,
  );
  assertStringArray(
    evaluationCase.expected.domain_skills,
    `${label}.expected.domain_skills`,
    { max: 6 },
  );
  assertStringArray(
    evaluationCase.expected.forbidden_skills,
    `${label}.expected.forbidden_skills`,
    { max: 8 },
  );
  assertStringArray(
    evaluationCase.expected.protected_constraints,
    `${label}.expected.protected_constraints`,
    { max: 6 },
  );
  for (const constraint of evaluationCase.expected.protected_constraints) {
    invariant(
      constraint.length <= 160,
      `${label}.expected.protected_constraints item exceeds 160 characters`,
    );
  }
  invariant(
    WORKFLOW_REQUIREMENTS.has(evaluationCase.expected.workflow_requirement),
    `${label} unknown workflow requirement: ${evaluationCase.expected.workflow_requirement}`,
  );
  invariant(
    ["none", "required"].includes(
      evaluationCase.expected.execution_policy_requirement,
    ),
    `${label} invalid execution policy requirement`,
  );
  invariant(
    DELEGATION_VALUES.has(evaluationCase.expected.delegation),
    `${label} invalid delegation expectation`,
  );

  const selectedSkills = [
    ...(primary === null ? [] : [primary]),
    ...evaluationCase.expected.domain_skills,
  ];
  for (const skill of [
    ...selectedSkills,
    ...evaluationCase.expected.forbidden_skills,
  ]) {
    invariant(knownSkills.has(skill), `${label} unknown skill: ${skill}`);
  }
  const forbidden = new Set(evaluationCase.expected.forbidden_skills);
  const contradictory = selectedSkills.filter((skill) => forbidden.has(skill));
  invariant(
    contradictory.length === 0,
    `${label} contradictory expected and forbidden skills: ${contradictory.join(", ")}`,
  );

  assertExactKeys(evaluationCase.budget, BUDGET_KEYS, `${label}.budget`);
  assertInteger(
    evaluationCase.budget.max_bootstrap_words,
    `${label}.budget.max_bootstrap_words`,
    1,
    180,
  );
  assertInteger(
    evaluationCase.budget.max_router_words,
    `${label}.budget.max_router_words`,
    1,
    800,
  );
  assertInteger(
    evaluationCase.budget.max_initial_skills,
    `${label}.budget.max_initial_skills`,
    0,
    8,
  );
  invariant(
    selectedSkills.length <= evaluationCase.budget.max_initial_skills,
    `${label} selected skills exceed max_initial_skills`,
  );
}

function validateCorpusDocument(
  document,
  fileName,
  knownSkills,
  validateCaseSchema,
) {
  assertExactKeys(document, CORPUS_KEYS, `corpus ${fileName}`);
  invariant(document.schema_version === "1.0.0", `${fileName} schema_version must be 1.0.0`);
  assertString(document.corpus_version, `${fileName}.corpus_version`);
  invariant(SETS.has(document.set), `${fileName} unknown corpus set: ${document.set}`);
  invariant(
    document.set === path.basename(fileName, ".json"),
    `${fileName} set does not match its filename`,
  );
  invariant(typeof document.frozen === "boolean", `${fileName}.frozen must be boolean`);
  invariant(
    document.frozen === (document.set !== "development"),
    `${fileName} must explicitly use frozen=false only for development`,
  );
  invariant(Array.isArray(document.cases), `${fileName}.cases must be an array`);
  invariant(document.cases.length >= 1, `${fileName}.cases must not be empty`);
  invariant(document.cases.length <= 100, `${fileName}.cases exceeds bound 100`);
  for (const evaluationCase of document.cases) {
    validateCaseSchema(evaluationCase, `corpus ${fileName} case`);
    validateEvalCase(evaluationCase, { knownSkills });
  }
}

export function validateCoverage(documents) {
  const cases = documents.flatMap((document) => document.cases);
  const frozenCases = documents
    .filter((document) => document.frozen === true)
    .flatMap((document) => document.cases);
  const adapters = new Set(cases.map((evaluationCase) => evaluationCase.adapter));
  const profiles = new Set(
    cases.map((evaluationCase) => evaluationCase.context_profile),
  );
  const categories = new Set(
    cases.map((evaluationCase) => evaluationCase.category),
  );
  const workflows = new Set(
    cases.map((evaluationCase) => evaluationCase.expected.workflow_requirement),
  );

  for (const adapter of ADAPTERS) {
    invariant(adapters.has(adapter), `corpus coverage missing adapter: ${adapter}`);
  }
  for (const profile of PROFILES) {
    invariant(profiles.has(profile), `corpus coverage missing profile: ${profile}`);
  }
  invariant(
    frozenCases.some(
      (evaluationCase) =>
        evaluationCase.critical &&
        evaluationCase.category === "honest-status",
    ),
    "corpus coverage missing critical honest partial-status case",
  );
  invariant(
    frozenCases.some(
      (evaluationCase) =>
        evaluationCase.critical &&
        evaluationCase.category === "delegation-safety",
    ),
    "corpus coverage missing critical nested-delegation prohibition case",
  );
  for (const category of CATEGORIES) {
    invariant(categories.has(category), `corpus coverage missing category: ${category}`);
  }
  for (const workflow of ["governed", "autonomous-planned", "direct"]) {
    invariant(workflows.has(workflow), `corpus coverage missing workflow: ${workflow}`);
  }
  invariant(
    cases.some(
      (evaluationCase) =>
        evaluationCase.critical &&
        evaluationCase.expected.workflow_requirement !== "none",
    ),
    "corpus coverage missing critical workflow case",
  );
  invariant(
    cases.some(
      (evaluationCase) =>
        evaluationCase.critical &&
        evaluationCase.expected.protected_constraints.length > 0,
    ),
    "corpus coverage missing critical protected-action case",
  );
}

export async function computeFrozenManifest(evalRoot) {
  const paths = ["corpus/acceptance.json", "corpus/challenge.json"];
  const files = [];
  let corpusVersion = null;
  for (const relativePath of paths) {
    const bytes = await readFile(path.join(evalRoot, relativePath));
    const document = JSON.parse(bytes);
    corpusVersion ??= document.corpus_version;
    invariant(
      document.corpus_version === corpusVersion,
      "frozen corpus versions must match",
    );
    files.push({
      case_count: document.cases.length,
      path: relativePath,
      sha256: hashBytes(bytes),
    });
  }
  const aggregate = files.map((file) => `${file.path}:${file.sha256}`).join("\n");
  return {
    corpus_version: corpusVersion,
    files,
    manifest_sha256: hashBytes(aggregate),
    manifest_version: "1.0.0",
  };
}

export async function validateFrozenManifest(evalRoot) {
  const recorded = await readJson(path.join(evalRoot, "frozen-manifest.json"));
  assertExactKeys(
    recorded,
    ["manifest_version", "corpus_version", "manifest_sha256", "files"],
    "frozen manifest",
  );
  const computed = await computeFrozenManifest(evalRoot);
  assertFrozenManifestMatches(recorded, computed);
  return computed;
}

function assertFrozenManifestMatches(recorded, computed) {
  invariant(
    JSON.stringify(recorded) === JSON.stringify(computed),
    `changed frozen-manifest hash: expected ${recorded.manifest_sha256}, computed ${computed.manifest_sha256}`,
  );
}

export async function validateBaselineManifest(evalRoot) {
  const manifest = await readJson(path.join(evalRoot, "baseline-manifest.json"));
  assertExactKeys(
    manifest,
    [
      "baseline_path",
      "baseline_sha256",
      "manifest_version",
      "package_version",
      "repository_revision",
      "target_red_path",
      "target_red_sha256",
    ],
    "baseline manifest",
  );
  invariant(
    manifest.manifest_version === "1.0.0",
    "baseline manifest version must be 1.0.0",
  );
  invariant(
    manifest.baseline_path === "baselines/0.23.0.json",
    "baseline manifest path must be baselines/0.23.0.json",
  );
  const baselineBytes = await readFile(path.join(evalRoot, manifest.baseline_path));
  invariant(
    hashBytes(baselineBytes) === manifest.baseline_sha256,
    "immutable baseline hash changed",
  );
  const baseline = JSON.parse(baselineBytes);
  invariant(baseline.immutable === true, "baseline must be marked immutable");
  invariant(
    baseline.package_version === manifest.package_version,
    "baseline package version differs from manifest",
  );
  invariant(
    baseline.repository_revision === manifest.repository_revision,
    "baseline revision differs from manifest",
  );
  const targetRedBytes = await readFile(path.join(evalRoot, manifest.target_red_path));
  invariant(
    hashBytes(targetRedBytes) === manifest.target_red_sha256,
    "baseline target RED snapshot hash changed",
  );
  const targetRed = JSON.parse(targetRedBytes);
  invariant(
    targetRed.revision === manifest.repository_revision,
    "baseline target RED revision differs from manifest",
  );
  invariant(
    targetRed.status === "expected-red" &&
      targetRed.summary?.tooling_failures === 0,
    "baseline target RED snapshot must record clean expected-red",
  );
  return manifest;
}

export async function validateContextCorpus({ evalRoot, pluginRoot }) {
  const knownSkills = await discoverSkills(pluginRoot);
  const { validateCaseSchema } = await loadSchemaValidators(evalRoot);
  const fileNames = ["development.json", "acceptance.json", "challenge.json"];
  const documents = [];
  const seenCaseIds = new Set();
  let corpusVersion = null;
  for (const fileName of fileNames) {
    const document = await readJson(path.join(evalRoot, "corpus", fileName));
    validateCorpusDocument(
      document,
      fileName,
      knownSkills,
      validateCaseSchema,
    );
    corpusVersion ??= document.corpus_version;
    invariant(
      document.corpus_version === corpusVersion,
      `${fileName} corpus_version differs from ${corpusVersion}`,
    );
    for (const evaluationCase of document.cases) {
      invariant(
        !seenCaseIds.has(evaluationCase.case_id),
        `duplicate case_id: ${evaluationCase.case_id}`,
      );
      seenCaseIds.add(evaluationCase.case_id);
    }
    documents.push(document);
  }
  validateCoverage(documents);
  const manifest = await validateFrozenManifest(evalRoot);
  const baselineManifest = await validateBaselineManifest(evalRoot);
  return {
    adapters: [...ADAPTERS].sort(),
    baseline_revision: baselineManifest.repository_revision,
    baseline_sha256: baselineManifest.baseline_sha256,
    case_count: seenCaseIds.size,
    corpus_version: corpusVersion,
    frozen_manifest_sha256: manifest.manifest_sha256,
    profiles: [...PROFILES].sort(),
    sets: documents.map((document) => ({
      case_count: document.cases.length,
      frozen: document.frozen,
      set: document.set,
    })),
  };
}

function assertNoHiddenReasoning(value, location = "result") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoHiddenReasoning(item, `${location}[${index}]`),
    );
    return;
  }
  if (!isObject(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    invariant(
      !HIDDEN_REASONING_KEYS.has(key.toLowerCase()),
      `${location} contains forbidden hidden-reasoning field: ${key}`,
    );
    assertNoHiddenReasoning(child, `${location}.${key}`);
  }
}

function validateSelections(selections, label, knownSkills) {
  assertExactKeys(
    selections,
    ["primary_process_skill", "domain_skills", "tools"],
    label,
  );
  invariant(
    selections.primary_process_skill === null ||
      typeof selections.primary_process_skill === "string",
    `${label}.primary_process_skill must be string or null`,
  );
  assertStringArray(selections.domain_skills, `${label}.domain_skills`, { max: 12 });
  assertStringArray(selections.tools, `${label}.tools`, { max: 30 });
  for (const skill of [
    ...(selections.primary_process_skill === null
      ? []
      : [selections.primary_process_skill]),
    ...selections.domain_skills,
  ]) {
    invariant(knownSkills.has(skill), `${label} unknown selected skill: ${skill}`);
  }
}

function validateUsage(usage, label) {
  assertExactKeys(
    usage,
    ["input_tokens", "output_tokens", "total_tokens"],
    label,
  );
  assertInteger(usage.input_tokens, `${label}.input_tokens`, 0);
  assertInteger(usage.output_tokens, `${label}.output_tokens`, 0);
  assertInteger(usage.total_tokens, `${label}.total_tokens`, 0);
  invariant(
    usage.total_tokens === usage.input_tokens + usage.output_tokens,
    `${label}.total_tokens must equal input_tokens + output_tokens`,
  );
}

export async function validateModelResult({
  evalRoot,
  pluginRoot,
  result,
}) {
  const { validateResultSchema } = await loadSchemaValidators(evalRoot);
  validateResultSchema(result, "model result");
  assertNoHiddenReasoning(result);
  assertExactKeys(result, RESULT_KEYS, "model result");
  invariant(result.schema_version === "1.0.0", "model result schema_version must be 1.0.0");
  assertString(result.result_id, "model result.result_id");
  invariant(
    typeof result.repo_revision === "string" &&
      /^[0-9a-f]{7,64}$/.test(result.repo_revision),
    "model result.repo_revision must be a Git hex revision",
  );
  assertExactKeys(result.corpus, ["version", "manifest_sha256"], "model result.corpus");
  const manifest = await validateFrozenManifest(evalRoot);
  invariant(
    result.corpus.version === manifest.corpus_version,
    "model result corpus version does not match frozen manifest",
  );
  invariant(
    result.corpus.manifest_sha256 === manifest.manifest_sha256,
    "model result corpus manifest hash does not match frozen manifest",
  );
  assertExactKeys(result.model, ["identifier", "profile"], "model result.model");
  assertString(result.model.identifier, "model result.model.identifier");
  invariant(
    PROFILES.has(result.model.profile),
    `model result unknown profile: ${result.model.profile}`,
  );
  assertString(result.public_routing_output, "model result.public_routing_output", {
    min: 0,
    max: 10000,
  });

  const knownSkills = await discoverSkills(pluginRoot);
  validateSelections(result.selections, "model result.selections", knownSkills);
  validateUsage(result.usage, "model result.usage");
  invariant(Array.isArray(result.segment_results), "model result.segment_results must be array");
  for (const [index, segment] of result.segment_results.entries()) {
    const label = `model result.segment_results[${index}]`;
    assertExactKeys(
      segment,
      ["segment", "cases", "passed", "failed", "pass_rate"],
      label,
    );
    assertString(segment.segment, `${label}.segment`);
    assertInteger(segment.cases, `${label}.cases`, 0);
    assertInteger(segment.passed, `${label}.passed`, 0);
    assertInteger(segment.failed, `${label}.failed`, 0);
    invariant(segment.cases === segment.passed + segment.failed, `${label} counts do not add up`);
    invariant(
      typeof segment.pass_rate === "number" &&
        segment.pass_rate >= 0 &&
        segment.pass_rate <= 1,
      `${label}.pass_rate must be between 0 and 1`,
    );
    const expectedRate = segment.cases === 0 ? 0 : segment.passed / segment.cases;
    invariant(
      Math.abs(segment.pass_rate - expectedRate) < 1e-9,
      `${label}.pass_rate does not match counts`,
    );
  }

  invariant(
    Array.isArray(result.case_results) && result.case_results.length > 0,
    "model result.case_results must be a non-empty array",
  );
  const frozenDocuments = await Promise.all(
    manifest.files.map((file) => readJson(path.join(evalRoot, file.path))),
  );
  const frozenCases = new Map(
    frozenDocuments.flatMap((document) =>
      document.cases.map((evaluationCase) => [
        evaluationCase.case_id,
        evaluationCase,
      ]),
    ),
  );
  const resultKeys = new Set();
  const caseResultsById = new Map();
  for (const [index, caseResult] of result.case_results.entries()) {
    const label = `model result.case_results[${index}]`;
    assertExactKeys(
      caseResult,
      [
        "case_id",
        "repetition",
        "passed",
        "public_routing_output",
        "selections",
        "usage",
        "pass_fail_reasons",
      ],
      label,
    );
    invariant(
      frozenCases.has(caseResult.case_id),
      `${label} case_id is not a frozen acceptance/challenge case: ${caseResult.case_id}`,
    );
    assertInteger(caseResult.repetition, `${label}.repetition`, 1);
    invariant(typeof caseResult.passed === "boolean", `${label}.passed must be boolean`);
    assertString(caseResult.public_routing_output, `${label}.public_routing_output`, {
      min: 0,
      max: 10000,
    });
    validateSelections(caseResult.selections, `${label}.selections`, knownSkills);
    validateUsage(caseResult.usage, `${label}.usage`);
    assertStringArray(caseResult.pass_fail_reasons, `${label}.pass_fail_reasons`, {
      max: 20,
    });
    invariant(
      caseResult.passed || caseResult.pass_fail_reasons.length > 0,
      `${label} failed case requires non-empty pass_fail_reasons`,
    );
    const resultKey = `${caseResult.case_id}:${caseResult.repetition}`;
    invariant(!resultKeys.has(resultKey), `${label} duplicate case repetition: ${resultKey}`);
    resultKeys.add(resultKey);
    const repetitions = caseResultsById.get(caseResult.case_id) ?? [];
    repetitions.push(caseResult);
    caseResultsById.set(caseResult.case_id, repetitions);
  }

  assertExactKeys(
    result.repetitions,
    ["planned", "completed", "third_on_disagreement"],
    "model result.repetitions",
  );
  invariant(
    result.repetitions.planned === 2,
    "model result.repetitions.planned must be 2",
  );
  assertInteger(result.repetitions.completed, "model result.repetitions.completed", 2);
  invariant(
    result.repetitions.completed === result.case_results.length,
    "model result.repetitions.completed must equal actual case-result attempts",
  );
  invariant(
    typeof result.repetitions.third_on_disagreement === "boolean",
    "model result.repetitions.third_on_disagreement must be boolean",
  );

  let hasThirdAttempt = false;
  for (const [caseId, attempts] of caseResultsById) {
    attempts.sort((left, right) => left.repetition - right.repetition);
    const repetitionNumbers = attempts.map((attempt) => attempt.repetition);
    invariant(
      JSON.stringify(repetitionNumbers) === JSON.stringify([1, 2]) ||
        JSON.stringify(repetitionNumbers) === JSON.stringify([1, 2, 3]),
      `case ${caseId} must contain repetitions 1 and 2, plus only an optional repetition 3`,
    );
    const signature = (attempt) =>
      JSON.stringify({
        passed: attempt.passed,
        public_routing_output: attempt.public_routing_output,
        selections: attempt.selections,
      });
    const disagreed = signature(attempts[0]) !== signature(attempts[1]);
    const hasThird = attempts.length === 3;
    invariant(
      !disagreed || hasThird,
      `case ${caseId} first two attempts disagree but repetition 3 is omitted`,
    );
    invariant(
      disagreed || !hasThird,
      `case ${caseId} has illegal repetition 3 without first-two disagreement`,
    );
    hasThirdAttempt ||= hasThird;
  }
  invariant(
    result.repetitions.third_on_disagreement === hasThirdAttempt,
    "model result.repetitions.third_on_disagreement does not match actual third attempts",
  );

  assertStringArray(result.pass_fail_reasons, "model result.pass_fail_reasons", {
    max: 40,
  });
  const hasFailure = result.case_results.some((caseResult) => !caseResult.passed);
  invariant(
    !hasFailure || result.pass_fail_reasons.length > 0,
    "failed model result requires non-empty pass_fail_reasons",
  );

  const aggregateUsage = result.case_results.reduce(
    (total, caseResult) => ({
      input_tokens: total.input_tokens + caseResult.usage.input_tokens,
      output_tokens: total.output_tokens + caseResult.usage.output_tokens,
      total_tokens: total.total_tokens + caseResult.usage.total_tokens,
    }),
    { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
  );
  invariant(
    JSON.stringify(result.usage) === JSON.stringify(aggregateUsage),
    "model result usage must equal the sum of case-result usage",
  );

  function attemptsForSegment(segment) {
    if (segment === "overall") return result.case_results;
    if (segment === "critical") {
      return result.case_results.filter(
        (caseResult) => frozenCases.get(caseResult.case_id).critical,
      );
    }
    const [dimension, value] = segment.split(":", 2);
    return result.case_results.filter((caseResult) => {
      const evaluationCase = frozenCases.get(caseResult.case_id);
      if (dimension === "category") return evaluationCase.category === value;
      if (dimension === "adapter") return evaluationCase.adapter === value;
      if (dimension === "profile") {
        return evaluationCase.context_profile === value;
      }
      return false;
    });
  }

  const seenSegments = new Set();
  for (const [index, segment] of result.segment_results.entries()) {
    const label = `model result.segment_results[${index}]`;
    invariant(!seenSegments.has(segment.segment), `${label} duplicate segment`);
    seenSegments.add(segment.segment);
    const attempts = attemptsForSegment(segment.segment);
    invariant(attempts.length > 0, `${label} selects zero case-result attempts`);
    const passed = attempts.filter((attempt) => attempt.passed).length;
    const failed = attempts.length - passed;
    invariant(
      segment.cases === attempts.length &&
        segment.passed === passed &&
        segment.failed === failed &&
        Math.abs(segment.pass_rate - passed / attempts.length) < 1e-9,
      `${label} does not match derived case-result aggregates`,
    );
  }
  invariant(seenSegments.has("overall"), "model result requires an overall segment");
  const includesCritical = result.case_results.some(
    (caseResult) => frozenCases.get(caseResult.case_id).critical,
  );
  invariant(
    !includesCritical || seenSegments.has("critical"),
    "model result with critical cases requires a critical segment",
  );

  return {
    case_result_count: result.case_results.length,
    result_id: result.result_id,
    segment_count: result.segment_results.length,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function expectFailure(action, pattern, label) {
  return Promise.resolve()
    .then(action)
    .then(() => {
      throw new Error(`self-test ${label} unexpectedly passed`);
    })
    .catch((error) => {
      if (error.message.startsWith("self-test ")) {
        throw error;
      }
      invariant(
        pattern.test(error.message),
        `self-test ${label} failed for wrong reason: ${error.message}`,
      );
    });
}

export async function runSelfTests({ evalRoot, pluginRoot }) {
  const knownSkills = await discoverSkills(pluginRoot);
  const {
    caseSchema,
    validateCaseSchema,
    validateResultSchema,
  } = await loadSchemaValidators(evalRoot);
  const development = await readJson(
    path.join(evalRoot, "corpus", "development.json"),
  );
  const baseCase = development.cases[0];
  const checks = [];
  validateCaseSchema(baseCase, "valid case fixture");

  const unknownSkill = clone(baseCase);
  unknownSkill.expected.domain_skills = ["does-not-exist"];
  checks.push(
    expectFailure(
      () => validateEvalCase(unknownSkill, { knownSkills }),
      /unknown skill/,
      "unknown skill",
    ),
  );

  const unknownAdapter = clone(baseCase);
  unknownAdapter.adapter = "unknown";
  checks.push(
    expectFailure(
      () => validateEvalCase(unknownAdapter, { knownSkills }),
      /unknown adapter/,
      "unknown adapter",
    ),
  );

  const unknownProfile = clone(baseCase);
  unknownProfile.context_profile = "marketing-model-name";
  checks.push(
    expectFailure(
      () => validateEvalCase(unknownProfile, { knownSkills }),
      /unknown profile/,
      "unknown profile",
    ),
  );

  const contradictory = clone(development.cases[1]);
  contradictory.expected.forbidden_skills.push(
    contradictory.expected.domain_skills[0],
  );
  checks.push(
    expectFailure(
      () => validateEvalCase(contradictory, { knownSkills }),
      /contradictory expected and forbidden/,
      "contradictory skills",
    ),
  );

  const missingBudget = clone(baseCase);
  delete missingBudget.budget;
  checks.push(
    expectFailure(
      () => validateEvalCase(missingBudget, { knownSkills }),
      /missing fields: budget/,
      "missing budget",
    ),
  );

  const duplicateArray = clone(development.cases[1]);
  duplicateArray.expected.domain_skills.push(
    duplicateArray.expected.domain_skills[0],
  );
  checks.push(
    expectFailure(
      () => validateEvalCase(duplicateArray, { knownSkills }),
      /contains duplicate value/,
      "duplicate bounded array",
    ),
  );

  await Promise.all(checks);

  await expectFailure(
    () => JSON.parse("{"),
    /JSON/,
    "invalid JSON",
  );
  await expectFailure(
    () => compileJsonSchema({ ...caseSchema, unsupportedKeyword: true }),
    /unsupported JSON Schema keyword/,
    "unsupported schema keyword",
  );
  await expectFailure(
    () => validateCaseSchema(unknownAdapter, "schema unknown adapter"),
    /enum/,
    "schema unknown adapter",
  );
  await expectFailure(
    () => validateCaseSchema(missingBudget, "schema missing budget"),
    /missing required property: budget/,
    "schema missing budget",
  );

  const duplicateCaseIds = [
    { cases: [clone(baseCase)] },
    { cases: [clone(baseCase)] },
  ];
  await expectFailure(
    () => {
      const seen = new Set();
      for (const document of duplicateCaseIds) {
        for (const evaluationCase of document.cases) {
          invariant(
            !seen.has(evaluationCase.case_id),
            `duplicate case_id: ${evaluationCase.case_id}`,
          );
          seen.add(evaluationCase.case_id);
        }
      }
    },
    /duplicate case_id/,
    "duplicate case id",
  );

  const computedManifest = await computeFrozenManifest(evalRoot);
  const changedFrozenManifest = {
    ...computedManifest,
    manifest_sha256: "f".repeat(64),
  };
  await expectFailure(
    () => assertFrozenManifestMatches(changedFrozenManifest, computedManifest),
    /changed frozen-manifest hash/,
    "changed frozen manifest",
  );

  const corpusDocuments = await Promise.all(
    ["development", "acceptance", "challenge"].map((set) =>
      readJson(path.join(evalRoot, "corpus", `${set}.json`)),
    ),
  );
  for (const [category, pattern] of [
    ["honest-status", /missing critical honest partial-status case/],
    ["delegation-safety", /missing critical nested-delegation prohibition case/],
  ]) {
    const withoutRequiredClass = clone(corpusDocuments);
    const developmentDocument = withoutRequiredClass.find(
      (document) => document.frozen === false,
    );
    for (const document of withoutRequiredClass.filter(
      (candidate) => candidate.frozen === true,
    )) {
      developmentDocument.cases.push(
        ...document.cases.filter(
          (evaluationCase) => evaluationCase.category === category,
        ),
      );
      document.cases = document.cases.filter(
        (evaluationCase) => evaluationCase.category !== category,
      );
    }
    await expectFailure(
      () => validateCoverage(withoutRequiredClass),
      pattern,
      `coverage ${category}`,
    );
  }

  const exampleResult = await readJson(
    path.join(evalRoot, "results", "example-public-result.json"),
  );
  const manifest = await validateFrozenManifest(evalRoot);
  exampleResult.corpus.manifest_sha256 = manifest.manifest_sha256;
  validateResultSchema(exampleResult, "valid result fixture");
  await validateModelResult({ evalRoot, pluginRoot, result: exampleResult });

  const malformedResult = clone(exampleResult);
  delete malformedResult.repo_revision;
  await expectFailure(
    () => validateResultSchema(malformedResult, "schema malformed result"),
    /missing required property: repo_revision/,
    "schema malformed result",
  );
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: malformedResult }),
    /missing required property: repo_revision/,
    "malformed result",
  );

  const hiddenReasoning = clone(exampleResult);
  hiddenReasoning.case_results[0].reasoning = "private chain of thought";
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: hiddenReasoning }),
    /unknown properties: reasoning|forbidden hidden-reasoning field/,
    "hidden reasoning",
  );

  const changedManifestResult = clone(exampleResult);
  changedManifestResult.corpus.manifest_sha256 = "f".repeat(64);
  await expectFailure(
    () =>
      validateModelResult({
        evalRoot,
        pluginRoot,
        result: changedManifestResult,
      }),
    /manifest hash does not match/,
    "changed frozen manifest hash",
  );

  const duplicateResult = clone(exampleResult);
  duplicateResult.case_results.push(clone(duplicateResult.case_results[0]));
  duplicateResult.repetitions.completed += 1;
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: duplicateResult }),
    /duplicate case repetition/,
    "duplicate result repetition",
  );

  const developmentResult = clone(exampleResult);
  for (const caseResult of developmentResult.case_results) {
    caseResult.case_id = development.cases[0].case_id;
  }
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: developmentResult }),
    /not a frozen acceptance\/challenge case/,
    "development result membership",
  );

  const zeroSegment = clone(exampleResult);
  zeroSegment.segment_results[0] = {
    ...zeroSegment.segment_results[0],
    cases: 0,
    failed: 0,
    passed: 0,
    pass_rate: 0,
  };
  await expectFailure(
    () => validateResultSchema(zeroSegment, "schema zero segment"),
    /minimum 1/,
    "schema zero segment",
  );
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: zeroSegment }),
    /minimum 1/,
    "runtime zero segment",
  );

  const mismatchedSegment = clone(exampleResult);
  mismatchedSegment.segment_results[0].passed = 1;
  mismatchedSegment.segment_results[0].failed = 1;
  mismatchedSegment.segment_results[0].pass_rate = 0.5;
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: mismatchedSegment }),
    /does not match derived case-result aggregates/,
    "segment aggregate mismatch",
  );

  const mismatchedUsage = clone(exampleResult);
  mismatchedUsage.usage = {
    input_tokens: 1,
    output_tokens: 0,
    total_tokens: 1,
  };
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: mismatchedUsage }),
    /usage must equal the sum/,
    "usage aggregate mismatch",
  );

  const mismatchedRepetitions = clone(exampleResult);
  mismatchedRepetitions.repetitions.completed = 3;
  await expectFailure(
    () =>
      validateModelResult({
        evalRoot,
        pluginRoot,
        result: mismatchedRepetitions,
      }),
    /completed must equal actual/,
    "repetition count mismatch",
  );

  const illegalThird = clone(exampleResult);
  const thirdAttempt = clone(illegalThird.case_results[1]);
  thirdAttempt.repetition = 3;
  illegalThird.case_results.push(thirdAttempt);
  illegalThird.repetitions.completed = 3;
  illegalThird.repetitions.third_on_disagreement = true;
  illegalThird.segment_results[0].cases = 3;
  illegalThird.segment_results[0].passed = 3;
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: illegalThird }),
    /illegal repetition 3/,
    "illegal third repetition",
  );

  const omittedThird = clone(exampleResult);
  omittedThird.case_results[1].passed = false;
  omittedThird.case_results[1].pass_fail_reasons = ["Deliberate disagreement fixture."];
  omittedThird.segment_results[0] = {
    segment: "overall",
    cases: 2,
    passed: 1,
    failed: 1,
    pass_rate: 0.5,
  };
  omittedThird.pass_fail_reasons = ["One attempt failed."];
  await expectFailure(
    () => validateModelResult({ evalRoot, pluginRoot, result: omittedThird }),
    /repetition 3 is omitted/,
    "omitted disagreement repetition",
  );

  const mismatchedThirdFlag = clone(exampleResult);
  mismatchedThirdFlag.repetitions.third_on_disagreement = true;
  await expectFailure(
    () =>
      validateModelResult({
        evalRoot,
        pluginRoot,
        result: mismatchedThirdFlag,
      }),
    /third_on_disagreement does not match/,
    "third repetition flag mismatch",
  );

  const failedWithoutReasons = clone(omittedThird);
  failedWithoutReasons.case_results[1].pass_fail_reasons = [];
  await expectFailure(
    () =>
      validateModelResult({
        evalRoot,
        pluginRoot,
        result: failedWithoutReasons,
      }),
    /failed case requires non-empty/,
    "failed case reasons",
  );

  const failedWithoutResultReasons = clone(omittedThird);
  const disagreementResolution = clone(
    failedWithoutResultReasons.case_results[1],
  );
  disagreementResolution.repetition = 3;
  failedWithoutResultReasons.case_results.push(disagreementResolution);
  failedWithoutResultReasons.repetitions.completed = 3;
  failedWithoutResultReasons.repetitions.third_on_disagreement = true;
  failedWithoutResultReasons.segment_results[0] = {
    segment: "overall",
    cases: 3,
    passed: 1,
    failed: 2,
    pass_rate: 1 / 3,
  };
  failedWithoutResultReasons.pass_fail_reasons = [];
  await expectFailure(
    () =>
      validateModelResult({
        evalRoot,
        pluginRoot,
        result: failedWithoutResultReasons,
      }),
    /failed model result requires non-empty/,
    "failed result reasons",
  );

  const criticalCase = corpusDocuments
    .slice(1)
    .flatMap((document) => document.cases)
    .find((evaluationCase) => evaluationCase.critical);
  const criticalWithoutSegment = clone(exampleResult);
  for (const caseResult of criticalWithoutSegment.case_results) {
    caseResult.case_id = criticalCase.case_id;
  }
  await expectFailure(
    () =>
      validateModelResult({
        evalRoot,
        pluginRoot,
        result: criticalWithoutSegment,
      }),
    /requires a critical segment/,
    "critical segment cannot be hidden",
  );

  return { checks: checks.length + 22 };
}

function parseArguments(argumentsList, defaults) {
  const options = {
    evalRoot: defaults.evalRoot,
    pluginRoot: defaults.pluginRoot,
    resultPath: null,
    selfTest: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--eval-root") {
      options.evalRoot = path.resolve(argumentsList[++index]);
    } else if (argument === "--plugin-root") {
      options.pluginRoot = path.resolve(argumentsList[++index]);
    } else if (argument === "--result") {
      options.resultPath = path.resolve(argumentsList[++index]);
    } else if (argument === "--self-test") {
      options.selfTest = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

export async function runContextEvalCli(argumentsList) {
  const libraryPath = fileURLToPath(import.meta.url);
  const pluginRoot = path.resolve(path.dirname(libraryPath), "../..");
  const defaults = {
    evalRoot: path.join(pluginRoot, "evals"),
    pluginRoot,
  };
  try {
    const options = parseArguments(argumentsList, defaults);
    const corpus = await validateContextCorpus(options);
    let result = null;
    if (options.resultPath) {
      result = await validateModelResult({
        ...options,
        result: await readJson(options.resultPath),
      });
    }
    let selfTest = null;
    if (options.selfTest) {
      selfTest = await runSelfTests(options);
    }
    console.log(
      JSON.stringify(
        {
          corpus,
          result,
          self_test: selfTest,
          status: "PASS",
        },
        null,
        2,
      ),
    );
    return 0;
  } catch (error) {
    console.error(`context eval validation: FAIL: ${error.message}`);
    return 1;
  }
}
