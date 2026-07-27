import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’_-][\p{L}\p{N}]+)*/gu;
const MARKDOWN_LINK_PATTERN = /!?\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
const EXTERNAL_TARGET_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export function normalizeContextText(input) {
  return input
    .replace(MARKDOWN_LINK_PATTERN, (_match, label) => label)
    .toLocaleLowerCase("en-US")
    .replace(/\s+/g, " ")
    .trim();
}

export function sha256(input) {
  return createHash("sha256").update(input).digest("hex");
}

export function countWords(input) {
  return input.match(WORD_PATTERN)?.length ?? 0;
}

export function stableJson(value, spacing = 2) {
  return `${JSON.stringify(sortJsonValue(value), null, spacing)}\n`;
}

function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right, "en"))
        .map((key) => [key, sortJsonValue(value[key])]),
    );
  }
  return value;
}

async function listFiles(root) {
  const results = [];

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
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
      } else if (entry.isFile()) {
        results.push(absolutePath);
      }
    }
  }

  await visit(root);
  return results;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return { body: markdown, description: "" };
  }

  const descriptionMatch = match[1].match(
    /^description:\s*(?:"([^"]*)"|'([^']*)'|(.+))$/m,
  );
  return {
    body: markdown.slice(match[0].length),
    description:
      descriptionMatch?.[1] ??
      descriptionMatch?.[2] ??
      descriptionMatch?.[3]?.trim() ??
      "",
  };
}

function fileMeasurement(relativePath, text) {
  const normalized = normalizeContextText(text);
  return {
    path: relativePath,
    sha256: sha256(normalized),
    words: countWords(text),
  };
}

function metric(files, extra = {}) {
  return {
    file_count: files.length,
    word_count: files.reduce((total, file) => total + file.words, 0),
    files,
    ...extra,
  };
}

function shingles(normalizedText, size = 5) {
  const tokens = normalizedText.match(WORD_PATTERN) ?? [];
  const result = new Set();
  if (tokens.length < size) {
    if (tokens.length > 0) {
      result.add(tokens.join(" "));
    }
    return result;
  }
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(" "));
  }
  return result;
}

function jaccard(left, right) {
  if (left.size === 0 && right.size === 0) {
    return 1;
  }
  let intersection = 0;
  const [smaller, larger] =
    left.size <= right.size ? [left, right] : [right, left];
  for (const value of smaller) {
    if (larger.has(value)) {
      intersection += 1;
    }
  }
  return intersection / (left.size + right.size - intersection);
}

function duplicateFindings(referenceDocuments) {
  const exactByHash = new Map();
  for (const document of referenceDocuments) {
    const paths = exactByHash.get(document.sha256) ?? [];
    paths.push(document.path);
    exactByHash.set(document.sha256, paths);
  }
  const exact = [...exactByHash.entries()]
    .filter(([, paths]) => paths.length > 1)
    .map(([normalized_sha256, paths]) => ({
      normalized_sha256,
      paths: paths.toSorted((left, right) => left.localeCompare(right, "en")),
    }))
    .toSorted((left, right) => left.paths[0].localeCompare(right.paths[0], "en"));

  const documents = referenceDocuments.map((document) => ({
    ...document,
    shingles: shingles(document.normalized),
  }));
  const edges = [];
  for (let leftIndex = 0; leftIndex < documents.length; leftIndex += 1) {
    const left = documents[leftIndex];
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < documents.length;
      rightIndex += 1
    ) {
      const right = documents[rightIndex];
      const maximumSize = Math.max(left.shingles.size, right.shingles.size);
      const minimumSize = Math.min(left.shingles.size, right.shingles.size);
      if (maximumSize > 0 && minimumSize / maximumSize < 0.95) {
        continue;
      }
      const similarity = jaccard(left.shingles, right.shingles);
      if (similarity >= 0.95) {
        edges.push({
          left: left.path,
          right: right.path,
          similarity,
        });
      }
    }
  }

  const adjacency = new Map();
  for (const edge of edges) {
    for (const [from, to] of [
      [edge.left, edge.right],
      [edge.right, edge.left],
    ]) {
      const neighbors = adjacency.get(from) ?? new Set();
      neighbors.add(to);
      adjacency.set(from, neighbors);
    }
  }

  const seen = new Set();
  const near = [];
  for (const start of [...adjacency.keys()].toSorted((left, right) =>
    left.localeCompare(right, "en"),
  )) {
    if (seen.has(start)) {
      continue;
    }
    const stack = [start];
    const paths = [];
    while (stack.length > 0) {
      const current = stack.pop();
      if (seen.has(current)) {
        continue;
      }
      seen.add(current);
      paths.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        stack.push(neighbor);
      }
    }
    paths.sort((left, right) => left.localeCompare(right, "en"));
    const clusterEdges = edges.filter(
      (edge) => paths.includes(edge.left) && paths.includes(edge.right),
    );
    near.push({
      paths,
      similarity: Number(
        Math.min(...clusterEdges.map((edge) => edge.similarity)).toFixed(6),
      ),
    });
  }

  near.sort((left, right) => left.paths[0].localeCompare(right.paths[0], "en"));
  return {
    exact,
    near,
    normalization: {
      case: "lowercase",
      link_destinations: "excluded",
      shingle_size_tokens: 5,
      similarity_threshold: 0.95,
      whitespace: "collapsed",
    },
  };
}

