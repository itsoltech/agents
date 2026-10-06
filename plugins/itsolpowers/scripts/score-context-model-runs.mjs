#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const scalarFields = [
  "primary_process_skill",
  "workflow_requirement",
  "execution_policy_requirement",
  "delegation",
  "effective_profile",
];
const setFields = ["domain_skills", "supporting_process_skills", "protected_constraints"];
const decisionFields = [...scalarFields, ...setFields];

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith("--") || !args[index + 1]) {
      throw new Error(`invalid argument: ${key}`);
    }
    options[key.slice(2)] = path.resolve(args[++index]);
  }
  for (const required of [
    "corpus-root",
    "baseline-r1",
    "baseline-r2",
    "baseline-r3",
    "candidate-r1",
    "candidate-r2",
    "candidate-r3",
    "output",
  ]) {
    if (!options[required]) throw new Error(`missing --${required}`);
  }
  return options;
}

const stableSet = (values) => [...new Set(values)].sort();
const normalized = (field, value) =>
  JSON.stringify(setFields.includes(field) ? stableSet(value) : value);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function readJsonWithHash(filePath) {
  const bytes = await readFile(filePath);
  return { document: JSON.parse(bytes), sha256: sha256(bytes) };
}
const statusValues = new Set(["complete", "partial", "unavailable", "blocked", "failed"]);
const profileNames = new Set(["frontier", "compatibility"]);
const provenanceSources = new Set(["explicit-task", "explicit-environment", "validated-runtime-capability", "compatibility-fallback"]);
const measurementKeys = ["tokenizer", "harness", "model", "loaded_surfaces", "input_tokens", "output_tokens", "total_tokens"];

function validateMeasurement(measurement, label) {
  if (!measurement || typeof measurement !== "object" || Array.isArray(measurement)) throw new Error(`${label} has missing measurement metadata`);
  const unknown = Object.keys(measurement).filter((key) => !measurementKeys.includes(key));
  const missing = measurementKeys.filter((key) => !(key in measurement));
  if (unknown.length || missing.length) throw new Error(`${label} has incomplete measurement metadata`);
  for (const key of ["tokenizer", "harness", "model"]) {
    if (typeof measurement[key] !== "string" || measurement[key].length === 0) throw new Error(`${label}.${key} is invalid`);
  }
  if (!Array.isArray(measurement.loaded_surfaces) || measurement.loaded_surfaces.length > 64 || measurement.loaded_surfaces.some((item) => typeof item !== "string" || item.length === 0)) throw new Error(`${label}.loaded_surfaces is invalid`);
  for (const key of ["input_tokens", "output_tokens", "total_tokens"]) {
    if (!Number.isInteger(measurement[key]) || measurement[key] < 0) throw new Error(`${label}.${key} is invalid`);
  }
  if (measurement.total_tokens !== measurement.input_tokens + measurement.output_tokens) throw new Error(`${label}.total_tokens does not equal input + output tokens`);
}

function validateEvidence(evidence, label) {
  if (!Array.isArray(evidence) || evidence.length === 0 || evidence.length > 8) throw new Error(`${label} must contain bounded evidence records`);
  const kinds = new Set(["command", "test", "artifact", "observation", "measurement", "contract", "routing", "protected-constraint", "status"]);
  const statuses = new Set(["verified", "unavailable", "partial", "failed"]);
  for (const record of evidence) {
    if (!record || JSON.stringify(Object.keys(record).sort()) !== JSON.stringify(["artifact", "command", "kind", "relates_to", "source", "status"])) throw new Error(`${label} contains malformed evidence`);
    if (!kinds.has(record.kind) || !statuses.has(record.status) || ["source", "command", "artifact", "relates_to"].some((key) => typeof record[key] !== "string" || record[key].length === 0 || record[key].length > (key === "command" || key === "artifact" ? 320 : 160))) throw new Error(`${label} contains malformed evidence`);
  }
}

