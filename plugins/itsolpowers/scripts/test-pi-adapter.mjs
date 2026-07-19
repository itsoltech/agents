import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(pluginRoot, '../..');
const packageJson = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'package.json'), 'utf8'));
const rootPackageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

assert.ok(packageJson.keywords.includes('pi-package'));
assert.deepEqual(packageJson.pi.extensions, ['./extensions/pi/index.ts']);
assert.deepEqual(packageJson.pi.skills, ['./skills']);
for (const resource of [...packageJson.pi.extensions, ...packageJson.pi.skills]) {
  assert.ok(fs.existsSync(path.resolve(pluginRoot, resource)), `missing Pi resource: ${resource}`);
}

assert.equal(rootPackageJson.private, true);
assert.equal(rootPackageJson.version, packageJson.version);
assert.ok(rootPackageJson.keywords.includes('pi-package'));
assert.deepEqual(rootPackageJson.pi.extensions, ['./plugins/itsolpowers/extensions/pi/index.ts']);
assert.deepEqual(rootPackageJson.pi.skills, ['./plugins/itsolpowers/skills']);
for (const resource of [...rootPackageJson.pi.extensions, ...rootPackageJson.pi.skills]) {
  assert.ok(fs.existsSync(path.resolve(repoRoot, resource)), `missing root Pi adapter resource: ${resource}`);
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
assert.match(bootstrap, /`itsol_task_state`/);
assert.match(bootstrap, /`itsol_delegate`/);
assert.match(bootstrap, /`itsol_complete`/);
assert.match(bootstrap, /`itsol_review_plan`/);
assert.match(bootstrap, /`itsol_review_verdict`/);
assert.match(bootstrap, /`itsol_plan_review`/);
assert.match(bootstrap, /effective profile is `off`/);
assert.ok(fs.existsSync(path.join(pluginRoot, 'extensions', 'pi', 'completion-gate.ts')));
assert.ok(fs.existsSync(path.join(pluginRoot, 'extensions', 'pi', 'review-orchestrator.ts')));
assert.ok(fs.existsSync(path.join(pluginRoot, 'extensions', 'pi', 'plan-review.ts')));
const reviewOrchestrator = fs.readFileSync(path.join(pluginRoot, 'extensions', 'pi', 'review-orchestrator.ts'), 'utf8');
assert.match(reviewOrchestrator, /itsol-review/);
assert.match(reviewOrchestrator, /autoRereviewNotice/);
assert.match(reviewOrchestrator, /fingerprint/);
assert.ok(fs.existsSync(path.join(pluginRoot, 'extensions', 'pi', 'repo-policy.ts')));
assert.ok(fs.existsSync(path.join(pluginRoot, 'extensions', 'pi', 'task-state.ts')));
assert.ok(fs.existsSync(path.join(pluginRoot, 'extensions', 'pi', 'model-router.ts')));
assert.ok(bootstrap.trim().split(/\s+/).length <= 600, 'Pi bootstrap exceeds 600 words');

if (process.env.ITSOLPOWERS_PI_SMOKE === '1') {
  for (const extensionTarget of [path.join(pluginRoot, 'extensions', 'pi', 'index.ts'), repoRoot]) {
    const result = spawnSync('pi', ['--offline', '--no-extensions', '-e', extensionTarget, '--list-models'], {
      encoding: 'utf8',
      timeout: 30_000,
    });
    const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    assert.equal(result.status, 0, `Pi extension smoke failed for ${extensionTarget}:\n${output}`);
    assert.doesNotMatch(output, /Failed to load extension|ParseError|SyntaxError|Unexpected token/i,
      `Pi reported an extension load error for ${extensionTarget}:\n${output}`);
  }
}

process.stdout.write('pi adapter fixtures: PASS\n');
