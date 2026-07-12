import assert from 'node:assert/strict';
import { ItsolPowersPlugin, getBootstrapContent } from '../.opencode/plugins/itsolpowers.js';

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
assert.match(injected, /You have ITSOL Powers\./);
assert.match(injected, /itsolpowers\/\<skill-name\>/);
assert.match(injected, /permission\.task: deny/);
assert.doesNotMatch(injected, /# Using Itsolpowers/);
assert.ok(injected.trim().split(/\s+/).length <= 600);

await plugin['experimental.chat.messages.transform']({}, output);
assert.equal(output.messages[0].parts.length, 2);

process.stdout.write('opencode adapter fixtures: PASS\n');