async function linkFindings(pluginRoot, markdownDocuments) {
  const findings = [];
  const resolvedPluginRoot = path.resolve(pluginRoot);

  for (const document of markdownDocuments) {
    for (const match of document.text.matchAll(MARKDOWN_LINK_PATTERN)) {
      const target = match[2];
      if (
        target.startsWith("#") ||
        target.startsWith("/") ||
        target.startsWith("$") ||
        EXTERNAL_TARGET_PATTERN.test(target)
      ) {
        continue;
      }
      const pathOnly = target.split("#", 1)[0].split("?", 1)[0];
      if (!pathOnly) {
        continue;
      }
      const resolvedTarget = path.resolve(
        path.dirname(path.join(resolvedPluginRoot, document.path)),
        decodeURIComponent(pathOnly),
      );
      const relativeToRoot = path.relative(resolvedPluginRoot, resolvedTarget);
      if (
        relativeToRoot === ".." ||
        relativeToRoot.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeToRoot)
      ) {
        findings.push({
          kind: "escaping",
          source: document.path,
          target,
        });
        continue;
      }
      try {
        await access(resolvedTarget);
      } catch {
        findings.push({
          kind: "missing",
          source: document.path,
          target,
        });
      }
    }
  }

  findings.sort(
    (left, right) =>
      left.source.localeCompare(right.source, "en") ||
      left.kind.localeCompare(right.kind, "en") ||
      left.target.localeCompare(right.target, "en"),
  );
  return findings;
}

