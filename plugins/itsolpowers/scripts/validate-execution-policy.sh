#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../.." && pwd)"
plugin_root="${repo_root}/plugins/itsolpowers"
consumer_manifest="${script_dir}/execution-policy-consumers.txt"

cd "${repo_root}"

failures=0

fail() {
  printf 'execution-policy validation: %s\n' "$1" >&2
  failures=$((failures + 1))
}

require_file() {
  [[ -f "$1" ]] || fail "missing required file: $1"
}

require_token() {
  local path="$1"
  local token="$2"
  [[ -f "${path}" ]] || return 0
  rg -q -F "${token}" "${path}" || fail "${path} is missing token: ${token}"
}

policy_skill="plugins/itsolpowers/skills/itsol-execution-policy/SKILL.md"
policy_reference="plugins/itsolpowers/skills/itsol-execution-policy/references/policy.md"
platform_reference="plugins/itsolpowers/skills/itsol-execution-policy/references/platform-capabilities.md"
stop_reference="plugins/itsolpowers/skills/itsol-execution-policy/references/stops-and-delegation.md"

for path in \
  "package.json" \
  "${policy_skill}" \
  "${policy_reference}" \
  "${platform_reference}" \
  "${stop_reference}" \
  "plugins/itsolpowers/skills/itsol-execution-policy/agents/openai.yaml" \
  "plugins/itsolpowers/agents/itsol-execution-policy.md" \
  "plugins/itsolpowers/hooks/subagent-stop" \
  "plugins/itsolpowers/hooks/validate-subagent-stop.mjs" \
  "plugins/itsolpowers/scripts/test-subagent-stop.mjs" \
  "plugins/itsolpowers/scripts/test-opencode-adapter.mjs" \
  "plugins/itsolpowers/scripts/test-pi-adapter.mjs" \
  "plugins/itsolpowers/scripts/test-pi-runtime.ts" \
  "plugins/itsolpowers/extensions/pi/task-state.ts" \
  "plugins/itsolpowers/hooks/bootstrap-context-pi.md" \
  "plugins/itsolpowers/scripts/test-execution-policy.mjs" \
  "plugins/itsolpowers/scripts/test-codex-agent-setup.mjs" \
  "plugins/itsolpowers/skills/itsol-codex-setup/SKILL.md" \
  "plugins/itsolpowers/skills/itsol-codex-setup/scripts/configure-codex.mjs" \
  "plugins/itsolpowers/skills/itsol-codex-doctor/SKILL.md" \
  "${consumer_manifest#${repo_root}/}"; do
  require_file "${path}"
done

[[ -x plugins/itsolpowers/hooks/subagent-stop ]] || fail "subagent-stop hook must be executable"

for token in execution_policy preset policy_sources model_profile model_control reasoning_profile reasoning_control max_subagents max_parallel max_review_rounds stop_after budget_escalation done_when; do
  require_token "${policy_skill}" "${token}"
done

for token in economy standard deep custom requested-result implementation-reviewed integration-validated partial blocked failed; do
  require_token "${policy_reference}" "${token}"
done

for token in 'Status:' 'Verification:' 'Unverified:' 'stop_hook_active' 'maxTurns'; do
  require_token "${stop_reference}" "${token}"
done

