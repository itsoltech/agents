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

assert.equal(skillNames.size, 116);
assert.equal(agentNames.size, 113);
for (const required of ['using-itsolpowers', 'itsol-workflow-mode', 'itsol-execution-policy']) {
  assert.ok(skillNames.has(required), `missing required skill: ${required}`);
}
for (const agent of agentNames) assert.ok(skillNames.has(agent), `agent has no matching skill: ${agent}`);
assert.deepEqual(
  [...skillNames].filter((name) => !agentNames.has(name)).sort(),
  ['itsol-codex-doctor', 'itsol-codex-setup', 'itsol-initiative-delivery']
);

for (const file of agentFiles) {
  const content = fs.readFileSync(path.join(pluginRoot, 'agents', file), 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  for (const match of frontmatter.matchAll(/itsolpowers:([a-z0-9-]+)/g)) {
    assert.ok(skillNames.has(match[1]), `${file} references missing skill: ${match[1]}`);
  }
}

const markdownFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? markdownFiles(target) : entry.name.endsWith('.md') ? [target] : [];
});
const piOnlyToolPattern = /\bitsol_(?:task_state|delegate|review_plan|review_verdict|plan_review|complete|qa_plan|qa_verdict|initiative_state)\b/;
for (const file of [...markdownFiles(path.join(pluginRoot, 'skills')), ...markdownFiles(path.join(pluginRoot, 'agents'))]) {
  assert.doesNotMatch(fs.readFileSync(file, 'utf8'), piOnlyToolPattern,
    `shared skill/agent must use harness-neutral capabilities instead of Pi-only tools: ${path.relative(pluginRoot, file)}`);
}

const claudeAdapter = fs.readFileSync(path.join(pluginRoot, 'hooks', 'bootstrap-context-claude.md'), 'utf8');
const codexAdapter = fs.readFileSync(path.join(pluginRoot, 'hooks', 'bootstrap-context-codex.md'), 'utf8');
assert.match(claudeAdapter, /native Agent\/Task/);
assert.match(codexAdapter, /native subagent/);
assert.match(claudeAdapter, /do not call Pi `itsol_/);
assert.match(codexAdapter, /do not call Pi `itsol_/);

const bootstrap = fs.readFileSync(path.join(pluginRoot, 'hooks', 'bootstrap-context-pi.md'), 'utf8');
assert.match(bootstrap, /itsolpowers-pi-bootstrap/);
assert.match(bootstrap, /`using-itsolpowers`/);
assert.match(bootstrap, /`itsol_task_state`/);
assert.match(bootstrap, /does not provide .*delegation tool/);
assert.match(bootstrap, /another installed Pi extension exposes an `Agent`, `Task`, or equivalent subagent tool/);
assert.match(bootstrap, /Never assume that `itsol_delegate` exists/);
assert.match(bootstrap, /existence-only status/);
assert.ok(fs.existsSync(path.join(pluginRoot, 'extensions', 'pi', 'task-state.ts')));
const piFiles = fs.readdirSync(path.join(pluginRoot, 'extensions', 'pi')).filter((name) => name.endsWith('.ts')).sort();
assert.deepEqual(piFiles, ['agents.ts', 'index.ts', 'task-state.ts']);
const piIndexSource = fs.readFileSync(path.join(pluginRoot, 'extensions', 'pi', 'index.ts'), 'utf8');
assert.match(piIndexSource, /detectItsolMemoryPresence/);
assert.match(piIndexSource, /parts\.push\(formatItsolMemoryPresence\(ctx\.cwd\)\)/);
assert.match(piIndexSource, /fs\.existsSync\(filePath\)/);
assert.doesNotMatch(piIndexSource, /readFileSync\([^\n]*\.itsol\.md/);
const piExtensionSource = piFiles
  .map((file) => fs.readFileSync(path.join(pluginRoot, 'extensions', 'pi', file), 'utf8'))
  .join('\n');
assert.equal([...piExtensionSource.matchAll(/registerTool\s*\(\s*\{[\s\S]*?name:\s*["']([^"']+)["']/g)].length, 1);
for (const removedTool of ['itsol_delegate', 'itsol_complete', 'itsol_review_plan', 'itsol_review_verdict', 'itsol_plan_review', 'itsol_qa_plan', 'itsol_qa_verdict', 'itsol_initiative_state', 'itsol_phase_state']) {
  assert.doesNotMatch(piExtensionSource, new RegExp(`name: ["']${removedTool}["']`));
}
assert.doesNotMatch(piExtensionSource, /node:child_process|--no-session|run_in_background|itsol_delegate_result/);
assert.ok(bootstrap.trim().split(/\s+/).length <= 600, 'Pi bootstrap exceeds 600 words');

const sessionStart = path.join(pluginRoot, 'hooks', 'session-start');
const claudeBootstrapResult = spawnSync('bash', [sessionStart, 'claude'], {
  encoding: 'utf8',
  env: { ...process.env, CLAUDE_PLUGIN_ROOT: pluginRoot },
});
assert.equal(claudeBootstrapResult.status, 0, claudeBootstrapResult.stderr);
const claudeBootstrap = JSON.parse(claudeBootstrapResult.stdout).hookSpecificOutput.additionalContext;
assert.match(claudeBootstrap, /Claude Code harness adapter/);
assert.doesNotMatch(claudeBootstrap, /Codex harness adapter/);
const { CLAUDE_PLUGIN_ROOT: _claudeRoot, ...codexEnvironment } = process.env;
const codexBootstrapResult = spawnSync('bash', [sessionStart, 'codex'], {
  encoding: 'utf8',
  env: { ...codexEnvironment, PLUGIN_ROOT: pluginRoot },
});
assert.equal(codexBootstrapResult.status, 0, codexBootstrapResult.stderr);
const codexBootstrap = JSON.parse(codexBootstrapResult.stdout).additionalContext;
assert.match(codexBootstrap, /Codex harness adapter/);
assert.doesNotMatch(codexBootstrap, /Claude Code harness adapter/);

if (process.env.ITSOLPOWERS_PI_SMOKE === '1') {
  for (const packageRoot of [pluginRoot, repoRoot]) {
    const result = spawnSync('pi', ['--offline', '--no-extensions', '-e', packageRoot, '--list-models'], {
      encoding: 'utf8',
      timeout: 30_000,
    });
    assert.equal(result.status, 0, `Pi extension smoke failed for ${packageRoot}:\n${result.stderr || result.stdout}`);
  }
}

process.stdout.write('pi adapter fixtures: PASS\n');
