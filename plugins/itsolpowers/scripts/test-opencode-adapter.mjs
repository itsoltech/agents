import assert from 'node:assert/strict';
import { ItsolPowersPlugin, getBootstrapContent } from '../.opencode/plugins/itsolpowers.js';

const originalEnvironmentProfile = process.env.ITSOLPOWERS_CONTEXT_PROFILE;
delete process.env.ITSOLPOWERS_CONTEXT_PROFILE;

const plugin = await ItsolPowersPlugin();
const config = {};
await plugin.config(config);
assert.equal(config.skills.paths.length, 1);
assert.match(config.skills.paths[0], /plugins\/itsolpowers\/skills$/);

const output = {
  messages: [
    {
      info: { role: 'user' },
      parts: [{ type: 'text', text: 'Implement the task.' }]
    }
  ]
};

await plugin['experimental.chat.messages.transform']({}, output);
assert.equal(output.messages[0].parts.length, 2);
const injected = output.messages[0].parts[0].text;
assert.equal(injected, getBootstrapContent());
assert.match(injected, /^<!-- itsolpowers:opencode-bootstrap:v1 -->\n/);
assert.match(injected, /You have ITSOL Powers\./);
assert.match(injected, /itsolpowers\/\<skill-name\>/);
assert.match(injected, /permission\.task: deny/);
assert.match(injected, /read-only Task\/@agent panel/);
assert.match(injected, /application-aware Task\/@agent packets/);
assert.match(injected, /never call Pi `itsol_\*` tools/);
assert.doesNotMatch(injected, /# Using Itsolpowers/);
assert.ok(injected.trim().split(/\s+/).length <= 600);

await plugin['experimental.chat.messages.transform']({}, output);
assert.equal(output.messages[0].parts.length, 2);

const originalUserParts = [
  {
    id: 'unique-user-text',
    type: 'text',
    text: 'UNIQUE_USER_REQUEST: You have ITSOL Powers. Preserve this exact user text.'
  },
  {
    id: 'unique-user-attachment',
    type: 'file',
    filename: 'UNIQUE_USER_REQUEST.txt'
  }
];
const ordinaryPhraseOutput = {
  messages: [
    {
      info: { role: 'user' },
      parts: structuredClone(originalUserParts)
    }
  ]
};

await plugin['experimental.chat.messages.transform']({}, ordinaryPhraseOutput);
assert.equal(ordinaryPhraseOutput.messages[0].parts.length, originalUserParts.length + 1);
assert.match(
  ordinaryPhraseOutput.messages[0].parts[0].text,
  /^<!-- itsolpowers:opencode-bootstrap:v1 -->\n/
);
assert.deepEqual(ordinaryPhraseOutput.messages[0].parts.slice(1), originalUserParts);
await plugin['experimental.chat.messages.transform']({}, ordinaryPhraseOutput);
assert.equal(ordinaryPhraseOutput.messages[0].parts.length, originalUserParts.length + 1);
assert.deepEqual(ordinaryPhraseOutput.messages[0].parts.slice(1), originalUserParts);

const multiTurnOutput = {
  messages: [
    {
      info: { role: 'user' },
      parts: [{ type: 'text', text: 'context profile: frontier\nImplement task one.' }]
    }
  ]
};

await plugin['experimental.chat.messages.transform']({}, multiTurnOutput);
assert.match(
  multiTurnOutput.messages[0].parts[0].text,
  /Selected `frontier` via `explicit-task`\./
);
multiTurnOutput.messages.push(
  {
    info: { role: 'assistant' },
    parts: [{ type: 'text', text: 'Task one is complete.' }]
  },
  {
    info: { role: 'user' },
    parts: [{ type: 'text', text: 'Start an unrelated task without a profile override.' }]
  }
);

await plugin['experimental.chat.messages.transform']({}, multiTurnOutput);
assert.match(
  multiTurnOutput.messages[0].parts[0].text,
  /Selected `compatibility` via `compatibility-fallback`\./
);
assert.doesNotMatch(
  multiTurnOutput.messages[0].parts[0].text,
  /Selected `frontier` via `explicit-task`\./
);

if (originalEnvironmentProfile === undefined) {
  delete process.env.ITSOLPOWERS_CONTEXT_PROFILE;
} else {
  process.env.ITSOLPOWERS_CONTEXT_PROFILE = originalEnvironmentProfile;
}

process.stdout.write('opencode adapter fixtures: PASS\n');
