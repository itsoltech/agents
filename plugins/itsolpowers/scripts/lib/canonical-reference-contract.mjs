import { execFile } from "node:child_process";
import {
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  auditContext,
  normalizeContextText,
  stableJson,
} from "./context-audit.mjs";

const execFileAsync = promisify(execFile);
const MARKDOWN_LINK_PATTERN =
  /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
const EXTERNAL_TARGET_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export const CANONICAL_REFERENCE_CLUSTERS = [
  {
    canonical: "skills/_shared/references/dotnet-web-api/program-composition.md",
    members: [
      "skills/dotnet-web-api-implementation/references/03-program-cs-i-skladanie-aplikacji.md",
      "skills/dotnet-web-api-review/references/03-program-cs-i-skladanie-aplikacji.md",
    ],
  },
  {
    canonical: "skills/_shared/references/dotnet-web-api/api-design.md",
    members: [
      "skills/dotnet-web-api-implementation/references/04-api-design.md",
      "skills/dotnet-web-api-review/references/04-api-design.md",
    ],
  },
  {
    canonical: "skills/_shared/references/hey-api/fetch-client.md",
    members: [
      "skills/hey-api-openapi-codegen/references/03-klient-fetch.md",
      "skills/hey-api-openapi-review/references/03-klient-fetch.md",
    ],
  },
  {
    canonical: "skills/_shared/references/infrastructure/container-review-checklist.md",
    members: [
      "skills/infra-container-build-review/references/02-checklist-do-review-infrastruktury.md",
      "skills/infra-container-runtime-review/references/02-checklist-do-review-infrastruktury.md",
      "skills/infra-nomad-deployment/references/04-checklist-do-review-infrastruktury.md",
      "skills/infra-production-readiness-review/references/02-checklist-do-review-infrastruktury.md",
      "skills/infra-routing-proxy-tls/references/02-checklist-do-review-infrastruktury.md",
      "skills/infra-secrets-config/references/02-checklist-do-review-infrastruktury.md",
    ],
  },
  {
    canonical: "skills/_shared/references/postgres/operational-procedures.md",
    members: [
      "skills/postgres-operations-debugging/references/07-procedury-operacyjne.md",
      "skills/postgres-review/references/08-procedury-operacyjne.md",
    ],
  },
  {
    canonical: "skills/_shared/references/postgres/minimum-application-settings.md",
    members: [
      "skills/postgres-operations-debugging/references/08-minimalny-zestaw-ustawien-dla-aplikacji.md",
      "skills/postgres-review/references/09-minimalny-zestaw-ustawien-dla-aplikacji.md",
    ],
  },
  {
    canonical: "skills/_shared/references/postgres/jsonb.md",
    members: [
      "skills/postgres-review/references/02-jsonb.md",
      "skills/postgres-schema-query-design/references/02-jsonb.md",
    ],
  },
  {
    canonical: "skills/_shared/references/postgres/planner-statistics.md",
    members: [
      "skills/postgres-review/references/03-statystyki-plannerowe.md",
      "skills/postgres-schema-query-design/references/03-statystyki-plannerowe.md",
    ],
  },
  {
    canonical: "skills/_shared/references/rust/tooling-clippy-rustfmt-lints.md",
    members: [
      "skills/rust-implementation/references/03-clippy-rustfmt-i-lints.md",
      "skills/rust-review/references/03-clippy-rustfmt-i-lints.md",
    ],
  },
  {
    canonical: "skills/_shared/references/rust-ml-llm/model-configuration.md",
    members: [
      "skills/rust-ml-llm-architecture/references/02-konfiguracja-modeli.md",
      "skills/rust-ml-llm-review/references/02-konfiguracja-modeli.md",
    ],
  },
  {
    canonical: "skills/_shared/references/rust-ml-llm/rig-providers-models-agents.md",
    members: [
      "skills/rust-ml-llm-architecture/references/03-rig-providerzy-modele-i-agenci.md",
      "skills/rust-ml-llm-debugging/references/01-overview.md",
      "skills/rust-ml-llm-review/references/03-rig-providerzy-modele-i-agenci.md",
    ],
    wrappers: [
      "skills/rust-ml-llm-debugging/references/01-overview.md",
    ],
  },
  {
    canonical: "skills/_shared/references/rust-ml-llm/candle-runtime-tensors.md",
    members: [
      "skills/rust-ml-llm-architecture/references/04-candle-runtime-modele-i-tensory.md",
      "skills/rust-ml-llm-debugging/references/02-candle-runtime-modele-i-tensory.md",
      "skills/rust-ml-llm-review/references/04-candle-runtime-modele-i-tensory.md",
    ],
  },
  {
    canonical: "skills/_shared/references/rust-ml-llm/function-api.md",
    members: [
      "skills/rust-ml-llm-architecture/references/05-api-dla-funkcji-ml-llm.md",
      "skills/rust-ml-llm-debugging/references/03-api-dla-funkcji-ml-llm.md",
      "skills/rust-ml-llm-review/references/05-api-dla-funkcji-ml-llm.md",
    ],
  },
  {
    canonical: "skills/_shared/references/rust-ml-llm/candle-training-inference-jobs.md",
    members: [
      "skills/rust-ml-llm-architecture/references/06-candle-trening-inference-service-i-joby.md",
      "skills/rust-ml-llm-review/references/06-candle-trening-inference-service-i-joby.md",
    ],
  },
  {
    canonical: "skills/_shared/references/tanstack-query-svelte/api-client-fetch.md",
    members: [
      "skills/tanstack-query-svelte-debugging/references/04-api-client-i-fetch.md",
      "skills/tanstack-query-svelte-implementation/references/05-api-client-i-fetch.md",
      "skills/tanstack-query-svelte-review/references/05-api-client-i-fetch.md",
    ],
  },
  {
    canonical: "skills/_shared/references/tanstack-query-svelte/mutations.md",
    members: [
      "skills/tanstack-query-svelte-debugging/references/05-mutacje.md",
      "skills/tanstack-query-svelte-implementation/references/06-mutacje.md",
      "skills/tanstack-query-svelte-review/references/06-mutacje.md",
    ],
  },
  {
    canonical: "skills/_shared/references/tanstack-query-svelte/error-handling.md",
    members: [
      "skills/tanstack-query-svelte-implementation/references/08-obsluga-bledow.md",
      "skills/tanstack-query-svelte-review/references/08-obsluga-bledow.md",
    ],
  },
];