function validateRun(run, {
  variant,
  repetition,
  expectedIds,
  baselineRevision,
}) {
  if (
    run?.run?.variant !== variant
    || run?.run?.repetition !== repetition
    || !Array.isArray(run.cases)
  ) {
    throw new Error(`${variant} repetition ${repetition} has invalid run metadata`);
  }
  if (
    typeof run.run.harness !== "string"
    || run.run.harness.length === 0
    || typeof run.run.model_identifier !== "string"
    || run.run.model_identifier.length === 0
  ) {
    throw new Error(`${variant} repetition ${repetition} has invalid harness/model metadata`);
  }
  validateMeasurement(run.run.measurement, `${variant} repetition ${repetition}.run`);
  if (run.run.measurement.harness !== run.run.harness || run.run.measurement.model !== run.run.model_identifier) throw new Error(`${variant} repetition ${repetition} measurement harness/model mismatch`);
  if (
    variant === "baseline"
      ? run.run.revision !== baselineRevision
      : typeof run.run.revision !== "string" || run.run.revision.length === 0
  ) {
    throw new Error(`${variant} repetition ${repetition} has invalid revision`);
  }
  const ids = run.cases.map((item) => item.case_id);
  if (ids.length !== new Set(ids).size) {
    throw new Error(`${variant} repetition ${repetition} has duplicate case IDs`);
  }
  for (const item of run.cases) {
    if ("expected" in item || "reasoning" in item || "passed" in item) {
      throw new Error(`${variant} ${item.case_id} contains forbidden private/scored fields`);
    }
    for (const field of decisionFields) {
      if (!(field in item)) throw new Error(`${variant} ${item.case_id} missing ${field}`);
    }
    if (!statusValues.has(item.status) || !profileNames.has(item.effective_profile)) throw new Error(`${variant} ${item.case_id} has invalid status/profile metadata`);
    if (!item.profile_provenance || JSON.stringify(Object.keys(item.profile_provenance).sort()) !== JSON.stringify(["fallback", "requested_profile", "source"]) || !provenanceSources.has(item.profile_provenance.source) || (item.profile_provenance.requested_profile !== null && !profileNames.has(item.profile_provenance.requested_profile)) || typeof item.profile_provenance.fallback !== "boolean") throw new Error(`${variant} ${item.case_id} has invalid profile provenance`);
    if (!item.contract_decision || !item.contract_decision.routing || typeof item.contract_decision.routing !== "object") throw new Error(`${variant} ${item.case_id} has missing contract decision`);
    if (item.contract_decision.routing.primary_process_skill !== item.primary_process_skill || JSON.stringify(stableSet(item.contract_decision.routing.domain_skills)) !== JSON.stringify(stableSet(item.domain_skills)) || item.contract_decision.workflow_requirement !== item.workflow_requirement || item.contract_decision.execution_policy_requirement !== item.execution_policy_requirement || item.contract_decision.delegation !== item.delegation || JSON.stringify(item.contract_decision.protected_constraints) !== JSON.stringify(item.protected_constraints)) throw new Error(`${variant} ${item.case_id} contract decision mismatch`);
    validateEvidence(item.evidence, `${variant} ${item.case_id}.evidence`);
    validateMeasurement(item.measurement, `${variant} ${item.case_id}.measurement`);
    if (item.measurement.tokenizer !== run.run.measurement.tokenizer || item.measurement.harness !== run.run.measurement.harness || item.measurement.model !== run.run.measurement.model || JSON.stringify(stableSet(item.measurement.loaded_surfaces)) !== JSON.stringify(stableSet(run.run.measurement.loaded_surfaces))) throw new Error(`${variant} ${item.case_id} has incomparable measurement metadata`);
    if (
      !Array.isArray(item.protected_constraints)
      || typeof item.public_routing_output !== "string"
      || item.public_routing_output.length > 280
    ) {
      throw new Error(`${variant} ${item.case_id} has invalid public output`);
    }
  }
  if (repetition < 3) {
    if (
      ids.length !== expectedIds.size
      || ids.some((caseId) => !expectedIds.has(caseId))
    ) {
      throw new Error(`${variant} repetition ${repetition} must cover all frozen cases`);
    }
  }
}

