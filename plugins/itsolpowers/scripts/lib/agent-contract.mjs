import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const BASELINE_INVENTORY_FILE = "_baseline-semantic-inventory.json";
export const DEFAULT_MODEL = "sonnet";
export const DEFAULT_EFFORT = "medium";

const STANDARD_RESPONSE_ENVELOPE = `## Required Response Envelope

End with exactly one ordered, column-one envelope without a code fence. Use \`completed\` only when the delegated acceptance criteria and verification are satisfied.

Status: completed|partial|blocked|failed
Verification: <non-empty command or evidence summary; use "not run: <reason>" only when not completed>
Unverified: <non-empty gap summary or "none">
`;

const COMPACT_RESPONSE_ENVELOPE = `End with exactly one envelope:

Status: completed|partial|blocked|failed
Verification: <non-empty command or evidence summary; use "not run: <reason>" only when not completed>
Unverified: <non-empty gap summary or "none">
`;

const RESPONSE_ENVELOPES = Object.freeze({
  standard: STANDARD_RESPONSE_ENVELOPE,
  compact: COMPACT_RESPONSE_ENVELOPE,
});

const AGENT_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOURCE_KEYS = new Set([
  "name",
  "description",
  "skills",
  "tools",
  "disallowedTools",
  "responseStyle",
  "template",
  "title",
]);
const GENERATED_KEYS = new Set([
  "name",
  "description",
  "model",
  "effort",
  "skills",
  "tools",
  "disallowedTools",
]);

const fail = (relativePath, message) => {
  throw new Error(`${relativePath}: ${message}`);
};

const toPosix = (value) => value.split(path.sep).join("/");