function sortedUnique(values) {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
}

function samePathSet(left, right) {
  return stableJson(sortedUnique(left)) === stableJson(sortedUnique(right));
}

async function pathExists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function listFiles(root) {
  const files = [];
  async function visit(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") {
        return;
      }
      throw error;
    }
    entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isSymbolicLink()) {
        files.push({ absolute, kind: "symlink" });
      } else if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile()) {
        files.push({ absolute, kind: "file" });
      }
    }
  }
  await visit(root);
  return files;
}

function assertExactKeys(value, expected, context) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (stableJson(actual) !== stableJson(wanted)) {
    throw new Error(`${context} has invalid keys`);
  }
}

export function validateExceptionManifest({ manifest, currentClusters }) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("exception manifest must be an object");
  }
  assertExactKeys(
    manifest,
    ["exceptions", "normalization", "schema_version", "similarity_threshold"],
    "exception manifest",
  );
  if (manifest.schema_version !== "1.0.0") {
    throw new Error("exception manifest schema_version must be 1.0.0");
  }
  if (manifest.similarity_threshold !== 0.95) {
    throw new Error("exception manifest similarity_threshold must be 0.95");
  }
  assertExactKeys(
    manifest.normalization,
    [
      "case",
      "link_destinations",
      "shingle_size_tokens",
      "whitespace",
    ],
    "exception manifest normalization",
  );
  const expectedNormalization = {
    case: "lowercase",
    link_destinations: "excluded",
    shingle_size_tokens: 5,
    whitespace: "collapsed",
  };
  if (stableJson(manifest.normalization) !== stableJson(expectedNormalization)) {
    throw new Error("exception manifest normalization does not match the audit");
  }
  if (!Array.isArray(manifest.exceptions)) {
    throw new Error("exception manifest exceptions must be an array");
  }

  const knownCurrentPaths = new Set(currentClusters.flatMap((item) => item.paths));
  const seenIds = new Set();
  const seenClusters = new Set();
  let previousId = "";
  for (const exception of manifest.exceptions) {
    if (!exception || typeof exception !== "object" || Array.isArray(exception)) {
      throw new Error("exception entries must be objects");
    }
    assertExactKeys(
      exception,
      ["cluster_id", "paths", "reason"],
      "exception entry",
    );
    if (
      typeof exception.cluster_id !== "string" ||
      !/^[a-z0-9][a-z0-9-]*$/.test(exception.cluster_id)
    ) {
      throw new Error("exception cluster_id is invalid");
    }
    if (exception.cluster_id <= previousId) {
      throw new Error("exception entries must be uniquely sorted by cluster_id");
    }
    previousId = exception.cluster_id;
    if (seenIds.has(exception.cluster_id)) {
      throw new Error("exception cluster_id must be unique");
    }
    seenIds.add(exception.cluster_id);
    if (
      !Array.isArray(exception.paths) ||
      exception.paths.length < 2 ||
      stableJson(exception.paths) !== stableJson(sortedUnique(exception.paths))
    ) {
      throw new Error("exception paths must be a sorted unique cluster");
    }
    for (const memberPath of exception.paths) {
      if (
        typeof memberPath !== "string" ||
        memberPath.startsWith("/") ||
        memberPath.includes("..") ||
        !memberPath.startsWith("skills/") ||
        !memberPath.endsWith(".md")
      ) {
        throw new Error(`exception path is invalid: ${memberPath}`);
      }
      if (!knownCurrentPaths.has(memberPath)) {
        throw new Error(`exception path is stale or unknown: ${memberPath}`);
      }
    }
    const matchingCluster = currentClusters.find((cluster) =>
      samePathSet(cluster.paths, exception.paths),
    );
    if (!matchingCluster) {
      throw new Error("exception paths do not identify a current cluster");
    }
    const clusterKey = stableJson(sortedUnique(exception.paths));
    if (seenClusters.has(clusterKey)) {
      throw new Error("current cluster may have only one exception");
    }
    seenClusters.add(clusterKey);
    if (
      typeof exception.reason !== "string" ||
      exception.reason.trim().length < 24
    ) {
      throw new Error("exception reason must be specific");
    }
  }
  return manifest;
}