function mapCases(run) {
  return new Map(run.cases.map((item) => [item.case_id, item]));
}

function firstTwoDisagreement(left, right) {
  return decisionFields.some(
    (field) => normalized(field, left[field]) !== normalized(field, right[field]),
  );
}

function majority(field, attempts) {
  const values = attempts.map((attempt) => normalized(field, attempt[field]));
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const ordered = [...counts.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );
  if (ordered[0][1] < 2) return { unresolved: true, value: JSON.parse(ordered[0][0]) };
  return { unresolved: false, value: JSON.parse(ordered[0][0]) };
}

function scoreVariant({ cases, expectedById, runs, variant }) {
  const maps = runs.map(mapCases);
  const disagreementIds = [];
  const scoredCases = [];
  for (const caseDefinition of cases) {
    const first = maps[0].get(caseDefinition.case_id);
    const second = maps[1].get(caseDefinition.case_id);
    const disagreed = firstTwoDisagreement(first, second);
    if (disagreed) disagreementIds.push(caseDefinition.case_id);
    const third = maps[2].get(caseDefinition.case_id);
    if (disagreed !== Boolean(third)) {
      throw new Error(
        `${variant} ${caseDefinition.case_id} third repetition does not match disagreement`,
      );
    }
    const attempts = third ? [first, second, third] : [first, second];
    const decision = {};
    const unresolved = [];
    for (const field of decisionFields) {
      const result = majority(field, attempts);
      decision[field] = result.value;
      if (result.unresolved) unresolved.push(field);
    }

    const expected = expectedById.get(caseDefinition.case_id);
    const reasons = [];
    if (decision.primary_process_skill !== expected.primary_process_skill) {
      reasons.push("primary_process_skill mismatch");
    }
    if (
      JSON.stringify(stableSet(decision.domain_skills))
      !== JSON.stringify(stableSet(expected.domain_skills))
    ) {
      reasons.push("domain_skills mismatch");
    }
    if (decision.workflow_requirement !== expected.workflow_requirement) {
      reasons.push("workflow_requirement mismatch");
    }
    if (
      decision.execution_policy_requirement
      !== expected.execution_policy_requirement
    ) {
      reasons.push("execution_policy_requirement mismatch");
    }
    if (decision.delegation !== expected.delegation) {
      reasons.push("delegation mismatch");
    }
    if (decision.effective_profile !== caseDefinition.context_profile) reasons.push("effective_profile mismatch");
    if (JSON.stringify(stableSet(decision.protected_constraints)) !== JSON.stringify(stableSet(expected.protected_constraints))) reasons.push("protected_constraints mismatch");
    if (attempts.some((attempt) => attempt.status !== "complete")) reasons.push("attempt status is not complete");
    if (attempts.some((attempt) => !attempt.evidence.some((record) => record.status === "verified"))) reasons.push("verified evidence is missing");
    const initialSkills = new Set(
      [
        decision.primary_process_skill,
        ...decision.domain_skills,
        ...decision.supporting_process_skills,
      ].filter(Boolean),
    );
    const forbidden = expected.forbidden_skills.filter((skill) =>
      initialSkills.has(skill),
    );
    if (forbidden.length > 0) reasons.push(`forbidden skills: ${forbidden.join(", ")}`);
    if (initialSkills.size > caseDefinition.budget.max_initial_skills) {
      reasons.push(
        `initial skill budget exceeded: ${initialSkills.size}/${caseDefinition.budget.max_initial_skills}`,
      );
    }
    if (unresolved.length > 0) {
      reasons.push(`unresolved third-run disagreement: ${unresolved.join(", ")}`);
    }
    const protectedBoundaryPresent =
      !caseDefinition.critical
      || attempts.every(
        (attempt) =>
          attempt.protected_constraints.length > 0
          && attempt.public_routing_output.trim().length > 0,
      );
    if (!protectedBoundaryPresent) reasons.push("critical protected boundary missing");

    scoredCases.push({
      case_id: caseDefinition.case_id,
      category: caseDefinition.category,
      adapter: caseDefinition.adapter,
      context_profile: caseDefinition.context_profile,
      critical: caseDefinition.critical,
      repetitions: attempts.map((attempt) => attempt.run_repetition).filter(Boolean),
      decision,
      protected_boundary_present: protectedBoundaryPresent,
      passed: reasons.length === 0,
      pass_fail_reasons: reasons,
    });
  }
  const passed = scoredCases.filter((item) => item.passed).length;
  const criticalCases = scoredCases.filter((item) => item.critical);
  const criticalPassed = criticalCases.filter((item) => item.passed).length;
  const segmentKeys = new Set(["overall", "critical"]);
  for (const item of scoredCases) {
    segmentKeys.add(`adapter:${item.adapter}`);
    segmentKeys.add(`profile:${item.context_profile}`);
    segmentKeys.add(`category:${item.category}`);
  }
  const segments = [...segmentKeys].sort().map((segment) => {
    const selected = segment === "overall"
      ? scoredCases
      : segment === "critical"
        ? criticalCases
        : scoredCases.filter((item) => {
          const [kind, value] = segment.split(":");
          return kind === "adapter"
            ? item.adapter === value
            : kind === "profile"
              ? item.context_profile === value
              : item.category === value;
        });
    const segmentPassed = selected.filter((item) => item.passed).length;
    return {
      segment,
      cases: selected.length,
      passed: segmentPassed,
      failed: selected.length - segmentPassed,
      pass_rate: segmentPassed / selected.length,
    };
  });
  return {
    variant,
    disagreement_case_ids: disagreementIds,
    cases: scoredCases,
    segments,
    summary: {
      cases: scoredCases.length,
      passed,
      failed: scoredCases.length - passed,
      pass_rate: passed / scoredCases.length,
      critical_cases: criticalCases.length,
      critical_passed: criticalPassed,
      critical_pass_rate: criticalPassed / criticalCases.length,
    },
  };
}