export async function auditContext({ pluginRoot, revision }) {
  if (!pluginRoot || !revision) {
    throw new Error("auditContext requires explicit pluginRoot and revision");
  }

  const resolvedRoot = path.resolve(pluginRoot);
  const allFiles = await listFiles(resolvedRoot);
  const relativeFiles = allFiles.map((absolutePath) => ({
    absolutePath,
    path: path.relative(resolvedRoot, absolutePath).split(path.sep).join("/"),
  }));
  const textByPath = new Map();
  async function text(relativePath) {
    if (!textByPath.has(relativePath)) {
      const entry = relativeFiles.find((candidate) => candidate.path === relativePath);
      if (!entry) {
        return null;
      }
      textByPath.set(relativePath, await readFile(entry.absolutePath, "utf8"));
    }
    return textByPath.get(relativePath);
  }

  const sharedBootstrapPaths = relativeFiles
    .map((entry) => entry.path)
    .filter((relativePath) => relativePath === "hooks/bootstrap-context.md");
  const adapterPaths = relativeFiles
    .map((entry) => entry.path)
    .filter((relativePath) =>
      /^hooks\/bootstrap-context-(?:claude|codex|pi)\.md$/.test(relativePath),
    );
  const skillPaths = relativeFiles
    .map((entry) => entry.path)
    .filter((relativePath) => /^skills\/[^/]+\/SKILL\.md$/.test(relativePath));
  const referencePaths = relativeFiles
    .map((entry) => entry.path)
    .filter((relativePath) => /^skills\/.+\/references\/.+\.md$/.test(relativePath));
  const agentPaths = relativeFiles
    .map((entry) => entry.path)
    .filter((relativePath) => /^agents\/[^/]+\.md$/.test(relativePath));

  async function measurements(paths) {
    return Promise.all(
      paths.map(async (relativePath) =>
        fileMeasurement(relativePath, await text(relativePath)),
      ),
    );
  }

  const bootstrapFiles = await measurements(sharedBootstrapPaths);
  const adapterFiles = await measurements(adapterPaths);
  const skillDescriptionFiles = [];
  const skillBodyFiles = [];
  for (const relativePath of skillPaths) {
    const parsed = parseFrontmatter(await text(relativePath));
    skillDescriptionFiles.push(
      fileMeasurement(relativePath, parsed.description),
    );
    skillBodyFiles.push(fileMeasurement(relativePath, parsed.body));
  }
  const referenceFiles = await measurements(referencePaths);
  const agentFiles = await measurements(agentPaths);

  const routerPath = "skills/using-itsolpowers/SKILL.md";
  const routerGuidePath = "skills/using-itsolpowers/references/guide.md";
  const routerFiles = skillBodyFiles.filter((file) => file.path === routerPath);
  const routerGuideFiles = referenceFiles.filter(
    (file) => file.path === routerGuidePath,
  );

  let codexDefaultPrompt = [];
  const codexManifestText = await text(".codex-plugin/plugin.json");
  if (codexManifestText !== null) {
    try {
      const manifest = JSON.parse(codexManifestText);
      if (Array.isArray(manifest?.interface?.defaultPrompt)) {
        codexDefaultPrompt = manifest.interface.defaultPrompt.filter(
          (instruction) => typeof instruction === "string",
        );
      }
    } catch (error) {
      throw new Error(`invalid .codex-plugin/plugin.json: ${error.message}`);
    }
  }
  const codexPromptFiles = codexDefaultPrompt.map((instruction, index) =>
    fileMeasurement(
      `.codex-plugin/plugin.json#/interface/defaultPrompt/${index}`,
      instruction,
    ),
  );

  const referenceDocuments = await Promise.all(
    referencePaths.map(async (relativePath) => {
      const contents = await text(relativePath);
      const normalized = normalizeContextText(contents);
      return {
        normalized,
        path: relativePath,
        sha256: sha256(normalized),
      };
    }),
  );
  const markdownDocuments = await Promise.all(
    relativeFiles
      .map((entry) => entry.path)
      .filter((relativePath) => relativePath.endsWith(".md"))
      .map(async (relativePath) => ({
        path: relativePath,
        text: await text(relativePath),
      })),
  );

  const metrics = {
    adapters: metric(adapterFiles),
    agents: metric(agentFiles),
    bootstrap: metric(bootstrapFiles),
    codex_default_prompt: metric(codexPromptFiles, {
      instruction_count: codexDefaultPrompt.length,
    }),
    references: metric(referenceFiles),
    router: metric(routerFiles),
    router_guide: metric(routerGuideFiles),
    skill_bodies: metric(skillBodyFiles),
    skill_descriptions: metric(skillDescriptionFiles),
  };
  const totalSurfaces = [
    metrics.bootstrap,
    metrics.adapters,
    metrics.codex_default_prompt,
    metrics.skill_descriptions,
    metrics.skill_bodies,
    metrics.references,
    metrics.agents,
  ];
  const findings = await linkFindings(resolvedRoot, markdownDocuments);

  return {
    audit_schema_version: "1.0.0",
    duplicates: duplicateFindings(referenceDocuments),
    links: {
      finding_count: findings.length,
      findings,
    },
    metrics,
    plugin_root: resolvedRoot,
    revision,
    totals: {
      measured_files: totalSurfaces.reduce(
        (total, surface) => total + surface.file_count,
        0,
      ),
      measured_words: totalSurfaces.reduce(
        (total, surface) => total + surface.word_count,
        0,
      ),
    },
  };
}

export function formatAuditHuman(report) {
  const lines = [
    "ITSOL Powers context audit",
    `Revision: ${report.revision}`,
    `Plugin root: ${report.plugin_root}`,
    `Total measured files: ${report.totals.measured_files}`,
    `Total measured words: ${report.totals.measured_words}`,
    "",
    "Surface metrics:",
  ];

  for (const key of [
    "bootstrap",
    "adapters",
    "router",
    "router_guide",
    "codex_default_prompt",
    "skill_descriptions",
    "skill_bodies",
    "references",
    "agents",
  ]) {
    const surface = report.metrics[key];
    const instructions =
      key === "codex_default_prompt"
        ? `, ${surface.instruction_count} instructions`
        : "";
    lines.push(
      `- ${key}: ${surface.file_count} files, ${surface.word_count} words${instructions}`,
    );
  }

  lines.push(
    "",
    `Exact duplicate clusters: ${report.duplicates.exact.length}`,
    `Near-duplicate clusters (>=0.95): ${report.duplicates.near.length}`,
    `Link findings: ${report.links.findings.length}`,
  );
  for (const finding of report.links.findings) {
    lines.push(
      `- ${finding.kind}: ${finding.source} -> ${finding.target}`,
    );
  }
  return `${lines.join("\n")}\n`;
}
