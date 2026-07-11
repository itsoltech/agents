#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../../.." && pwd)"
manifest="${script_dir}/workflow-mode-consumers.txt"
contract_dir="${repo_root}/plugins/itsolpowers/skills/itsol-workflow-mode"

cd "${repo_root}"

failures=0
tmp_dir="$(mktemp -d)"
trap 'rm -rf "${tmp_dir}"' EXIT

fail() {
  printf 'workflow-mode validation: %s\n' "$1" >&2
  failures=$((failures + 1))
}

if [[ ! -f "${manifest}" ]]; then
  printf 'workflow-mode validation: missing consumer manifest: %s\n' "${manifest}" >&2
  exit 1
fi

awk -F '\t' '
  /^#/ || NF == 0 { next }
  NF != 2 { print "line " NR ": expected <class><TAB><path>"; next }
  $1 !~ /^(canonical-contract|mode-aware-consumer|governed-only-template|historical-documentation|unrelated-domain-approval)$/ {
    print "line " NR ": invalid class " $1
  }
' "${manifest}" > "${tmp_dir}/format-errors"

if [[ -s "${tmp_dir}/format-errors" ]]; then
  while IFS= read -r error; do fail "${error}"; done < "${tmp_dir}/format-errors"
fi

awk -F '\t' '!/^#/ && NF == 2 { print }' "${manifest}" > "${tmp_dir}/entries"
LC_ALL=C sort -t $'\t' -k1,1 -k2,2 "${tmp_dir}/entries" > "${tmp_dir}/entries-sorted"
if ! cmp -s "${tmp_dir}/entries" "${tmp_dir}/entries-sorted"; then
  fail "consumer manifest data rows are not sorted by class and path"
fi

cut -f2 "${tmp_dir}/entries" | LC_ALL=C sort > "${tmp_dir}/manifest-paths"
uniq -d "${tmp_dir}/manifest-paths" > "${tmp_dir}/duplicate-paths"
if [[ -s "${tmp_dir}/duplicate-paths" ]]; then
  while IFS= read -r path; do fail "duplicate manifest path: ${path}"; done < "${tmp_dir}/duplicate-paths"
fi

while IFS=$'\t' read -r class path; do
  if [[ ! -f "${path}" ]]; then
    fail "${class} file does not exist: ${path}"
  fi
done < "${tmp_dir}/entries"

gate_pattern='Business Plan|Technical Plan|Technical Fix Plan|Decision Gate|approval gate|approval pause|explicit(ly)? (user )?approv|direct user request|approved plan|must be approved|Status:.*(Draft|Approved)|before implementation|before delegation|fix-plan'
set +e
rg -l --hidden -i -S "${gate_pattern}" \
  README.md plugins/itsolpowers .claude-plugin/marketplace.json \
  --glob '!**/scripts/workflow-mode-consumers.txt' \
  --glob '!**/scripts/validate-workflow-modes.sh' \
  > "${tmp_dir}/scanned-paths-raw"
scan_rc=$?
set -e
if [[ "${scan_rc}" -gt 1 ]]; then
  fail "repository gate scan failed with rg exit code ${scan_rc}"
fi
LC_ALL=C sort "${tmp_dir}/scanned-paths-raw" > "${tmp_dir}/scanned-paths"

comm -23 "${tmp_dir}/scanned-paths" "${tmp_dir}/manifest-paths" > "${tmp_dir}/unclassified-paths"
if [[ -s "${tmp_dir}/unclassified-paths" ]]; then
  while IFS= read -r path; do fail "unclassified gate-bearing file: ${path}"; done < "${tmp_dir}/unclassified-paths"
fi

while IFS=$'\t' read -r class path; do
  [[ "${class}" == "mode-aware-consumer" ]] || continue
  [[ -f "${path}" ]] || continue
  case "${path}" in
    plugins/itsolpowers/package.json)
      ;;
    *.json)
      if ! rg -q -i -S 'workflow[- ]mode|itsol-workflow-mode' "${path}"; then
        fail "mode-aware metadata does not describe workflow modes: ${path}"
      fi
      ;;
    *)
      if ! rg -q -F 'itsol-workflow-mode' "${path}"; then
        fail "mode-aware consumer does not reference itsol-workflow-mode: ${path}"
      fi
      ;;
  esac
done < "${tmp_dir}/entries"

