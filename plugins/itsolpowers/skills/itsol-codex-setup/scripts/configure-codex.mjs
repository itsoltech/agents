#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROLE_NAMES = Object.freeze([
  'itsol_explorer',
  'itsol_mechanical',
  'itsol_worker',
  'itsol_reviewer'
]);

export const PRESETS = Object.freeze({
  economy: Object.freeze({
    maxThreads: 1,
    roles: Object.freeze({
      itsol_explorer: Object.freeze(['gpt-5.6-terra', 'low', 'read-only']),
      itsol_mechanical: Object.freeze(['gpt-5.6-terra', 'low', null]),
      itsol_worker: Object.freeze(['gpt-5.6-terra', 'medium', null]),
      itsol_reviewer: Object.freeze(['gpt-5.6', 'medium', 'read-only'])
    })
  }),
  balanced: Object.freeze({
    maxThreads: 2,
    roles: Object.freeze({
      itsol_explorer: Object.freeze(['gpt-5.6-terra', 'medium', 'read-only']),
      itsol_mechanical: Object.freeze(['gpt-5.6-terra', 'low', null]),
      itsol_worker: Object.freeze(['gpt-5.6', 'medium', null]),
      itsol_reviewer: Object.freeze(['gpt-5.6', 'high', 'read-only'])
    })
  }),
  quality: Object.freeze({
    maxThreads: 2,
    roles: Object.freeze({
      itsol_explorer: Object.freeze(['gpt-5.6-terra', 'medium', 'read-only']),
      itsol_mechanical: Object.freeze(['gpt-5.6', 'medium', null]),
      itsol_worker: Object.freeze(['gpt-5.6', 'high', null]),
      itsol_reviewer: Object.freeze(['gpt-5.6', 'high', 'read-only'])
    })
  })
});

export const EXECUTION_PROFILE_ROUTING = Object.freeze({
  economy: 'economy',
  standard: 'balanced',
  deep: 'quality'
});

const ROLE_DETAILS = Object.freeze({
  itsol_explorer: {
    description: 'Read-only repository explorer for evidence gathering and code-path mapping.',
    instructions: 'Stay read-only. Gather concrete evidence, cite files and symbols, return a concise result, and do not delegate further.'
  },
  itsol_mechanical: {
    description: 'Cost-focused worker for deterministic, narrow, low-risk changes.',
    instructions: 'Perform only the narrow deterministic task packet. Preserve unrelated files, verify the requested result, and do not delegate further.'
  },
  itsol_worker: {
    description: 'Implementation worker for scoped features, fixes, and verification.',
    instructions: 'Implement only the assigned task packet. Follow named ITSOL skills, validate every done_when criterion with evidence, and do not delegate further.'
  },
  itsol_reviewer: {
    description: 'Independent read-only reviewer for correctness, security, and missing tests.',
    instructions: 'Stay read-only. Lead with concrete findings and evidence, report coverage gaps, and do not delegate further.'
  }
});

const STATE_FILE = '.itsolpowers-managed.json';
const hash = (content) => crypto.createHash('sha256').update(content).digest('hex');
const isHash = (value) => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const readOptional = (target) => (fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null);
const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const resolveTargets = (options = {}) => {
  const scope = options.scope ?? 'user';
  if (!['user', 'project'].includes(scope)) throw new Error(`invalid scope: ${scope}`);
  const root = scope === 'user'
    ? path.resolve(options.codexHome ?? process.env.CODEX_HOME ?? path.join(os.homedir(), '.codex'))
    : path.resolve(options.projectRoot ?? process.cwd(), '.codex');
  const agentsDir = path.join(root, 'agents');
  return {
    scope,
    root,
    agentsDir,
    configPath: path.join(root, 'config.toml'),
    statePath: path.join(agentsDir, STATE_FILE)
  };
};

const renderRole = (role, presetName) => {
  const [model, effort, sandbox] = PRESETS[presetName].roles[role];
  const details = ROLE_DETAILS[role];
  const sandboxLine = sandbox ? `sandbox_mode = "${sandbox}"\n` : '';
  return `# Managed by ITSOL Powers. Re-run $itsol-codex-setup to update.\n` +
    `name = "${role}"\n` +
    `description = ${JSON.stringify(details.description)}\n` +
    `model = "${model}"\n` +
    `model_reasoning_effort = "${effort}"\n` +
    sandboxLine +
    `developer_instructions = """\n${details.instructions}\n"""\n`;
};