function sectorBody(markdown) {
  return markdown.replace(/\r\n/g, "\n").replace(/^#[^\n]*\n/, "");
}

function normalizeSectorBody(markdown) {
  return normalizeContextText(sectorBody(markdown));
}

async function readGitFile({ repositoryRoot, revision, relativePath }) {
  const { stdout } = await execFileAsync(
    "git",
    [
      "-C",
      repositoryRoot,
      "show",
      `${revision}:plugins/itsolpowers/${relativePath}`,
    ],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 },
  );
  return stdout;
}

async function validateCanonicalContent({
  pluginRoot,
  repositoryRoot,
  revision,
}) {
  const findings = [];
  for (const cluster of CANONICAL_REFERENCE_CLUSTERS) {
    const canonicalAbsolute = path.join(pluginRoot, cluster.canonical);
    if (!(await pathExists(canonicalAbsolute))) {
      findings.push({
        kind: "missing-canonical",
        path: cluster.canonical,
      });
      continue;
    }
    const baselineSource = await readGitFile({
      repositoryRoot,
      revision,
      relativePath: cluster.members[0],
    });
    const canonicalSource = await readFile(canonicalAbsolute, "utf8");
    if (
      sectorBody(baselineSource) !== sectorBody(canonicalSource)
    ) {
      findings.push({
        kind: "canonical-content-drift",
        path: cluster.canonical,
      });
    }

    const canonicalTarget = path.resolve(canonicalAbsolute);
    const consumers = sortedUnique(
      cluster.members.map((memberPath) => memberPath.split("/")[1]),
    );
    for (const consumer of consumers) {
      const guidePath = `skills/${consumer}/references/guide.md`;
      const guideAbsolute = path.join(pluginRoot, guidePath);
      if (!(await pathExists(guideAbsolute))) {
        findings.push({ kind: "missing-consumer-guide", path: guidePath });
        continue;
      }
      const guide = await readFile(guideAbsolute, "utf8");
      const linkedTargets = [...guide.matchAll(MARKDOWN_LINK_PATTERN)].map(
        (match) =>
          path.resolve(
            path.dirname(guideAbsolute),
            decodeURIComponent(match[2].split("#", 1)[0].split("?", 1)[0]),
          ),
      );
      if (!linkedTargets.includes(canonicalTarget)) {
        findings.push({
          kind: "consumer-guide-missing-canonical-link",
          path: guidePath,
          target: cluster.canonical,
        });
      }
    }

    const wrappers = new Set(cluster.wrappers ?? []);
    for (const memberPath of cluster.members) {
      const memberAbsolute = path.join(pluginRoot, memberPath);
      const exists = await pathExists(memberAbsolute);
      if (!exists) {
        continue;
      }
      if (!wrappers.has(memberPath)) {
        findings.push({
          kind: "stale-member-copy",
          path: memberPath,
        });
        continue;
      }
      const wrapper = await readFile(memberAbsolute, "utf8");
      const linkedTargets = [...wrapper.matchAll(MARKDOWN_LINK_PATTERN)].map(
        (match) =>
          path.resolve(
            path.dirname(memberAbsolute),
            decodeURIComponent(match[2].split("#", 1)[0].split("?", 1)[0]),
          ),
      );
      if (!linkedTargets.includes(canonicalTarget)) {
        findings.push({
          kind: "wrapper-missing-canonical-link",
          path: memberPath,
          target: cluster.canonical,
        });
      }
      if (
        normalizeContextText(wrapper).split(/\s+/).length > 100 ||
        normalizeSectorBody(wrapper) === normalizeSectorBody(canonicalSource)
      ) {
        findings.push({
          kind: "wrapper-copies-canonical-facts",
          path: memberPath,
        });
      }
    }
  }
  return findings;
}