const options = parseArguments(process.argv.slice(2));
const acceptance = await readJsonWithHash(
  path.join(options["corpus-root"], "acceptance.json"),
);
const challenge = await readJsonWithHash(
  path.join(options["corpus-root"], "challenge.json"),
);
const baselineManifest = JSON.parse(
  await readFile(path.join(options["corpus-root"], "..", "baseline-manifest.json")),
);
if (
  typeof baselineManifest.repository_revision !== "string"
  || !/^[0-9a-f]{40}$/.test(baselineManifest.repository_revision)
) {
  throw new Error("baseline manifest has invalid repository_revision");
}
const cases = [...acceptance.document.cases, ...challenge.document.cases];
const expectedIds = new Set(cases.map((item) => item.case_id));
const expectedById = new Map(cases.map((item) => [item.case_id, item.expected]));

const rawFiles = {};
const runsByVariant = {};
for (const variant of ["baseline", "candidate"]) {
  runsByVariant[variant] = [];
  for (const repetition of [1, 2, 3]) {
    const key = `${variant}-r${repetition}`;
    const loaded = await readJsonWithHash(options[key]);
    validateRun(loaded.document, {
      variant,
      repetition,
      expectedIds,
      baselineRevision: baselineManifest.repository_revision,
    });
    loaded.document.cases = loaded.document.cases.map((item) => ({
      ...item,
      run_repetition: repetition,
    }));
    rawFiles[key] = {
      path: options[key],
      sha256: loaded.sha256,
      cases: loaded.document.cases.length,
    };
    runsByVariant[variant].push(loaded.document);
  }
}

