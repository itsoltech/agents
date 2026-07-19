import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const stops = Object.freeze({
  analysis: 10,
  'business-plan': 20,
  'technical-plan': 30,
  implementation: 40,
  'implementation-reviewed': 50,
  'integration-validated': 60,
  'pr-created': 70,
  'first-review-batch': 80,
  'qa-handoff': 90,
  'deployment-ready': 100
});

export const presets = Object.freeze({
  economy: Object.freeze({
    model_profile: 'economy',
    reasoning_profile: 'low',
    max_subagents: 0,
    max_parallel: 0,
    max_review_rounds: 0,
    stop_after: 'requested-result',
    budget_escalation: 'ask'
  }),
  standard: Object.freeze({
    model_profile: 'balanced',
    reasoning_profile: 'medium',
    max_subagents: 2,
    max_parallel: 2,
    max_review_rounds: 1,
    stop_after: 'implementation-reviewed',
    budget_escalation: 'ask'
  }),
  deep: Object.freeze({
    model_profile: 'frontier',
    reasoning_profile: 'high',
    max_subagents: 1,
    max_parallel: 1,
    max_review_rounds: 2,
    stop_after: 'integration-validated',
    budget_escalation: 'ask'
  })
});

const modelRank = { economy: 0, balanced: 1, frontier: 2 };
const reasoningRank = { low: 0, medium: 1, high: 2 };
const required = [
  'preset',
  'policy_sources',
  'model_profile',
  'model_control',
  'reasoning_profile',
  'reasoning_control',
  'max_subagents',
  'max_parallel',
  'max_review_rounds',
  'stop_after',
  'budget_escalation'
];

export const validatePolicy = (policy, capabilities = {}) => {
  const errors = [];
  for (const field of required) if (!(field in policy)) errors.push(`missing ${field}`);
  if (errors.length) return errors;

  if (![...Object.keys(presets), 'custom'].includes(policy.preset)) errors.push('invalid preset');
  if (!['economy', 'balanced', 'frontier'].includes(policy.model_profile)) errors.push('invalid model profile');
  if (!['low', 'medium', 'high'].includes(policy.reasoning_profile)) errors.push('invalid reasoning profile');
  if (!['enforced', 'advisory'].includes(policy.model_control)) errors.push('invalid model control');
  if (!['enforced', 'advisory'].includes(policy.reasoning_control)) errors.push('invalid reasoning control');
  if (!['ask', 'forbidden'].includes(policy.budget_escalation)) errors.push('invalid escalation');
  if (!policy.policy_sources || !['explicit-user-task-instruction', 'repo-default', 'agent-default'].includes(policy.policy_sources.base)) {
    errors.push('invalid policy source');
  }
  const constraints = Array.isArray(policy.policy_sources?.constraints) ? policy.policy_sources.constraints : [];
  if (!Array.isArray(policy.policy_sources?.constraints)) errors.push('invalid constraints');

  for (const [field, max] of [['max_subagents', 3], ['max_review_rounds', 2]]) {
    if (!Number.isInteger(policy[field]) || policy[field] < 0 || policy[field] > max) errors.push(`invalid ${field}`);
  }
  if (!Number.isInteger(policy.max_parallel) || policy.max_parallel < 0 || policy.max_parallel > policy.max_subagents) {
    errors.push('invalid max_parallel');
  }
  if (!(policy.stop_after in stops)) errors.push('unresolved or invalid stop_after');
  if (policy.model_control === 'enforced' && capabilities.model !== true) errors.push('unsupported model enforcement');
  if (policy.reasoning_control === 'enforced' && capabilities.reasoning !== true) errors.push('unsupported reasoning enforcement');

  const base = presets[policy.preset];
  if (base && constraints.length === 0) {
    for (const field of ['model_profile', 'reasoning_profile', 'max_subagents', 'max_parallel', 'max_review_rounds', 'stop_after', 'budget_escalation']) {
      if (field === 'stop_after' && base.stop_after === 'requested-result' && policy.stop_after in stops) continue;
      if (policy[field] !== base[field]) errors.push(`unconstrained ${policy.preset} mismatch: ${field}`);
    }
  } else if (base) {
    if (modelRank[policy.model_profile] > modelRank[base.model_profile]) errors.push('model ceiling expanded');
    if (reasoningRank[policy.reasoning_profile] > reasoningRank[base.reasoning_profile]) errors.push('reasoning ceiling expanded');
    for (const field of ['max_subagents', 'max_parallel', 'max_review_rounds']) {
      if (policy[field] > base[field]) errors.push(`${field} expanded`);
    }
    const baseStop = base.stop_after === 'requested-result' ? Infinity : stops[base.stop_after];
    if (stops[policy.stop_after] > baseStop) errors.push('stop_after expanded');
  }

  return errors;
};

