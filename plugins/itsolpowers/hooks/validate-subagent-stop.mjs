import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const continuationReason =
  'Return exactly one final envelope with ordered, column-one lines: Status: completed|partial|blocked|failed; Verification: non-empty evidence (completed cannot use not run); Unverified: non-empty gaps or none. If work is incomplete, do not use completed.';

const oneMatch = (text, pattern) => {
  const matches = [...text.matchAll(pattern)];
  return matches.length === 1 ? matches[0] : null;
};

export const validateEnvelope = (message) => {
  if (typeof message !== 'string' || message.trim() === '') return false;
  const trimmed = message.trim().replace(/\r\n/g, '\n');
  for (const label of ['Status', 'Verification', 'Unverified']) {
    if ((trimmed.match(new RegExp(`^${label}:`, 'gm')) || []).length !== 1) return false;
  }

  const envelope = trimmed.match(
    /(?:^|\n)Status: (completed|partial|blocked|failed)\nVerification: (\S[^\n]*)\nUnverified: (\S[^\n]*)$/
  );
  if (!envelope) return false;
  const status = oneMatch(trimmed, /^Status: (completed|partial|blocked|failed)$/gm);
  const verification = oneMatch(trimmed, /^Verification: (\S.*)$/gm);
  const unverified = oneMatch(trimmed, /^Unverified: (\S.*)$/gm);
  if (!status || !verification || !unverified) return false;
  if (!(status.index < verification.index && verification.index < unverified.index)) return false;
  if (status[1] === 'completed' && /^not run\b/i.test(verification[1])) return false;
  return true;
};

const normalizeAgentType = (value) => {
  if (typeof value !== 'string') return null;
  const parts = value.split(':');
  if (parts.length > 1 && parts[0] !== 'itsolpowers') return null;
  const normalized = parts.at(-1)?.split('/').at(-1);
  return normalized && /^[a-z0-9-]+$/.test(normalized) ? normalized : null;
};

export const evaluateSubagentStop = (input, agentsDir) => {
  const agentName = normalizeAgentType(input?.agent_type);
  if (!agentName || !fs.existsSync(path.join(agentsDir, `${agentName}.md`))) return null;
  if (input?.stop_hook_active === true) return null;
  if (validateEnvelope(input?.last_assistant_message)) return null;
  return { decision: 'block', reason: continuationReason };
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    const input = JSON.parse(raw);
    const agentsDir = process.env.ITSOLPOWERS_AGENTS_DIR
      ? path.resolve(process.env.ITSOLPOWERS_AGENTS_DIR)
      : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../agents');
    const decision = evaluateSubagentStop(input, agentsDir);
    if (decision) process.stdout.write(`${JSON.stringify(decision)}\n`);
  } catch {
    // Fail open for malformed platform input; parent-side validation remains authoritative.
  }
}