export async function validateMarkdownLinks(pluginRoot) {
  const findings = [];
  const resolvedPluginRoot = path.resolve(pluginRoot);
  const skillsRoot = path.join(resolvedPluginRoot, "skills");
  const files = await listFiles(skillsRoot);
  for (const entry of files) {
    const relativePath = path
      .relative(resolvedPluginRoot, entry.absolute)
      .split(path.sep)
      .join("/");
    if (entry.kind === "symlink") {
      findings.push({ kind: "symlink", path: relativePath });
      continue;
    }
    if (!relativePath.endsWith(".md")) {
      continue;
    }
    const markdown = await readFile(entry.absolute, "utf8");
    for (const match of markdown.matchAll(MARKDOWN_LINK_PATTERN)) {
      const target = match[2];
      if (target.startsWith("#") || EXTERNAL_TARGET_PATTERN.test(target)) {
        continue;
      }
      if (target.startsWith("/") || target.startsWith("$")) {
        findings.push({
          kind: "absolute-or-dynamic-link",
          path: relativePath,
          target,
        });
        continue;
      }
      let pathOnly;
      try {
        pathOnly = decodeURIComponent(
          target.split("#", 1)[0].split("?", 1)[0],
        );
      } catch {
        findings.push({
          kind: "malformed-link",
          path: relativePath,
          target,
        });
        continue;
      }
      const resolvedTarget = path.resolve(path.dirname(entry.absolute), pathOnly);
      const relativeToSkills = path.relative(skillsRoot, resolvedTarget);
      if (
        relativeToSkills === ".." ||
        relativeToSkills.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeToSkills)
      ) {
        findings.push({
          kind: "escaping-link",
          path: relativePath,
          target,
        });
        continue;
      }
      if (!(await pathExists(resolvedTarget))) {
        findings.push({
          kind: "missing-link",
          path: relativePath,
          target,
        });
      }
    }
  }
  return findings;
}