const lstatIfExists = (target) => {
  try {
    return fs.lstatSync(target);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

const lstatBigIntIfExists = (target) => {
  try {
    return fs.lstatSync(target, { bigint: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

const assertContained = (parent, target, relativePath) => {
  const relative = path.relative(parent, target);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
    return;
  }
  fail(relativePath, "path escapes its verified parent");
};

const verifyPluginRoot = (pluginRoot) => {
  const absolute = path.resolve(pluginRoot);
  const stat = lstatIfExists(absolute);
  if (!stat) fail(".", "plugin root does not exist");
  if (stat.isSymbolicLink()) fail(".", "plugin root must not be a symbolic link");
  if (!stat.isDirectory()) fail(".", "plugin root must be a directory");
  return { absolute, real: fs.realpathSync(absolute) };
};

const verifyChildDirectory = (plugin, segments, relativePath) => {
  const absolute = path.join(plugin.absolute, ...segments);
  const stat = lstatIfExists(absolute);
  if (!stat) fail(relativePath, "directory does not exist");
  if (stat.isSymbolicLink()) fail(relativePath, "directory must not be a symbolic link");
  if (!stat.isDirectory()) fail(relativePath, "path must be a directory");
  const real = fs.realpathSync(absolute);
  assertContained(plugin.real, real, relativePath);
  const expected = path.join(plugin.real, ...segments);
  if (real !== expected) fail(relativePath, "directory does not resolve to its expected plugin path");
  return { absolute, real, relativePath };
};

const verifyExistingRegularFile = (directory, filename, relativePath) => {
  const absolute = path.join(directory.absolute, filename);
  const stat = lstatIfExists(absolute);
  if (!stat) return null;
  if (stat.isSymbolicLink()) fail(relativePath, "symbolic link is not allowed");
  if (!stat.isFile()) fail(relativePath, "existing target must be a regular file");
  const real = fs.realpathSync(absolute);
  assertContained(directory.real, real, relativePath);
  if (path.dirname(real) !== directory.real) fail(relativePath, "file does not resolve inside its verified directory");
  return { absolute, real, stat };
};

const readVerifiedRegularFile = (directory, filename, relativePath) => {
  const verified = verifyExistingRegularFile(directory, filename, relativePath);
  if (!verified) return null;
  let descriptor;
  try {
    descriptor = fs.openSync(
      verified.absolute,
      fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0),
    );
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile()) fail(relativePath, "opened target must be a regular file");
    if (opened.dev !== verified.stat.dev || opened.ino !== verified.stat.ino) {
      fail(relativePath, "file identity changed during read");
    }
    return { ...verified, content: fs.readFileSync(descriptor, "utf8") };
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
};

const verifyDirectoryIdentity = (directory) => {
  const stat = lstatIfExists(directory.absolute);
  if (!stat) fail(directory.relativePath, "directory disappeared during generation");
  if (stat.isSymbolicLink()) fail(directory.relativePath, "directory must not be a symbolic link");
  if (!stat.isDirectory()) fail(directory.relativePath, "path must be a directory");
  if (fs.realpathSync(directory.absolute) !== directory.real) {
    fail(directory.relativePath, "directory identity changed during generation");
  }
};

const parseScalar = (value, relativePath, key) => {
  const trimmed = value.trim();
  if (!trimmed) fail(relativePath, `${key} must not be empty`);
  if (trimmed.startsWith('"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== "string" || !parsed) fail(relativePath, `${key} must be a non-empty string`);
      return parsed;
    } catch (error) {
      fail(relativePath, `${key} has invalid quoted value: ${error.message}`);
    }
  }
  return trimmed;
};

const parseFrontmatter = (text, relativePath) => {
  if (text.includes("\r")) fail(relativePath, "CRLF is not supported; use LF");
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) fail(relativePath, "missing YAML frontmatter");

  const fields = new Map();
  const lines = match[1].split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const field = line.match(/^([A-Za-z][A-Za-z0-9]*):(?: (.*))?$/);
    if (!field) fail(relativePath, `malformed frontmatter line ${index + 1}`);
    const [, key, inlineValue = ""] = field;
    if (fields.has(key)) fail(relativePath, `duplicate frontmatter key: ${key}`);

    if (key === "skills" && !inlineValue) {
      const items = [];
      while (index + 1 < lines.length && /^  - /.test(lines[index + 1])) {
        index += 1;
        const value = lines[index].slice(4).trim();
        if (!value) fail(relativePath, "skills contains an empty item");
        items.push(value);
      }
      fields.set(key, items);
      continue;
    }

    if (key === "skills" && /^\[.*\]$/.test(inlineValue.trim())) {
      const inner = inlineValue.trim().slice(1, -1).trim();
      fields.set(key, inner ? inner.split(",").map((item) => item.trim()) : []);
      continue;
    }

    fields.set(key, parseScalar(inlineValue, relativePath, key));
  }
  const body = match[2].startsWith("\n") ? match[2].slice(1) : match[2];
  return { fields, body };
};

const validateKeys = (fields, allowed, required, relativePath) => {
  for (const key of fields.keys()) {
    if (!allowed.has(key)) fail(relativePath, `unsupported frontmatter key: ${key}`);
  }
  for (const key of required) {
    if (!fields.has(key)) fail(relativePath, `missing frontmatter key: ${key}`);
  }
};

const validateSkills = (skills, relativePath) => {
  if (!Array.isArray(skills) || skills.length === 0) fail(relativePath, "skills must contain at least one item");
  const seen = new Set();
  for (const skill of skills) {
    if (!/^itsolpowers:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill)) {
      fail(relativePath, `invalid skill identifier: ${skill}`);
    }
    if (seen.has(skill)) fail(relativePath, `duplicate skill: ${skill}`);
    seen.add(skill);
  }
  return skills;
};

const validateBody = (body, relativePath) => {
  if (!body.startsWith("# ")) fail(relativePath, "body must start with one H1 heading");
  if (!body.trim()) fail(relativePath, "body must not be empty");
  return `${body.trimEnd()}\n`;
};

export const buildSpecialistBody = ({ name, title, scope, writable }) => {
  const resultKind = writable
    ? "a focused implementation or investigation result"
    : "a read-only specialist report";
  const permissionRule = writable
    ? "You may edit only when the delegation explicitly gives you ownership of a narrow file set. Do not touch unrelated files, and do not revert changes made by the user or other agents."
    : "Do not modify files. Use read/search commands and safe inspection commands only; return findings and verification gaps.";
  return `# ${title} Subagent

You are the delegated ITSOL specialist for \`${name}\`. Produce ${resultKind} in a separate context so the main agent can keep the conversation focused.

## Required Context

1. Treat \`itsolpowers:${name}\` as preloaded. Follow that skill before applying generic engineering judgment.
2. If the preloaded skill is missing, read \`\${CLAUDE_PLUGIN_ROOT}/skills/${name}/SKILL.md\` and follow its [references/guide.md](\${CLAUDE_PLUGIN_ROOT}/skills/${name}/references/guide.md) instructions.
3. Load only the reference files relevant to the delegated scope. Do not load the entire ITSOL knowledge base unless the task explicitly requires it.

## Working Rules

- Work only on the delegated area: ${scope}
- ${permissionRule}
- Prefer concrete evidence from code, tests, configs, logs, schemas, API contracts, or diffs over assumptions.
- When the task is broad, narrow it into independent checks and run them systematically.
- Do not spawn nested subagents or invoke external agent CLIs such as \`codex exec\` or \`claude\`. If this task splits further, return the recommended split and let the main agent orchestrate it.
- Call out uncertainty explicitly when evidence is incomplete.

## Output Contract

Return a compact report for the main agent with:

1. Scope inspected
2. Key findings or implementation/debugging result
3. File references and affected behavior
4. Verification performed
5. Residual risks, missing tests, or follow-up agents needed
`;
};

const validateToolPolicy = (tools, disallowedTools, relativePath) => {
  const allowed = tools.split(",").map((item) => item.trim()).filter(Boolean);
  const denied = disallowedTools.split(",").map((item) => item.trim()).filter(Boolean);
  if (allowed.length === 0 || denied.length === 0) fail(relativePath, "tool policies must not be empty");
  if (new Set(allowed).size !== allowed.length) fail(relativePath, "tools contains duplicates");
  if (new Set(denied).size !== denied.length) fail(relativePath, "disallowedTools contains duplicates");
  if (allowed.includes("Agent")) fail(relativePath, "tools must not expose Agent");
  if (!denied.includes("Agent")) fail(relativePath, "disallowedTools must include Agent");
};

const contractFromFields = (fields, body, relativePath, source) => {
  const required = source
    ? ["name", "description", "skills", "tools", "disallowedTools"]
    : ["name", "description", "model", "effort", "skills", "tools", "disallowedTools"];
  validateKeys(fields, source ? SOURCE_KEYS : GENERATED_KEYS, required, relativePath);

  const name = fields.get("name");
  if (!AGENT_NAME.test(name)) fail(relativePath, `invalid agent name: ${name}`);
  const skills = validateSkills(fields.get("skills"), relativePath);
  const tools = fields.get("tools");
  const disallowedTools = fields.get("disallowedTools");
  validateToolPolicy(tools, disallowedTools, relativePath);

  if (!source) {
    if (fields.get("model") !== DEFAULT_MODEL) fail(relativePath, `model must be ${DEFAULT_MODEL}`);
    if (fields.get("effort") !== DEFAULT_EFFORT) fail(relativePath, `effort must be ${DEFAULT_EFFORT}`);
  }

  const responseStyle = source ? fields.get("responseStyle") ?? "standard" : undefined;
  if (source && !(responseStyle in RESPONSE_ENVELOPES)) {
    fail(relativePath, `unsupported responseStyle: ${responseStyle}`);
  }

  const template = source ? fields.get("template") ?? "custom" : "custom";
  let title;
  let resolvedBody;
  if (template === "specialist") {
    title = fields.get("title");
    if (!title) fail(relativePath, "specialist template requires title");
    if (body.trim()) fail(relativePath, "specialist template must not duplicate generated body");
    const scope = fields.get("description").match(/Skill scope: ([\s\S]+)$/)?.[1];
    if (!scope) fail(relativePath, "specialist template description must end with Skill scope");
    resolvedBody = buildSpecialistBody({
      name,
      title,
      scope,
      writable: tools.split(",").map((item) => item.trim()).includes("Write"),
    });
  } else if (template === "custom") {
    if (fields.has("title")) fail(relativePath, "custom template must not define title");
    resolvedBody = validateBody(body, relativePath);
  } else {
    fail(relativePath, `unsupported template: ${template}`);
  }

  return {
    name,
    description: fields.get("description"),
    model: DEFAULT_MODEL,
    effort: DEFAULT_EFFORT,
    skills,
    tools,
    disallowedTools,
    responseStyle,
    template,
    title,
    body: resolvedBody,
    sourcePath: relativePath,
  };
};

export const parseAgentSource = (text, relativePath) => {
  const { fields, body } = parseFrontmatter(text, relativePath);
  return contractFromFields(fields, body, relativePath, true);
};

const stripGeneratedEnvelope = (body, relativePath) => {
  for (const [responseStyle, envelope] of Object.entries(RESPONSE_ENVELOPES)) {
    const suffix = `\n${envelope}`;
    if (body.endsWith(suffix)) {
      return {
        responseStyle,
        body: `${body.slice(0, -suffix.length).trimEnd()}\n`,
      };
    }
  }
  fail(relativePath, "terminal response envelope is not canonical");
};

export const parseGeneratedAgent = (text, relativePath) => {
  const { fields, body } = parseFrontmatter(text, relativePath);
  const stripped = stripGeneratedEnvelope(body, relativePath);
  return {
    ...contractFromFields(fields, stripped.body, relativePath, false),
    responseStyle: stripped.responseStyle,
  };
};

export const renderAgentContract = (contract) => {
  const skills = contract.skills.map((skill) => `  - ${skill}`).join("\n");
  const envelope = RESPONSE_ENVELOPES[contract.responseStyle];
  if (!envelope) fail(contract.sourcePath, `unsupported responseStyle: ${contract.responseStyle}`);
  return `---
name: ${contract.name}
description: ${JSON.stringify(contract.description)}
model: ${DEFAULT_MODEL}
effort: ${DEFAULT_EFFORT}
skills:
${skills}
tools: ${contract.tools}
disallowedTools: ${contract.disallowedTools}
---

${contract.body.trimEnd()}

${envelope}`;
};

export const renderAgentSource = (contract) => {
  const skills = contract.skills.map((skill) => `  - ${skill}`).join("\n");
  const responseStyle = contract.responseStyle === "standard"
    ? ""
    : `\nresponseStyle: ${contract.responseStyle}`;
  const template = contract.template === "specialist"
    ? `\ntemplate: specialist\ntitle: ${contract.title}`
    : "";
  const body = contract.template === "specialist" ? "\n" : `\n\n${contract.body}`;
  return `---
name: ${contract.name}
description: ${JSON.stringify(contract.description)}
skills:
${skills}
tools: ${contract.tools}
disallowedTools: ${contract.disallowedTools}${responseStyle}${template}
---${body}`;
};

const semanticRecord = (contract) => ({
  name: contract.name,
  description: contract.description,
  model: contract.model,
  effort: contract.effort,
  skills: [...contract.skills],
  tools: contract.tools,
  disallowedTools: contract.disallowedTools,
  responseStyle: contract.responseStyle,
  responseEnvelope: RESPONSE_ENVELOPES[contract.responseStyle],
  body: contract.body,
});

export const semanticHash = (contract) => crypto
  .createHash("sha256")
  .update(JSON.stringify(semanticRecord(contract)))
  .digest("hex");

export const discoverRuntimeAgentFiles = (pluginRoot) => {
  const plugin = verifyPluginRoot(pluginRoot);
  const agentsRoot = verifyChildDirectory(plugin, ["agents"], "agents");
  const files = [];
  for (const entry of fs.readdirSync(agentsRoot.absolute, { withFileTypes: true })) {
    if (!entry.name.endsWith(".md")) continue;
    verifyExistingRegularFile(agentsRoot, entry.name, toPosix(path.join("agents", entry.name)));
    files.push(entry.name);
  }
  return files.sort();
};

export const loadAgentSources = (pluginRoot) => {
  const plugin = verifyPluginRoot(pluginRoot);
  const sourceRoot = verifyChildDirectory(
    plugin,
    ["scripts", "agent-sources"],
    "scripts/agent-sources",
  );
  const files = [];
  for (const entry of fs.readdirSync(sourceRoot.absolute, { withFileTypes: true })) {
    if (!entry.name.endsWith(".md")) continue;
    verifyExistingRegularFile(
      sourceRoot,
      entry.name,
      toPosix(path.join("scripts", "agent-sources", entry.name)),
    );
    files.push(entry.name);
  }
  files.sort();
  const names = new Map();
  return files.map((filename) => {
    const relativePath = toPosix(path.join("scripts", "agent-sources", filename));
    const verified = readVerifiedRegularFile(sourceRoot, filename, relativePath);
    const contract = parseAgentSource(
      verified.content,
      relativePath,
    );
    const expectedFilename = `${contract.name}.md`;
    if (names.has(contract.name)) {
      fail(relativePath, `duplicate agent name: ${contract.name} (also ${names.get(contract.name)})`);
    }
    if (filename !== expectedFilename) {
      fail(relativePath, `source filename must match agent name (${expectedFilename})`);
    }
    names.set(contract.name, relativePath);
    return contract;
  });
};

const loadBaselineInventory = (pluginRoot) => {
  const plugin = verifyPluginRoot(pluginRoot);
  const sourceRoot = verifyChildDirectory(
    plugin,
    ["scripts", "agent-sources"],
    "scripts/agent-sources",
  );
  const relativePath = toPosix(path.join("scripts", "agent-sources", BASELINE_INVENTORY_FILE));
  const verified = readVerifiedRegularFile(sourceRoot, BASELINE_INVENTORY_FILE, relativePath);
  if (!verified) fail(relativePath, "baseline inventory does not exist");
  let parsed;
  try {
    parsed = JSON.parse(verified.content);
  } catch (error) {
    fail(relativePath, `invalid JSON: ${error.message}`);
  }
  if (
    parsed?.schema_version !== 1
    || !parsed.agents
    || typeof parsed.agents !== "object"
    || Array.isArray(parsed.agents)
  ) {
    fail(relativePath, "expected schema_version 1 and an agents object");
  }
  for (const [filename, record] of Object.entries(parsed.agents)) {
    if (!AGENT_NAME.test(filename.replace(/\.md$/, "")) || !filename.endsWith(".md")) {
      fail(relativePath, `invalid inventory filename: ${filename}`);
    }
    if (
      !record
      || typeof record !== "object"
      || typeof record.raw_sha256 !== "string"
      || !/^[a-f0-9]{64}$/.test(record.raw_sha256)
      || typeof record.semantic_sha256 !== "string"
      || !/^[a-f0-9]{64}$/.test(record.semantic_sha256)
    ) {
      fail(relativePath, `invalid hash record for ${filename}`);
    }
  }
  return parsed.agents;
};

const fsyncDirectoryBestEffort = (directory) => {
  let descriptor;
  try {
    descriptor = fs.openSync(directory, fs.constants.O_RDONLY);
    fs.fsyncSync(descriptor);
  } catch (error) {
    if (!["EINVAL", "ENOTSUP", "EISDIR", "EPERM"].includes(error.code)) throw error;
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
};

const sameFileIdentity = (stat, identity) => (
  stat.dev === identity.dev && stat.ino === identity.ino
);

const verifyOwnedTemporaryFile = (temporary, identity, relativePath) => {
  const active = lstatBigIntIfExists(temporary);
  if (
    !active
    || active.isSymbolicLink()
    || !active.isFile()
    || !sameFileIdentity(active, identity)
  ) {
    fail(relativePath, "temporary file identity changed before rename");
  }

  let descriptor;
  try {
    descriptor = fs.openSync(
      temporary,
      fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0),
    );
    const reopened = fs.fstatSync(descriptor, { bigint: true });
    if (!reopened.isFile() || !sameFileIdentity(reopened, identity)) {
      fail(relativePath, "temporary file identity changed before rename");
    }
  } catch (error) {
    if (error.message?.includes("temporary file identity changed before rename")) throw error;
    fail(relativePath, "temporary file identity changed before rename");
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
};

const cleanupOwnedTemporaryFile = (temporary, identity) => {
  if (!identity) return;
  const active = lstatBigIntIfExists(temporary);
  if (
    !active
    || active.isSymbolicLink()
    || !active.isFile()
    || !sameFileIdentity(active, identity)
  ) {
    return;
  }
  fs.unlinkSync(temporary);
};

const atomicWriteAgentFile = ({
  pluginRoot,
  filename,
  content,
  testHooks,
}) => {
  if (!filename.endsWith(".md") || !AGENT_NAME.test(filename.slice(0, -3))) {
    fail(toPosix(path.join("agents", filename)), "invalid generated agent filename");
  }
  const plugin = verifyPluginRoot(pluginRoot);
  const agentsRoot = verifyChildDirectory(plugin, ["agents"], "agents");
  const relativePath = toPosix(path.join("agents", filename));
  const existing = verifyExistingRegularFile(agentsRoot, filename, relativePath);
  const target = path.join(agentsRoot.absolute, filename);
  const tempName = `.agent-contract-${filename}-${process.pid}-${crypto.randomBytes(12).toString("hex")}.tmp`;
  const temporary = path.join(agentsRoot.absolute, tempName);
  assertContained(agentsRoot.absolute, path.resolve(temporary), relativePath);

  let descriptor;
  let renamed = false;
  let temporaryIdentity;
  let temporaryIdentityMismatch = false;
  try {
    descriptor = fs.openSync(
      temporary,
      fs.constants.O_CREAT
        | fs.constants.O_EXCL
        | fs.constants.O_WRONLY
        | (fs.constants.O_NOFOLLOW ?? 0),
      existing ? existing.stat.mode & 0o777 : 0o644,
    );
    temporaryIdentity = fs.fstatSync(descriptor, { bigint: true });
    if (!temporaryIdentity.isFile()) fail(relativePath, "temporary target must be a regular file");
    assertContained(agentsRoot.real, fs.realpathSync(temporary), relativePath);
    if (testHooks?.afterOpen) testHooks.afterOpen(temporary, descriptor);
    fs.writeFileSync(descriptor, content, { encoding: "utf8" });
    fs.fchmodSync(descriptor, existing ? existing.stat.mode & 0o777 : 0o644);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;

    if (testHooks?.beforeRename) testHooks.beforeRename(temporary);
    verifyDirectoryIdentity(agentsRoot);
    verifyExistingRegularFile(agentsRoot, filename, relativePath);
    try {
      verifyOwnedTemporaryFile(temporary, temporaryIdentity, relativePath);
    } catch (error) {
      temporaryIdentityMismatch = true;
      throw error;
    }
    fs.renameSync(temporary, target);
    renamed = true;
    fsyncDirectoryBestEffort(agentsRoot.absolute);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (!renamed && !temporaryIdentityMismatch) {
      cleanupOwnedTemporaryFile(temporary, temporaryIdentity);
    }
  }
};

export const __testOnlyAtomicWriteAgentFile = (options) => atomicWriteAgentFile(options);

const validateBaselineParity = (contracts, inventory) => {
  const contractFiles = new Set(contracts.map((contract) => `${contract.name}.md`));
  for (const contract of contracts) {
    const filename = `${contract.name}.md`;
    if (!inventory[filename]) fail(contract.sourcePath, "agent is missing from baseline semantic inventory");
    const actual = semanticHash(contract);
    if (inventory[filename].semantic_sha256 !== actual) {
      fail(contract.sourcePath, "semantic content differs from frozen baseline inventory");
    }
  }
  for (const filename of Object.keys(inventory).sort()) {
    if (!contractFiles.has(filename)) {
      fail(toPosix(path.join("scripts", "agent-sources", filename)), "baseline agent source is missing");
    }
  }
};

export const synchronizeAgentContracts = ({ pluginRoot, check = false }) => {
  const contracts = loadAgentSources(pluginRoot);
  const inventory = loadBaselineInventory(pluginRoot);
  validateBaselineParity(contracts, inventory);

  const expected = new Map(
    contracts.map((contract) => [`${contract.name}.md`, renderAgentContract(contract)]),
  );
  const actualFiles = discoverRuntimeAgentFiles(pluginRoot);
  const unexpected = actualFiles.filter((filename) => !expected.has(filename));
  const issues = [];

  for (const filename of unexpected) {
    issues.push(`agents/${filename}: unexpected generated agent`);
  }
  for (const [filename, content] of expected) {
    const plugin = verifyPluginRoot(pluginRoot);
    const agentsRoot = verifyChildDirectory(plugin, ["agents"], "agents");
    const relativePath = toPosix(path.join("agents", filename));
    const verified = readVerifiedRegularFile(agentsRoot, filename, relativePath);
    if (!verified) {
      issues.push(`agents/${filename}: missing generated agent`);
      continue;
    }
    if (verified.content !== content) {
      issues.push(`agents/${filename}: generated content drift`);
    }
  }

  if (check) return { contracts, issues, written: [] };
  if (unexpected.length > 0) return { contracts, issues, written: [] };

  const written = [];
  for (const [filename, content] of expected) {
    const plugin = verifyPluginRoot(pluginRoot);
    const agentsRoot = verifyChildDirectory(plugin, ["agents"], "agents");
    const relativePath = toPosix(path.join("agents", filename));
    const verified = readVerifiedRegularFile(agentsRoot, filename, relativePath);
    if (!verified || verified.content !== content) {
      atomicWriteAgentFile({ pluginRoot, filename, content });
      written.push(`agents/${filename}`);
    }
  }
  return { contracts, issues: [], written };
};