const standard = {
  preset: 'standard',
  policy_sources: { base: 'agent-default', constraints: [] },
  model_profile: 'balanced',
  model_control: 'advisory',
  reasoning_profile: 'medium',
  reasoning_control: 'advisory',
  max_subagents: 2,
  max_parallel: 2,
  max_review_rounds: 1,
  stop_after: 'implementation-reviewed',
  budget_escalation: 'ask'
};

const economy = {
  ...standard,
  preset: 'economy',
  model_profile: 'economy',
  reasoning_profile: 'low',
  max_subagents: 0,
  max_parallel: 0,
  max_review_rounds: 0,
  stop_after: 'analysis'
};

const deep = {
  ...standard,
  preset: 'deep',
  model_profile: 'frontier',
  reasoning_profile: 'high',
  max_subagents: 1,
  max_parallel: 1,
  max_review_rounds: 2,
  stop_after: 'integration-validated'
};

assert.deepEqual(validatePolicy(standard), []);
assert.deepEqual(validatePolicy(economy), []);
assert.deepEqual(validatePolicy(deep), []);
assert.ok(validatePolicy({ ...standard, max_subagents: 99 }).length > 0);
assert.ok(validatePolicy({ ...standard, stop_after: undefined }).length > 0);
const missingStop = { ...standard };
delete missingStop.stop_after;
assert.ok(validatePolicy(missingStop).includes('missing stop_after'));
assert.ok(validatePolicy({ ...standard, model_control: 'enforced' }).includes('unsupported model enforcement'));
assert.ok(
  validatePolicy({ ...standard, reasoning_control: 'enforced' }).includes('unsupported reasoning enforcement')
);
assert.ok(validatePolicy({ ...standard, preset: 'custom', max_parallel: 4 }).length > 0);
assert.ok(
  validatePolicy({
    ...standard,
    policy_sources: { base: 'agent-default', constraints: ['test'] },
    stop_after: 'integration-validated'
  }).includes('stop_after expanded')
);
assert.ok(
  validatePolicy({
    ...standard,
    policy_sources: { base: 'agent-default', constraints: ['test'] },
    model_profile: 'frontier'
  }).includes('model ceiling expanded')
);
assert.ok(
  validatePolicy({
    ...standard,
    policy_sources: { base: 'agent-default', constraints: ['test'] },
    reasoning_profile: 'high'
  }).includes('reasoning ceiling expanded')
);

const policyDoc = fs.readFileSync(path.join(root, 'skills/itsol-execution-policy/references/policy.md'), 'utf8');
for (const row of [
  '| `economy` | `economy` | `low` | 0 | 0 | 1 | `requested-result` | `ask` |',
  '| `standard` | `balanced` | `medium` | 2 | 2 | 2 | `implementation-reviewed` | `ask` |',
  '| `deep` | `frontier` | `high` | 1 | 1 | 2 | `integration-validated` | `ask` |'
]) assert.ok(policyDoc.includes(row), `missing exact preset row: ${row}`);

const stopDoc = fs.readFileSync(path.join(root, 'skills/itsol-execution-policy/references/stops-and-delegation.md'), 'utf8');
for (const [stage, rank] of Object.entries(stops)) {
  assert.ok(stopDoc.includes(`| \`${stage}\` | ${rank} |`), `missing stop rank ${stage}`);
}

process.stdout.write('execution-policy schema fixtures: PASS\n');