export async function evaluateCanonicalReferences({
  pluginRoot,
  repositoryRoot,
  revision,
  exceptionManifest,
}) {
  const audit = await auditContext({ pluginRoot, revision });
  const currentClusters = audit.duplicates.near;
  validateExceptionManifest({
    manifest: exceptionManifest,
    currentClusters,
  });
  const exceptionKeys = new Set(
    exceptionManifest.exceptions.map((exception) =>
      stableJson(sortedUnique(exception.paths)),
    ),
  );
  const unexplainedClusters = currentClusters
    .filter(
      (cluster) =>
        !exceptionKeys.has(stableJson(sortedUnique(cluster.paths))),
    )
    .map((cluster) => ({
      paths: [...cluster.paths],
      similarity: cluster.similarity,
    }));

  const discoveryFindings = [];
  for (const entry of await listFiles(path.join(pluginRoot, "skills/_shared"))) {
    const relativePath = path
      .relative(pluginRoot, entry.absolute)
      .split(path.sep)
      .join("/");
    if (path.basename(entry.absolute) === "SKILL.md") {
      discoveryFindings.push({
        kind: "discoverable-shared-skill",
        path: relativePath,
      });
    }
  }

  const canonicalFindings = await validateCanonicalContent({
    pluginRoot,
    repositoryRoot,
    revision,
  });
  const linkFindings = await validateMarkdownLinks(pluginRoot);
  const baselineClusters = CANONICAL_REFERENCE_CLUSTERS.length;
  const status =
    canonicalFindings.length === 0 &&
    discoveryFindings.length === 0 &&
    linkFindings.length === 0 &&
    unexplainedClusters.length === 0
      ? "green"
      : "red";

  return {
    baseline_clusters: baselineClusters,
    canonical_findings: canonicalFindings,
    discovery_findings: discoveryFindings,
    exception_count: exceptionManifest.exceptions.length,
    link_findings: linkFindings,
    remaining_explained_clusters:
      currentClusters.length - unexplainedClusters.length,
    remaining_unexplained_clusters: unexplainedClusters,
    status,
  };
}

export async function materializeSkillsPackage({ pluginRoot }) {
  const packageManifest = JSON.parse(
    await readFile(path.join(pluginRoot, "package.json"), "utf8"),
  );
  if (
    !Array.isArray(packageManifest.files) ||
    !packageManifest.files.includes("skills")
  ) {
    throw new Error("package.json files whitelist must include skills");
  }
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "itsol-canonical-package-"),
  );
  const materializedPlugin = path.join(temporaryRoot, "plugin");
  await mkdir(materializedPlugin, { recursive: true });
  await cp(path.join(pluginRoot, "skills"), path.join(materializedPlugin, "skills"), {
    recursive: true,
    dereference: false,
  });
  return {
    cleanup: () => rm(temporaryRoot, { force: true, recursive: true }),
    pluginRoot: materializedPlugin,
  };
}

export async function materializeBaselineSkills({
  repositoryRoot,
  revision,
}) {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "itsol-canonical-baseline-"),
  );
  const archivePath = path.join(temporaryRoot, "baseline.tar");
  const materializedPlugin = path.join(temporaryRoot, "plugin");
  await mkdir(materializedPlugin, { recursive: true });
  await execFileAsync(
    "git",
    [
      "-C",
      repositoryRoot,
      "archive",
      "--format=tar",
      `--output=${archivePath}`,
      revision,
      "--",
      "plugins/itsolpowers/skills",
    ],
    { encoding: "utf8" },
  );
  await execFileAsync(
    "tar",
    [
      "-xf",
      archivePath,
      "--strip-components=2",
      "-C",
      materializedPlugin,
    ],
    { encoding: "utf8" },
  );
  return {
    cleanup: () => rm(temporaryRoot, { force: true, recursive: true }),
    pluginRoot: materializedPlugin,
  };
}