const parseState = (statePath) => {
  const raw = readOptional(statePath);
  if (raw === null) return { raw: null, value: null, error: null };
  try {
    const value = JSON.parse(raw);
    const fileKeys = value?.files && typeof value.files === 'object' ? Object.keys(value.files).sort() : [];
    const validFiles = fileKeys.length === ROLE_NAMES.length &&
      fileKeys.every((role, index) => role === [...ROLE_NAMES].sort()[index]) &&
      ROLE_NAMES.every((role) => isHash(value.files?.[role]?.hash));
    const valid = value?.schemaVersion === 1 &&
      value?.manager === 'itsolpowers' &&
      ['user', 'project'].includes(value?.scope) &&
      Object.hasOwn(PRESETS, value?.preset) &&
      validFiles &&
      isHash(value?.installedConfigHash) &&
      typeof value?.originalConfigExists === 'boolean' &&
      isHash(value?.originalConfigHash) &&
      (value?.backupPath === null || typeof value?.backupPath === 'string');
    if (!valid) {
      return { raw, value: null, error: 'managed state has an unsupported schema' };
    }
    return { raw, value, error: null };
  } catch {
    return { raw, value: null, error: 'managed state is malformed JSON' };
  }
};

const validateStateForTargets = (state, targets) => {
  if (!state) return null;
  if (state.scope !== targets.scope) return 'managed state scope does not match the selected scope';
  if (state.backupPath !== null) {
    const backup = path.resolve(state.backupPath);
    if (path.dirname(backup) !== path.dirname(targets.configPath) ||
        !path.basename(backup).startsWith(`${path.basename(targets.configPath)}.itsolpowers-backup-`)) {
      return 'managed state backupPath is outside the managed config location';
    }
  }
  return null;
};

const headerMatch = (line) => line.match(/^\s*\[([^\]]+)\]\s*(?:#.*)?$/);
const updateAgentsConfig = (original, desired, { force = false, managedConfig = false } = {}) => {
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const endsWithNewline = original === '' || /\r?\n$/.test(original);
  const lines = original === '' ? [] : original.replace(/\r\n/g, '\n').split('\n');
  if (endsWithNewline && lines.at(-1) === '') lines.pop();
  const sections = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = headerMatch(lines[index]);
    if (match?.[1].trim() === 'agents') sections.push(index);
  }
  if (sections.length > 1) return { error: 'config contains duplicate [agents] sections' };

  let start;
  let end;
  if (sections.length === 0) {
    if (lines.length && lines.at(-1) !== '') lines.push('');
    start = lines.length;
    lines.push('[agents]');
    end = lines.length;
  } else {
    start = sections[0];
    end = lines.length;
    for (let index = start + 1; index < lines.length; index += 1) {
      if (headerMatch(lines[index])) {
        end = index;
        break;
      }
    }
  }

  const conflicts = [];
  for (const [key, wanted] of Object.entries(desired)) {
    const matches = [];
    const pattern = new RegExp(`^\\s*${key}\\s*=\\s*([0-9]+)\\s*(?:#.*)?$`);
    const assignment = new RegExp(`^\\s*${key}\\s*=`);
    for (let index = start + 1; index < end; index += 1) {
      const match = lines[index].match(pattern);
      if (match) matches.push({ index, value: Number(match[1]) });
      else if (assignment.test(lines[index])) return { error: `config contains a non-integer ${key} value in [agents]` };
    }
    if (matches.length > 1) return { error: `config contains duplicate ${key} values in [agents]` };
    if (matches.length === 0) {
      lines.splice(end, 0, `${key} = ${wanted}`);
      end += 1;
      continue;
    }
    const current = matches[0];
    if (current.value <= wanted) continue;
    if (!force && !managedConfig) {
      conflicts.push(`${key}=${current.value} is less restrictive than ${wanted}`);
      continue;
    }
    lines[current.index] = `${key} = ${wanted}`;
  }
  if (conflicts.length) return { conflicts };
  const content = `${lines.join('\n')}${endsWithNewline || lines.length ? '\n' : ''}`.replace(/\n/g, newline);
  return { content };
};

const defaultAtomicWrite = (target, content) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(temporary, content, { mode: 0o600 });
  fs.renameSync(temporary, target);
};

