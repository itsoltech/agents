import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evaluateSubagentStop, validateEnvelope } from '../hooks/validate-subagent-stop.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'itsol-stop-'));
fs.writeFileSync(path.join(dir, 'known-agent.md'), '# fixture\n');

const valid = 'Summary\nStatus: completed\nVerification: npm test passed\nUnverified: none';
const incomplete = 'Status: partial\nVerification: not run: dependency unavailable\nUnverified: integration behavior';

assert.equal(validateEnvelope(valid), true);
assert.equal(validateEnvelope(incomplete), true);
assert.equal(validateEnvelope(valid.replaceAll('\n', '\r\n')), true);
assert.equal(validateEnvelope('verification mentioned in prose'), false);
assert.equal(validateEnvelope('Status: done\nVerification: ok\nUnverified: none'), false);
assert.equal(validateEnvelope(`${valid}\nStatus: done`), false);
assert.equal(validateEnvelope('Status: completed\nVerification: \nUnverified: none'), false);
assert.equal(validateEnvelope(`${valid}\n${valid}`), false);
assert.equal(validateEnvelope('Status: completed\nVerification: not run: skipped\nUnverified: none'), false);
assert.equal(validateEnvelope(`${valid}\ntrailing prose`), false);
assert.equal(
  validateEnvelope('Status: completed\nintervening prose\nVerification: ok\nUnverified: none'),
  false
);

assert.equal(evaluateSubagentStop({ agent_type: 'unknown', last_assistant_message: '' }, dir), null);
assert.equal(evaluateSubagentStop({ agent_type: 'known-agent', last_assistant_message: valid }, dir), null);
assert.equal(evaluateSubagentStop({ agent_type: 'known-agent', last_assistant_message: incomplete }, dir), null);
assert.equal(
  evaluateSubagentStop({ agent_type: 'known-agent', stop_hook_active: true, last_assistant_message: '' }, dir),
  null
);
assert.equal(evaluateSubagentStop({ agent_type: 'known-agent' }, dir)?.decision, 'block');
assert.equal(
  evaluateSubagentStop({ agent_type: 'itsolpowers:known-agent', last_assistant_message: '' }, dir)?.decision,
  'block'
);
assert.equal(
  evaluateSubagentStop({ agent_type: 'other-plugin:known-agent', last_assistant_message: '' }, dir),
  null
);

fs.rmSync(dir, { recursive: true, force: true });
process.stdout.write('subagent-stop fixtures: PASS\n');
