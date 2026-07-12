import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  PRESETS,
  EXECUTION_PROFILE_ROUTING,
  ROLE_NAMES,
  doctorSetup,
  installSetup,
  uninstallSetup
} from '../skills/itsol-codex-setup/scripts/configure-codex.mjs';

const tempRoots = [];
const makeRoot = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'itsol-codex-setup-'));
  tempRoots.push(root);
  return root;
};
const options = (codexHome, extra = {}) => ({ scope: 'user', preset: 'balanced', codexHome, ...extra });
const codexAvailable = { runCodexVersion: () => ({ status: 0, stdout: 'codex-cli test\n' }) };

try {
  assert.deepEqual(ROLE_NAMES, ['itsol_explorer', 'itsol_mechanical', 'itsol_worker', 'itsol_reviewer']);
  assert.deepEqual(EXECUTION_PROFILE_ROUTING, { economy: 'economy', standard: 'balanced', deep: 'quality' });
  assert.deepEqual(PRESETS, {
    economy: {
      maxThreads: 1,
      roles: {
        itsol_explorer: ['gpt-5.6-terra', 'low', 'read-only'],
        itsol_mechanical: ['gpt-5.6-terra', 'low', null],
        itsol_worker: ['gpt-5.6-terra', 'medium', null],
        itsol_reviewer: ['gpt-5.6', 'medium', 'read-only']
      }
    },
    balanced: {
      maxThreads: 2,
      roles: {
        itsol_explorer: ['gpt-5.6-terra', 'medium', 'read-only'],
        itsol_mechanical: ['gpt-5.6-terra', 'low', null],
        itsol_worker: ['gpt-5.6', 'medium', null],
        itsol_reviewer: ['gpt-5.6', 'high', 'read-only']
      }
    },
    quality: {
      maxThreads: 2,
      roles: {
        itsol_explorer: ['gpt-5.6-terra', 'medium', 'read-only'],
        itsol_mechanical: ['gpt-5.6', 'medium', null],
        itsol_worker: ['gpt-5.6', 'high', null],
        itsol_reviewer: ['gpt-5.6', 'high', 'read-only']
      }
    }
  });

  const dryRoot = makeRoot();
  const dry = installSetup(options(dryRoot, { dryRun: true }));
  assert.equal(dry.status, 'completed');
  assert.equal(dry.changed, true);
  assert.equal(fs.existsSync(path.join(dryRoot, 'agents')), false);

  const freshRoot = makeRoot();
  const fresh = installSetup(options(freshRoot));
  assert.equal(fresh.status, 'completed');
  assert.equal(fresh.changed, true);
  assert.equal(fresh.configPath, path.join(freshRoot, 'config.toml'));
  assert.equal(fresh.statePath, path.join(freshRoot, 'agents', '.itsolpowers-managed.json'));
  assert.equal(Object.keys(fresh.rolePaths).length, 4);
  const configPath = path.join(freshRoot, 'config.toml');
  const config = fs.readFileSync(configPath, 'utf8');
  assert.match(config, /^\[agents\]$/m);
  assert.match(config, /^max_threads = 2$/m);
  assert.match(config, /^max_depth = 1$/m);
  for (const role of ROLE_NAMES) {
    const content = fs.readFileSync(path.join(freshRoot, 'agents', `${role}.toml`), 'utf8');
    assert.match(content, new RegExp(`^name = "${role}"$`, 'm'));
    assert.doesNotMatch(content, /^maxTurns\s*=/m);
  }
  assert.ok(fs.existsSync(path.join(freshRoot, 'agents', '.itsolpowers-managed.json')));

  const repeated = installSetup(options(freshRoot));
  assert.equal(repeated.status, 'completed');
  assert.equal(repeated.changed, false);

  const doctor = doctorSetup(options(freshRoot), codexAvailable);
  assert.equal(doctor.status, 'completed');
  assert.equal(doctor.modelAvailability, 'unverified');
  assert.ok(doctor.findings.some((finding) => finding.code === 'sandbox-configured-intent'));
  assert.equal(doctor.findings.some((finding) => finding.severity === 'error'), false);
  const noCodex = doctorSetup(options(freshRoot), {
    runCodexVersion: () => ({ status: 127, stdout: '', stderr: 'not found' })
  });
  assert.equal(noCodex.status, 'partial');
  assert.ok(noCodex.findings.some((finding) => finding.code === 'codex-unavailable'));

  const strictRoot = makeRoot();
  fs.mkdirSync(strictRoot, { recursive: true });
  fs.writeFileSync(path.join(strictRoot, 'config.toml'), '[agents]\nmax_threads = 1\nmax_depth = 0\n');
  installSetup(options(strictRoot));
  assert.match(fs.readFileSync(path.join(strictRoot, 'config.toml'), 'utf8'), /max_threads = 1/);
  assert.match(fs.readFileSync(path.join(strictRoot, 'config.toml'), 'utf8'), /max_depth = 0/);

  const conflictRoot = makeRoot();
  fs.writeFileSync(path.join(conflictRoot, 'config.toml'), '[agents]\nmax_threads = 6\nmax_depth = 2\n');
  const conflict = installSetup(options(conflictRoot));
  assert.equal(conflict.status, 'blocked');
  assert.equal(fs.existsSync(path.join(conflictRoot, 'agents')), false);
  const forced = installSetup(options(conflictRoot, { force: true }));
  assert.equal(forced.status, 'completed');
  assert.match(fs.readFileSync(path.join(conflictRoot, 'config.toml'), 'utf8'), /max_threads = 2/);
  assert.match(fs.readFileSync(path.join(conflictRoot, 'config.toml'), 'utf8'), /max_depth = 1/);

  const malformedRoot = makeRoot();
  fs.writeFileSync(path.join(malformedRoot, 'config.toml'), '[agents]\nmax_threads = "many"\n');
  const malformed = installSetup(options(malformedRoot, { force: true }));
  assert.equal(malformed.status, 'blocked');
  assert.equal(fs.readFileSync(path.join(malformedRoot, 'config.toml'), 'utf8'), '[agents]\nmax_threads = "many"\n');

  const unmanagedRoot = makeRoot();
  fs.mkdirSync(path.join(unmanagedRoot, 'agents'), { recursive: true });
  const unmanagedPath = path.join(unmanagedRoot, 'agents', 'itsol_worker.toml');
  fs.writeFileSync(unmanagedPath, 'name = "user_owned"\n');
  const unmanaged = installSetup(options(unmanagedRoot, { force: true }));
  assert.equal(unmanaged.status, 'blocked');
  assert.equal(fs.readFileSync(unmanagedPath, 'utf8'), 'name = "user_owned"\n');

  const modifiedRoot = makeRoot();
  installSetup(options(modifiedRoot));
  const modifiedPath = path.join(modifiedRoot, 'agents', 'itsol_worker.toml');
  fs.appendFileSync(modifiedPath, '# user edit\n');
  assert.equal(installSetup(options(modifiedRoot)).status, 'blocked');
  assert.equal(installSetup(options(modifiedRoot, { force: true })).status, 'completed');
  assert.doesNotMatch(fs.readFileSync(modifiedPath, 'utf8'), /user edit/);

  const uninstallRoot = makeRoot();
  fs.writeFileSync(path.join(uninstallRoot, 'config.toml'), '# original\n');
  installSetup(options(uninstallRoot));
  const removed = uninstallSetup(options(uninstallRoot));
  assert.equal(removed.status, 'completed');
  assert.equal(fs.readFileSync(path.join(uninstallRoot, 'config.toml'), 'utf8'), '# original\n');
  for (const role of ROLE_NAMES) assert.equal(fs.existsSync(path.join(uninstallRoot, 'agents', `${role}.toml`)), false);

  const preserveRoot = makeRoot();
  installSetup(options(preserveRoot));
  const preservePath = path.join(preserveRoot, 'agents', 'itsol_reviewer.toml');
  fs.appendFileSync(preservePath, '# keep me\n');
  const preserved = uninstallSetup(options(preserveRoot));
  assert.equal(preserved.status, 'partial');
  assert.equal(preserved.changed, false);
  assert.ok(fs.existsSync(preservePath));
  assert.ok(fs.existsSync(path.join(preserveRoot, 'agents', 'itsol_worker.toml')));
  assert.equal(uninstallSetup(options(preserveRoot, { force: true })).status, 'completed');
  assert.equal(fs.existsSync(preservePath), false);

  const missingBackupRoot = makeRoot();
  fs.writeFileSync(path.join(missingBackupRoot, 'config.toml'), '# original\n');
  const withBackup = installSetup(options(missingBackupRoot));
  fs.rmSync(withBackup.backupPath);
  const missingBackup = uninstallSetup(options(missingBackupRoot));
  assert.equal(missingBackup.status, 'partial');
  assert.equal(missingBackup.changed, false);
  assert.ok(fs.existsSync(path.join(missingBackupRoot, 'agents', 'itsol_worker.toml')));
  assert.ok(doctorSetup(options(missingBackupRoot), codexAvailable).findings.some((finding) => finding.code === 'backup-missing'));
  const forcedMissingBackup = uninstallSetup(options(missingBackupRoot, { force: true }));
  assert.equal(forcedMissingBackup.status, 'partial');
  assert.equal(fs.existsSync(path.join(missingBackupRoot, 'agents', 'itsol_worker.toml')), false);

  const rollbackRoot = makeRoot();
  let writes = 0;
  const realAtomicWrite = (target, content) => {
    writes += 1;
    if (writes === 2) throw new Error('injected write failure');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.test-tmp`;
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, target);
  };
  const rollback = installSetup(options(rollbackRoot), { atomicWrite: realAtomicWrite });
  assert.equal(rollback.status, 'failed');
  assert.equal(fs.existsSync(path.join(rollbackRoot, 'agents', '.itsolpowers-managed.json')), false);
  for (const role of ROLE_NAMES) assert.equal(fs.existsSync(path.join(rollbackRoot, 'agents', `${role}.toml`)), false);

  const projectRoot = makeRoot();
  const project = installSetup({ scope: 'project', preset: 'economy', projectRoot });
  assert.equal(project.status, 'completed');
  assert.ok(fs.existsSync(path.join(projectRoot, '.codex', 'agents', 'itsol_explorer.toml')));

  const malformedStateRoot = makeRoot();
  installSetup(options(malformedStateRoot));
  const malformedStatePath = path.join(malformedStateRoot, 'agents', '.itsolpowers-managed.json');
  const malformedState = JSON.parse(fs.readFileSync(malformedStatePath, 'utf8'));
  malformedState.manager = 'someone-else';
  fs.writeFileSync(malformedStatePath, `${JSON.stringify(malformedState)}\n`);
  assert.equal(installSetup(options(malformedStateRoot)).status, 'blocked');
  assert.equal(doctorSetup(options(malformedStateRoot), codexAvailable).status, 'failed');

  const unsafeStateRoot = makeRoot();
  installSetup(options(unsafeStateRoot));
  const unsafeStatePath = path.join(unsafeStateRoot, 'agents', '.itsolpowers-managed.json');
  const unsafeState = JSON.parse(fs.readFileSync(unsafeStatePath, 'utf8'));
  unsafeState.backupPath = path.join(makeRoot(), 'outside-backup');
  fs.writeFileSync(unsafeStatePath, `${JSON.stringify(unsafeState)}\n`);
  assert.equal(uninstallSetup(options(unsafeStateRoot, { force: true })).status, 'blocked');
  assert.equal(doctorSetup(options(unsafeStateRoot), codexAvailable).status, 'failed');

  const cliScript = fileURLToPath(new URL('../skills/itsol-codex-setup/scripts/configure-codex.mjs', import.meta.url));
  for (const flag of ['--scope', '--preset', '--codex-home', '--project-root']) {
    const cliRoot = makeRoot();
    const cli = spawnSync(process.execPath, [cliScript, 'install', flag], {
      cwd: cliRoot,
      env: { ...process.env, CODEX_HOME: cliRoot },
      encoding: 'utf8'
    });
    assert.equal(cli.status, 1, `${flag} without a value must fail`);
    assert.match(cli.stderr, /requires a value/);
    assert.equal(fs.existsSync(path.join(cliRoot, 'agents')), false);
    assert.equal(fs.existsSync(path.join(cliRoot, '.codex')), false);
  }
  const humanRoot = makeRoot();
  const human = spawnSync(process.execPath, [cliScript, 'install', '--codex-home', humanRoot, '--dry-run'], {
    encoding: 'utf8'
  });
  assert.equal(human.status, 0);
  assert.match(human.stdout, new RegExp(`Config: ${humanRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/config\\.toml`));
  assert.match(human.stdout, /Role itsol_worker:/);
  assert.match(human.stdout, /Backup: none/);

  process.stdout.write('codex agent setup fixtures: PASS\n');
} finally {
  for (const root of tempRoots) fs.rmSync(root, { recursive: true, force: true });
}
