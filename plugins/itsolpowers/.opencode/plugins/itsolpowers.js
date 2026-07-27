/** ITSOL Powers adapter for OpenCode. */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, '../..');
const skillsDir = path.join(pluginRoot, 'skills');
const bootstrapPath = path.join(pluginRoot, 'hooks', 'bootstrap-context.md');
const profilePath = path.join(pluginRoot, 'context', 'context-profiles.json');
const openCodeBootstrapMarker = '<!-- itsolpowers:opencode-bootstrap:v1 -->';
const profileNames = new Set(['frontier', 'compatibility']);
const requiredInvariants = Object.freeze([
  'workflow-authority',
  'repository-restrictions',
  'protected-actions',
  'deterministic-contracts',
  'tool-hook-contracts',
  'honest-incomplete-status',
  'nested-delegation-prohibition'
]);
const requiredProfileFields = Object.freeze([
  'default_small_task_execution',
  'default_verifier_fanout',
  'delegation',
  'description',
  'explicit_scaffolding',
  'guidance',
  'review',
  'verification'
]);
const expectedProfileSemantics = Object.freeze({
  frontier: Object.freeze({
    verification: 'risk-proportionate',
    review: 'material-risk-or-uncertainty',
    delegation: 'independent-work-with-material-value'
  }),
  compatibility: Object.freeze({
    verification: 'explicit-focused-and-wider',
    review: 'explicit-trigger-and-response',
    delegation: 'explicit-bounded-packets'
  })
});

const toolMapping = `**Tool Mapping for OpenCode:**
- Load bundled skills with the native \`skill\` tool. Prefer \`itsolpowers/<skill-name>\` when namespaced; otherwise use the frontmatter name.
- Map \`Read\`, \`Write\`, \`Edit\`, \`Bash\`, and task tracking to native equivalents.
- Map authorized ITSOL delegation to OpenCode's native Task/@agent surface; delegated agents must use \`permission.task: deny\` and never call Pi \`itsol_*\` tools.
- When a selected skill requests a read-only Task/@agent panel or application-aware Task/@agent packets, use the native Task/@agent surface with its stated permissions.
- OpenCode has no portable reasoning-effort or stop-veto contract here; those controls remain advisory and the parent validates child evidence.`;

const fallbackProfileDocument = {
  invariants: [
    'workflow-authority',
    'repository-restrictions',
    'protected-actions',
    'deterministic-contracts',
    'tool-hook-contracts',
    'honest-incomplete-status',
    'nested-delegation-prohibition'
  ],
  profiles: {
    compatibility: {
      guidance: [
        'Use explicit RED or replacement evidence, focused and wider verification, bounded task packets, and honest completion status.'
      ]
    }
  }
};