if [[ -f "${consumer_manifest}" ]]; then
  if ! LC_ALL=C sort -c "${consumer_manifest}" 2>/dev/null; then
    fail "consumer manifest is not sorted"
  fi
  while IFS= read -r path; do
    [[ -n "${path}" && ! "${path}" =~ ^# ]] || continue
    if [[ ! -f "${path}" ]]; then
      fail "consumer does not exist: ${path}"
      continue
    fi
    if ! rg -q -F 'itsol-execution-policy' "${path}"; then
      fail "consumer does not reference itsol-execution-policy: ${path}"
    fi
  done < "${consumer_manifest}"
fi

agent_count=0
while IFS= read -r agent; do
  agent_count=$((agent_count + 1))
  rg -q '^model: sonnet$' "${agent}" || fail "agent must use balanced Claude default model: ${agent}"
  rg -q '^effort: medium$' "${agent}" || fail "agent must use medium effort: ${agent}"
  if rg -q '^maxTurns:' "${agent}"; then
    fail "agent must not define maxTurns: ${agent}"
  fi
  if rg -q '^tools:.*\bAgent\b' "${agent}"; then
    fail "agent allowlist exposes Agent: ${agent}"
  fi
  rg -q '^disallowedTools:.*\bAgent\b' "${agent}" || fail "agent must disallow Agent: ${agent}"
  for label in 'Status:' 'Verification:' 'Unverified:'; do
    rg -q -F "${label}" "${agent}" || fail "agent output contract is missing ${label} ${agent}"
  done
done < <(find plugins/itsolpowers/agents -maxdepth 1 -name '*.md' -print | LC_ALL=C sort)

[[ "${agent_count}" -gt 0 ]] || fail "no Claude plugin agents found"

bootstrap_words="$(wc -w < plugins/itsolpowers/hooks/bootstrap-context.md | tr -d ' ')"
if [[ "${bootstrap_words}" -gt 450 ]]; then
  fail "shared bootstrap exceeds 450 words: ${bootstrap_words}"
fi

opencode_adapter="plugins/itsolpowers/.opencode/plugins/itsolpowers.js"
require_token "${opencode_adapter}" 'bootstrap-context.md'
if rg -q "path.join\(skillsDir, 'using-itsolpowers', 'SKILL.md'\)" "${opencode_adapter}"; then
  fail "OpenCode adapter still injects the full router skill"
fi

require_token "plugins/itsolpowers/hooks/hooks.json" 'SubagentStop'
if rg -q -F 'SubagentStop' plugins/itsolpowers/hooks/hooks-codex.json; then
  fail "Codex hooks must not register the Claude ITSOL-agent stop validator"
fi

for script in validate:execution-policy test:subagent-stop test:opencode-adapter test:pi-adapter test:pi-runtime test:execution-policy test:codex-agent-setup; do
  require_token "plugins/itsolpowers/package.json" "\"${script}\""
done

if ! node plugins/itsolpowers/scripts/test-execution-policy.mjs; then
  fail "execution-policy schema fixtures failed"
fi

for path in package.json plugins/itsolpowers/package.json plugins/itsolpowers/.claude-plugin/plugin.json plugins/itsolpowers/.codex-plugin/plugin.json; do
  require_token "${path}" '"version": "0.23.0"'
done
require_token ".claude-plugin/marketplace.json" '"version": "1.21.0"'

if ! node plugins/itsolpowers/scripts/test-codex-agent-setup.mjs; then
  fail "Codex agent setup fixtures failed"
fi

set +e
node -e 'for (const p of process.argv.slice(1)) JSON.parse(require("fs").readFileSync(p, "utf8"))' \
  package.json \
  plugins/itsolpowers/package.json \
  plugins/itsolpowers/.claude-plugin/plugin.json \
  plugins/itsolpowers/.codex-plugin/plugin.json \
  plugins/itsolpowers/hooks/hooks.json \
  plugins/itsolpowers/hooks/hooks-codex.json \
  .claude-plugin/marketplace.json \
  .agents/plugins/marketplace.json
json_rc=$?
set -e
[[ "${json_rc}" -eq 0 ]] || fail "JSON parsing failed"

if [[ "${failures}" -ne 0 ]]; then
  printf 'execution-policy validation: FAILED (%d issue%s)\n' \
    "${failures}" "$([[ "${failures}" -eq 1 ]] && printf '' || printf 's')" >&2
  exit 1
fi

printf 'execution-policy validation: PASS (%d Claude agents)\n' "${agent_count}"