const allRuns = Object.values(runsByVariant).flat();
const harnesses = new Set(allRuns.map((run) => run.run.harness));
const models = new Set(allRuns.map((run) => run.run.model_identifier));
if (harnesses.size !== 1 || models.size !== 1) {
  throw new Error("all baseline/candidate repetitions must use the same harness and model");
}
const measurementSignatures = allRuns.map((run) => JSON.stringify({
  tokenizer: run.run.measurement.tokenizer,
  harness: run.run.measurement.harness,
  model: run.run.measurement.model,
}));
if (new Set(measurementSignatures).size !== 1) {
  throw new Error("baseline/candidate runs have incomparable measurement metadata");
}
for (const variant of ["baseline", "candidate"]) {
  const signatures = runsByVariant[variant].map((run) => JSON.stringify(stableSet(run.run.measurement.loaded_surfaces)));
  if (new Set(signatures).size !== 1) throw new Error(`${variant} repetitions have incomparable loaded surfaces`);
}
for (const variant of ["baseline", "candidate"]) {
  if (new Set(runsByVariant[variant].map((run) => run.run.revision)).size !== 1) {
    throw new Error(`${variant} repetitions must use one revision identifier`);
  }
}

const baseline = scoreVariant({
  cases,
  expectedById,
  runs: runsByVariant.baseline,
  variant: "baseline",
});
const candidate = scoreVariant({
  cases,
  expectedById,
  runs: runsByVariant.candidate,
  variant: "candidate",
});
const baselineFailures = new Set(
  baseline.cases.filter((item) => !item.passed).map((item) => item.case_id),
);
const candidateFailures = new Set(
  candidate.cases.filter((item) => !item.passed).map((item) => item.case_id),
);
const newFailures = [...candidateFailures].filter((caseId) => !baselineFailures.has(caseId));
const baselineSegments = new Map(
  baseline.segments.map((segment) => [segment.segment, segment]),
);
const segmentRegressions = candidate.segments
  .filter((segment) => {
    const baselineSegment = baselineSegments.get(segment.segment);
    return !baselineSegment || segment.pass_rate < baselineSegment.pass_rate;
  })
  .map((segment) => segment.segment);
const acceptanceChecks = {
  critical_cases_100_percent:
    candidate.summary.critical_passed === candidate.summary.critical_cases,
  no_new_case_failure: newFailures.length === 0,
  aggregate_not_worse:
    candidate.summary.pass_rate >= baseline.summary.pass_rate,
  segments_not_worse: segmentRegressions.length === 0,
};
const report = {
  schema_version: "1.0.0",
  corpus: {
    acceptance_sha256: acceptance.sha256,
    challenge_sha256: challenge.sha256,
    cases: cases.length,
  },
  harness: {
    identifier: [...harnesses][0],
    model_identifier: [...models][0],
    repetitions: 2,
    third_on_decision_disagreement: true,
    measurement: {
      tokenizer: allRuns[0].run.measurement.tokenizer,
      loaded_surfaces: allRuns.map((run) => ({ variant: run.run.variant, repetition: run.run.repetition, surfaces: run.run.measurement.loaded_surfaces })),
      input_tokens: allRuns.reduce((total, run) => total + run.run.measurement.input_tokens, 0),
      output_tokens: allRuns.reduce((total, run) => total + run.run.measurement.output_tokens, 0),
      total_tokens: allRuns.reduce((total, run) => total + run.run.measurement.total_tokens, 0),
    },
    usage: "host token usage unavailable",
  },
  raw_files: rawFiles,
  baseline,
  candidate,
  comparison: {
    acceptance_checks: acceptanceChecks,
    new_failure_case_ids: newFailures,
    regressed_segment_ids: segmentRegressions,
    status: Object.values(acceptanceChecks).every(Boolean) ? "PASS" : "FAIL",
  },
};
await writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify({
    baseline: baseline.summary,
    candidate: candidate.summary,
    comparison: report.comparison,
  }, null, 2)}\n`,
);
process.exitCode = report.comparison.status === "PASS" ? 0 : 1;
