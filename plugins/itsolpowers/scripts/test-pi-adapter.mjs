import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'package.json'), 'utf8'));

assert.ok(packageJson.keywords.includes('pi-package'));
assert.deepEqual(packageJson.pi.extensions, ['./extensions/pi/index.ts']);
assert.deepEqual(packageJson.pi.skills, ['./skills']);
for (const resource of [...packageJson.pi.extensions, ...packageJson.pi.skills]) {
  assert.ok(fs.existsSync(path.resolve(pluginRoot, resource)), `missing Pi resource: ${resource}`);
}

const skillNames = new Set(
  fs.readdirSync(path.join(pluginRoot, 'skills'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(pluginRoot, 'skills', entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
);
const agentFiles = fs.readdirSync(path.join(pluginRoot, 'agents')).filter((name) => name.endsWith('.md'));
const agentNames = new Set(agentFiles.map((name) => name.replace(/\.md$/, '')));

assert.equal(skillNames.size, 115);
assert.equal(agentNames.size, 113);
for (const required of ['using-itsolpowers', 'itsol-workflow-mode', 'itsol-execution-policy']) {
  assert.ok(skillNames.has(required), `missing required skill: ${required}`);
}
for (const agent of agentNames) assert.ok(skillNames.has(agent), `agent has no matching skill: ${agent}`);
assert.deepEqual(
  [...skillNames].filter((name) => !agentNames.has(name)).sort(),
  ['itsol-codex-doctor', 'itsol-codex-setup']
);

for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(pluginRoot, 'agents', file), 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  for (const match of frontmatter.matchAll(/itsolpowers:([a-z0-9-]+)/g)) {
    assert.ok(skillNames.has(match[1]), `${file} references missing skill: ${match[1]}`);
  }
}

const bootstrap = fs.readFileSync(path.join(pluginRoot, 'hooks', 'bootstrap-context-pi.md'), 'utf8');
assert.match(bootstrap, /itsolpowers-pi-bootstrap/);
assert.match(bootstrap, /`using-itsolpowers`/);
assert.match(bootstrap, /`itsol_delegate`/);
assert.ok(bootstrap.trim().split(/\s+/).length <= 600, 'Pi bootstrap exceeds 600 words');

if (process.env.ITSOLPOWERS_PI_SMOKE === '1') {
  const result = spawnSync('pi', ['--offline', '-e', pluginRoot, '--list-models'], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.status, 0, `Pi extension smoke failed:\n${result.stderr || result.stdout}`);
}

process.stdout.write('pi adapter fixtures: PASS\n');