const normalizedProfile = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : undefined;

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const assertExactKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} keys must be exactly: ${wanted.join(', ')}`);
  }
};

const assertNonEmptyString = (value, label) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
};

const assertUniqueStringArray = (value, label, expected) => {
  if (
    !Array.isArray(value)
    || value.length === 0
    || value.some((item) => typeof item !== 'string' || item.trim().length === 0)
    || new Set(value).size !== value.length
  ) {
    throw new Error(`${label} must be a non-empty array of unique non-empty strings`);
  }
  if (
    expected
    && (
      value.length !== expected.length
      || expected.some((item) => !value.includes(item))
    )
  ) {
    throw new Error(`${label} does not match the required contract`);
  }
};

export const validateContextProfileDocument = (document) => {
  if (!isRecord(document) || document.schema_version !== '1.0.0') {
    throw new Error('context profile document must use schema 1.0.0');
  }
  if (!isRecord(document.selection)) {
    throw new Error('selection must be an object');
  }
  assertExactKeys(
    document.selection,
    ['precedence', 'environment_variable', 'provider_name_is_capability', 'invalid_input'],
    'selection'
  );
  if (
    JSON.stringify(document.selection.precedence)
    !== JSON.stringify([
      'explicit-task',
      'explicit-environment',
      'validated-runtime-capability',
      'compatibility-fallback'
    ])
    || document.selection.environment_variable !== 'ITSOLPOWERS_CONTEXT_PROFILE'
    || document.selection.provider_name_is_capability !== false
    || !isRecord(document.selection.invalid_input)
    || document.selection.invalid_input.profile !== 'compatibility'
    || document.selection.invalid_input.surface_warning !== true
  ) {
    throw new Error('selection contract is invalid');
  }
  assertExactKeys(document.selection.invalid_input, ['profile', 'surface_warning'], 'selection.invalid_input');
  assertUniqueStringArray(document.invariants, 'invariants', requiredInvariants);

  if (!isRecord(document.profiles)) {
    throw new Error('profiles must be an object');
  }
  assertExactKeys(document.profiles, profileNames, 'profiles');
  for (const name of profileNames) {
    const profile = document.profiles[name];
    if (!isRecord(profile)) {
      throw new Error(`profiles.${name} must be an object`);
    }
    assertExactKeys(profile, requiredProfileFields, `profiles.${name}`);
    assertNonEmptyString(profile.description, `profiles.${name}.description`);
    for (const field of ['verification', 'review', 'delegation']) {
      if (profile[field] !== expectedProfileSemantics[name][field]) {
        throw new Error(
          `profiles.${name}.${field} must equal ${expectedProfileSemantics[name][field]}`
        );
      }
    }
    if (
      profile.default_small_task_execution !== 'inline'
      || profile.default_verifier_fanout !== false
      || profile.explicit_scaffolding !== (name === 'compatibility')
    ) {
      throw new Error(`profiles.${name} execution defaults are invalid`);
    }
    assertUniqueStringArray(profile.guidance, `profiles.${name}.guidance`);
  }
  return document;
};

export const detectExplicitTaskProfile = (prompt) => {
  if (typeof prompt !== 'string') return undefined;
  let latest;
  for (const pattern of [
    /\bITSOLPOWERS_CONTEXT_PROFILE\s*=\s*([a-z0-9-]+)/gi,
    /\bcontext\s+profile\s*[:=]\s*([a-z0-9-]+)/gi,
    /\bunder\s+(?:the\s+)?([a-z0-9-]+)\s+(?:context\s+)?profile\b/gi
  ]) {
    for (const match of prompt.matchAll(pattern)) {
      if (!latest || (match.index ?? -1) > latest.index) {
        latest = { index: match.index ?? -1, value: normalizedProfile(match[1]) };
      }
    }
  }
  return latest?.value;
};

export const detectLatestExplicitTaskProfile = (messages) => {
  if (!Array.isArray(messages)) return undefined;
  const message = messages.findLast(
    (candidate) =>
      candidate?.info?.role === 'user'
      && Array.isArray(candidate.parts)
  );
  if (!message) return undefined;
  const prompt = message.parts
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('\n');
  return detectExplicitTaskProfile(prompt);
};

export const resolveContextProfile = ({
  taskProfile,
  environmentProfile = process.env.ITSOLPOWERS_CONTEXT_PROFILE,
  runtimeSignal,
  providerName: _providerName
} = {}) => {
  const candidates = [
    ['explicit-task', taskProfile],
    ['explicit-environment', environmentProfile]
  ];
  for (const [source, candidate] of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const name = normalizedProfile(candidate);
    if (profileNames.has(name)) return { name, source, warning: null };
    return {
      name: 'compatibility',
      source: `invalid-${source}`,
      warning: `Unknown ITSOL context profile "${String(candidate)}"; using compatibility.`
    };
  }

  if (runtimeSignal?.validated === true) {
    const name = normalizedProfile(runtimeSignal.profile);
    if (profileNames.has(name)) {
      return { name, source: 'validated-runtime-capability', warning: null };
    }
    return {
      name: 'compatibility',
      source: 'invalid-validated-runtime-capability',
      warning: `Validated runtime supplied unknown ITSOL context profile "${String(runtimeSignal.profile)}"; using compatibility.`
    };
  }

  return { name: 'compatibility', source: 'compatibility-fallback', warning: null };
};

let bootstrapTemplateCache;
let profileDocumentCache;

const getProfileDocument = () => {
  if (profileDocumentCache !== undefined) return profileDocumentCache;
  try {
    const parsed = validateContextProfileDocument(
      JSON.parse(fs.readFileSync(profilePath, 'utf8'))
    );
    profileDocumentCache = { document: parsed, warning: null };
  } catch (error) {
    profileDocumentCache = {
      document: fallbackProfileDocument,
      warning: `ITSOL profile contract unavailable; using embedded compatibility guidance (${error.message}).`
    };
  }
  return profileDocumentCache;
};

const formatProfileContext = (selection) => {
  const loaded = getProfileDocument();
  const requestedProfile = loaded.document.profiles[selection.name];
  const effectiveSelection = requestedProfile
    ? selection
    : {
        name: 'compatibility',
        source: 'invalid-profile-contract',
        warning: `Selected profile "${selection.name}" is unavailable in the loaded contract; using compatibility.`
      };
  const profile = requestedProfile ?? loaded.document.profiles.compatibility;
  const warnings = [effectiveSelection.warning, loaded.warning].filter(Boolean);
  return [
    '**ITSOL Context Profile:**',
    `- Selected \`${effectiveSelection.name}\` via \`${effectiveSelection.source}\`.`,
    ...warnings.map((warning) => `- Warning: ${warning}`),
    ...profile.guidance.map((guidance) => `- ${guidance}`),
    `- Invariants: ${loaded.document.invariants.join(', ')}.`
  ].join('\n');
};

export const getBootstrapContent = (options = {}) => {
  if (bootstrapTemplateCache === undefined) {
    bootstrapTemplateCache = fs.existsSync(bootstrapPath)
      ? `${fs.readFileSync(bootstrapPath, 'utf8').trim()}\n\n${toolMapping}`
      : null;
  }
  if (!bootstrapTemplateCache) return null;
  const selection = resolveContextProfile(options);
  return `${openCodeBootstrapMarker}\n${bootstrapTemplateCache}\n\n${formatProfileContext(selection)}`;
};

export const ItsolPowersPlugin = async () => ({
  config: async (config) => {
    config.skills = config.skills || {};
    config.skills.paths = config.skills.paths || [];
    if (!config.skills.paths.includes(skillsDir)) config.skills.paths.push(skillsDir);
  },

  'experimental.chat.messages.transform': async (_input, output) => {
    const firstUser = output.messages.find((message) => message.info.role === 'user');
    if (!firstUser || !firstUser.parts.length) return;
    const bootstrap = getBootstrapContent({
      taskProfile: detectLatestExplicitTaskProfile(output.messages)
    });
    if (!bootstrap) return;

    const existingIndex = firstUser.parts.findIndex(
      (part) =>
        part.type === 'text'
        && typeof part.text === 'string'
        && part.text.startsWith(`${openCodeBootstrapMarker}\n`)
    );
    if (existingIndex >= 0) {
      firstUser.parts[existingIndex] = {
        ...firstUser.parts[existingIndex],
        type: 'text',
        text: bootstrap
      };
    } else {
      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    }
  }
});

export default ItsolPowersPlugin;