legacy_gate_pattern='Functional work must use .*Business Plan|Do not write code until .*Business Plan|require (an )?approved Technical Fix Plan|require approved Business Plan|Do not write code unless .*approved Business Plan|Confirm .*Business Plan.*explicitly approved|Use this skill after a Business Plan and Technical Plan are approved|Do not start implementation subagents until .*plan|Require Business Plan approval|require explicit user approval before technical planning'
while IFS=$'\t' read -r class path; do
  [[ "${class}" == "mode-aware-consumer" ]] || continue
  [[ -f "${path}" ]] || continue
  set +e
  rg -n -i -S "${legacy_gate_pattern}" "${path}" > "${tmp_dir}/legacy-matches"
  legacy_rc=$?
  set -e
  if [[ "${legacy_rc}" -gt 1 ]]; then
    fail "legacy gate scan failed for ${path} with rg exit code ${legacy_rc}"
    continue
  fi
  while IFS= read -r match; do
    [[ -n "${match}" ]] || continue
    if [[ ! "${match}" =~ [Gg]overned ]]; then
      fail "unqualified legacy planning gate in ${path}: ${match}"
    fi
  done < "${tmp_dir}/legacy-matches"
done < "${tmp_dir}/entries"

required_contract_files=(
  "plugins/itsolpowers/skills/itsol-workflow-mode/SKILL.md"
  "plugins/itsolpowers/skills/itsol-workflow-mode/references/guide.md"
  "plugins/itsolpowers/skills/itsol-workflow-mode/agents/openai.yaml"
  "plugins/itsolpowers/agents/itsol-workflow-mode.md"
)

for path in "${required_contract_files[@]}"; do
  [[ -f "${path}" ]] || continue
  for token in governed autonomous-planned direct; do
    if ! rg -q -F "${token}" "${path}"; then
      fail "canonical contract file ${path} is missing mode token: ${token}"
    fi
  done
done

canonical_skill="plugins/itsolpowers/skills/itsol-workflow-mode/SKILL.md"
required_state_fields=(
  workflow_mode
  mode_source
  decision_authority
  scope
  artifact_state
  execution_mode
  protected_constraints
)
required_state_values=(
  draft
  approved
  ready-for-execution
  not-required
  pending
  inline
  subagents
  auto
)

if [[ -f "${canonical_skill}" ]]; then
  for token in "${required_state_fields[@]}" "${required_state_values[@]}"; do
    if ! rg -q -F "${token}" "${canonical_skill}"; then
      fail "canonical workflow state is missing token: ${token}"
    fi
  done
  for transition in 'artifact_state: draft' 'artifact_state: approved' 'artifact_state: not-required' 'ready-for-execution' 'execution_mode: pending'; do
    if ! rg -q -F "${transition}" "${canonical_skill}"; then
      fail "canonical workflow transition is missing: ${transition}"
    fi
  done
fi

for path in plugins/itsolpowers/hooks/bootstrap-context.md plugins/itsolpowers/skills/using-itsolpowers/SKILL.md; do
  [[ -f "${path}" ]] || continue
  for token in governed autonomous-planned direct "${required_state_fields[@]}" draft approved ready-for-execution not-required pending; do
    if ! rg -q -F "${token}" "${path}"; then
      fail "bootstrap/router workflow contract ${path} is missing token: ${token}"
    fi
  done
done

manifest_class() {
  awk -F '\t' -v wanted="$1" '!/^#/ && $2 == wanted { print $1; exit }' "${manifest}"
}

while IFS=$'\t' read -r class path; do
  counterpart=""
  if [[ "${path}" =~ ^plugins/itsolpowers/skills/([^/]+)/SKILL\.md$ ]]; then
    counterpart="plugins/itsolpowers/agents/${BASH_REMATCH[1]}.md"
  elif [[ "${path}" =~ ^plugins/itsolpowers/agents/([^/]+)\.md$ ]]; then
    counterpart="plugins/itsolpowers/skills/${BASH_REMATCH[1]}/SKILL.md"
  fi
  [[ -n "${counterpart}" && -f "${counterpart}" ]] || continue
  counterpart_class="$(manifest_class "${counterpart}")"
  if [[ -z "${counterpart_class}" ]]; then
    fail "manifest parity omission: ${path} (${class}) -> ${counterpart}"
  elif [[ "${counterpart_class}" != "${class}" ]]; then
    fail "manifest parity mismatch: ${path} (${class}) -> ${counterpart} (${counterpart_class})"
  fi
done < "${tmp_dir}/entries"

if [[ "${failures}" -ne 0 ]]; then
  printf 'workflow-mode validation: FAILED (%d issue%s)\n' \
    "${failures}" "$([[ "${failures}" -eq 1 ]] && printf '' || printf 's')" >&2
  exit 1
fi

printf 'workflow-mode validation: PASS (%d classified files)\n' "$(wc -l < "${tmp_dir}/entries" | tr -d ' ')"