const snapshot = (target) => ({ target, content: readOptional(target) });
const restoreSnapshots = (snapshots) => {
  for (const item of [...snapshots].reverse()) {
    try {
      if (item.content === null) fs.rmSync(item.target, { force: true });
      else defaultAtomicWrite(item.target, item.content);
    } catch {
      // Best-effort rollback; doctor will report any incomplete state.
    }
  }
};

const blocked = (targets, reasons) => ({
  status: 'blocked',
  changed: false,
  scope: targets.scope,
  root: targets.root,
  reasons: Array.isArray(reasons) ? reasons : [reasons]
});

export const installSetup = (options = {}, dependencies = {}) => {
  const targets = resolveTargets(options);
  const presetName = options.preset ?? 'balanced';
  const preset = PRESETS[presetName];
  if (!preset) return blocked(targets, `invalid preset: ${presetName}`);
  const parsedState = parseState(targets.statePath);
  if (parsedState.error) return blocked(targets, parsedState.error);
  const previousState = parsedState.value;
  const stateTargetError = validateStateForTargets(previousState, targets);
  if (stateTargetError) return blocked(targets, stateTargetError);
  if (previousState?.originalConfigExists) {
    const backup = previousState.backupPath ? readOptional(previousState.backupPath) : null;
    if (backup === null || hash(backup) !== previousState.originalConfigHash) {
      return blocked(targets, 'managed config backup is missing or does not match state');
    }
  }
  const roleContents = Object.fromEntries(ROLE_NAMES.map((role) => [role, renderRole(role, presetName)]));
  const collisions = [];

  for (const role of ROLE_NAMES) {
    const target = path.join(targets.agentsDir, `${role}.toml`);
    const current = readOptional(target);
    if (current === null) continue;
    const recorded = previousState?.files?.[role];
    if (!recorded) collisions.push(`${role} already exists and is not ITSOLPowers-managed`);
    else if (hash(current) !== recorded.hash && !options.force) collisions.push(`${role} was modified after setup`);
  }
  if (collisions.length) return blocked(targets, collisions);

  const originalConfig = readOptional(targets.configPath);
  const currentConfig = originalConfig ?? '';
  const managedConfig = previousState?.installedConfigHash === hash(currentConfig);
  const configUpdate = updateAgentsConfig(
    currentConfig,
    { max_threads: preset.maxThreads, max_depth: 1 },
    { force: options.force === true, managedConfig }
  );
  if (configUpdate.error) return blocked(targets, configUpdate.error);
  if (configUpdate.conflicts) return blocked(targets, configUpdate.conflicts);

  const desiredConfig = configUpdate.content;
  const backupPath = previousState
    ? previousState.backupPath
    : originalConfig === null
      ? null
      : `${targets.configPath}.itsolpowers-backup-${Date.now()}`;
  const state = {
    schemaVersion: 1,
    manager: 'itsolpowers',
    scope: targets.scope,
    preset: presetName,
    files: Object.fromEntries(ROLE_NAMES.map((role) => [role, { hash: hash(roleContents[role]) }])),
    installedConfigHash: hash(desiredConfig),
    originalConfigExists: previousState?.originalConfigExists ?? originalConfig !== null,
    originalConfigHash: previousState?.originalConfigHash ?? hash(currentConfig),
    backupPath
  };
  const desiredState = stableJson(state);
  const roleChanges = ROLE_NAMES.filter((role) => {
    const target = path.join(targets.agentsDir, `${role}.toml`);
    return readOptional(target) !== roleContents[role];
  });
  const configChanged = originalConfig !== desiredConfig;
  const stateChanged = parsedState.raw !== desiredState;
  const changed = roleChanges.length > 0 || configChanged || stateChanged;
  const result = {
    status: 'completed',
    changed,
    dryRun: options.dryRun === true,
    scope: targets.scope,
    preset: presetName,
    root: targets.root,
    configPath: targets.configPath,
    statePath: targets.statePath,
    rolePaths: Object.fromEntries(ROLE_NAMES.map((role) => [role, path.join(targets.agentsDir, `${role}.toml`)])),
    backupPath,
    roleChanges,
    configChanged,
    stateChanged,
    modelAvailability: 'unverified'
  };
  if (!changed || options.dryRun) return result;

  const atomicWrite = dependencies.atomicWrite ?? defaultAtomicWrite;
  const touched = [
    ...roleChanges.map((role) => path.join(targets.agentsDir, `${role}.toml`)),
    ...(configChanged ? [targets.configPath] : []),
    targets.statePath
  ];
  const snapshots = touched.map(snapshot);
  let createdBackup = false;
  try {
    if (!previousState && originalConfig !== null && backupPath) {
      defaultAtomicWrite(backupPath, originalConfig);
      createdBackup = true;
    }
    for (const role of roleChanges) {
      atomicWrite(path.join(targets.agentsDir, `${role}.toml`), roleContents[role]);
    }
    if (configChanged) atomicWrite(targets.configPath, desiredConfig);
    atomicWrite(targets.statePath, desiredState);
    return result;
  } catch (error) {
    restoreSnapshots(snapshots);
    if (createdBackup) fs.rmSync(backupPath, { force: true });
    return {
      ...result,
      status: 'failed',
      changed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export const doctorSetup = (options = {}, dependencies = {}) => {
  const targets = resolveTargets(options);
  const parsedState = parseState(targets.statePath);
  const findings = [];
  const add = (severity, code, message) => findings.push({ severity, code, message });
  const runCodexVersion = dependencies.runCodexVersion ?? (() => spawnSync('codex', ['--version'], { encoding: 'utf8' }));
  const codex = runCodexVersion();
  if (codex.status === 0) add('info', 'codex-version', codex.stdout.trim());
  else add('warning', 'codex-unavailable', 'Codex CLI was not found or did not report a version.');
  if (parsedState.error) add('error', 'state-invalid', parsedState.error);
  if (!parsedState.value) add('error', 'state-missing', 'ITSOLPowers managed state is missing; run setup first.');

  const state = parsedState.value;
  if (state) {
    const stateTargetError = validateStateForTargets(state, targets);
    if (stateTargetError) add('error', 'state-target-invalid', stateTargetError);
    if (!stateTargetError && state.originalConfigExists) {
      const backup = state.backupPath ? readOptional(state.backupPath) : null;
      if (backup === null || hash(backup) !== state.originalConfigHash) {
        add('warning', 'backup-missing', 'Managed config backup is missing or does not match state.');
      }
    }
    for (const role of ROLE_NAMES) {
      const target = path.join(targets.agentsDir, `${role}.toml`);
      const current = readOptional(target);
      if (current === null) add('error', 'role-missing', `${role} is missing.`);
      else if (hash(current) !== state.files?.[role]?.hash) add('warning', 'role-modified', `${role} differs from managed state.`);
    }
    const config = readOptional(targets.configPath);
    if (config === null) add('error', 'config-missing', 'config.toml is missing.');
    else {
      const parsed = updateAgentsConfig(config, { max_threads: PRESETS[state.preset]?.maxThreads ?? 2, max_depth: 1 });
      if (parsed.error) add('error', 'config-invalid', parsed.error);
      if (parsed.conflicts) add('warning', 'limits-less-restrictive', parsed.conflicts.join('; '));
      if (hash(config) !== state.installedConfigHash) add('warning', 'config-modified', 'config.toml changed after setup; configured limits were checked but ownership is no longer exact.');
    }
  }
  add('info', 'sandbox-configured-intent', 'Role sandbox_mode is configured intent; effective parent or session permissions may take precedence.');
  add('info', 'model-availability-unverified', 'Model entitlement was not probed to avoid consuming credits.');
  const hasError = findings.some((finding) => finding.severity === 'error');
  const hasWarning = findings.some((finding) => finding.severity === 'warning');
  return {
    status: hasError ? 'failed' : hasWarning ? 'partial' : 'completed',
    scope: targets.scope,
    root: targets.root,
    preset: state?.preset ?? null,
    modelAvailability: 'unverified',
    findings
  };
};

export const uninstallSetup = (options = {}) => {
  const targets = resolveTargets(options);
  const parsedState = parseState(targets.statePath);
  if (parsedState.error) return blocked(targets, parsedState.error);
  const state = parsedState.value;
  if (!state) return blocked(targets, 'ITSOLPowers managed state is missing');
  const stateTargetError = validateStateForTargets(state, targets);
  if (stateTargetError) return blocked(targets, stateTargetError);
  const preserved = [];
  const modifiedRoles = [];

  for (const role of ROLE_NAMES) {
    const target = path.join(targets.agentsDir, `${role}.toml`);
    const current = readOptional(target);
    if (current !== null && hash(current) !== state.files?.[role]?.hash) modifiedRoles.push(role);
  }
  const currentConfig = readOptional(targets.configPath);
  const configModified = currentConfig !== null && hash(currentConfig) !== state.installedConfigHash;
  const backup = state.originalConfigExists && state.backupPath ? readOptional(state.backupPath) : null;
  const backupInvalid = state.originalConfigExists && (backup === null || hash(backup) !== state.originalConfigHash);
  if (!options.force && (modifiedRoles.length || configModified || backupInvalid)) {
    for (const role of modifiedRoles) preserved.push(`${role} was modified and was preserved`);
    if (configModified) preserved.push('config.toml changed after setup and was preserved');
    if (backupInvalid) preserved.push('original config backup is missing or changed; managed files were preserved');
    return {
      status: 'partial',
      changed: false,
      dryRun: options.dryRun === true,
      scope: targets.scope,
      root: targets.root,
      backupPath: state.backupPath,
      preserved
    };
  }

  for (const role of ROLE_NAMES) {
    const target = path.join(targets.agentsDir, `${role}.toml`);
    const current = readOptional(target);
    if (current === null) continue;
    if (!options.dryRun) fs.rmSync(target, { force: true });
  }

  if (currentConfig !== null && hash(currentConfig) === state.installedConfigHash) {
    if (!options.dryRun) {
      if (state.originalConfigExists) {
        if (backup !== null && hash(backup) === state.originalConfigHash) defaultAtomicWrite(targets.configPath, backup);
        else preserved.push('original config backup is missing or changed; current config was preserved');
      } else {
        fs.rmSync(targets.configPath, { force: true });
      }
    }
  } else if (currentConfig !== null) {
    preserved.push('config.toml changed after setup and was preserved');
  }

  if ((!preserved.length || options.force) && !options.dryRun) {
    fs.rmSync(targets.statePath, { force: true });
    if (state.backupPath && !configModified) fs.rmSync(state.backupPath, { force: true });
  }
  return {
    status: preserved.length ? 'partial' : 'completed',
    changed: true,
    dryRun: options.dryRun === true,
    scope: targets.scope,
    root: targets.root,
    backupPath: state.backupPath,
    preserved
  };
};

const parseCli = (argv) => {
  const options = {};
  let command = 'install';
  const takeValue = (index, flag) => {
    const value = argv[index + 1];
    if (!value || value.startsWith('--') || ['install', 'doctor', 'uninstall'].includes(value)) {
      throw new Error(`${flag} requires a value`);
    }
    return value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (['install', 'doctor', 'uninstall'].includes(value)) command = value;
    else if (value === '--scope') options.scope = takeValue(index++, value);
    else if (value === '--preset') options.preset = takeValue(index++, value);
    else if (value === '--codex-home') options.codexHome = takeValue(index++, value);
    else if (value === '--project-root') options.projectRoot = takeValue(index++, value);
    else if (value === '--dry-run') options.dryRun = true;
    else if (value === '--force') options.force = true;
    else if (value === '--json') options.json = true;
    else throw new Error(`unknown argument: ${value}`);
  }
  return { command, options };
};

const printHuman = (result) => {
  process.stdout.write(`Status: ${result.status}\n`);
  process.stdout.write(`Scope: ${result.scope}\n`);
  process.stdout.write(`Root: ${result.root}\n`);
  if (result.preset) process.stdout.write(`Preset: ${result.preset}\n`);
  if (result.configPath) process.stdout.write(`Config: ${result.configPath}\n`);
  if (result.statePath) process.stdout.write(`State: ${result.statePath}\n`);
  for (const [role, rolePath] of Object.entries(result.rolePaths ?? {})) {
    process.stdout.write(`Role ${role}: ${rolePath}\n`);
  }
  if ('backupPath' in result) process.stdout.write(`Backup: ${result.backupPath ?? 'none'}\n`);
  if ('changed' in result) process.stdout.write(`Changed: ${result.changed}\n`);
  for (const reason of result.reasons ?? []) process.stdout.write(`Blocker: ${reason}\n`);
  for (const finding of result.findings ?? []) process.stdout.write(`${finding.severity.toUpperCase()}: ${finding.message}\n`);
  for (const item of result.preserved ?? []) process.stdout.write(`Preserved: ${item}\n`);
  if (result.error) process.stdout.write(`Error: ${result.error}\n`);
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    const { command, options } = parseCli(process.argv.slice(2));
    const result = command === 'doctor'
      ? doctorSetup(options)
      : command === 'uninstall'
        ? uninstallSetup(options)
        : installSetup(options);
    if (options.json) process.stdout.write(stableJson(result));
    else printHuman(result);
    if (['blocked', 'failed'].includes(result.status)) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
