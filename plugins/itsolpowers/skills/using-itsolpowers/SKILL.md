---
name: using-itsolpowers
description: "Route ITSOL work to the smallest skills by stage, authority, domain, and risk."
---
# Using ITSOL Powers

Choose the smallest sufficient context. Skill descriptions are the routing index; do not preload family checklists.

## 1. Classify

**Bounded administration:** repository inspection/status, `.itsol.md` initialization or update, and a local commit of an already verified slice. Load `itsol-repo-memory` only when repository policy is involved. Reuse prior evidence for commit-only work; do not create plans, delegation, review, QA, or a new completion gate. Push, release, deployment, and other external effects remain separately authorized.

**Engineering:** identify the current stage—initiative/intake, requirements, planning, implementation, debugging, migration, review, QA, or current-tech research—before selecting skills.

## 2. Resolve authority only when relevant

Load `itsol-workflow-mode` when planning, implementation, bugfix, delegation, or a mode transition needs authority. Do not load it for ordinary read-only review, research, QA, or bounded administration unless the request changes governed state.

Its canonical contract resolves `governed`, `autonomous-planned`, or `direct` and owns `workflow_mode`, `mode_source`, `decision_authority`, `scope`, `artifact_state`, `execution_mode`, and `protected_constraints`. Preserve canonical values including `draft`, `approved`, `ready-for-execution`, `not-required`, `pending`, `inline`, `subagents`, and `auto`; never reinterpret delegated readiness as user approval.

## 3. Select one primary process

- broad multi-phase outcome: `itsol-initiative-delivery`
- unclear request/intake: `itsol-task-intake`
- functional requirements or plan: `itsol-functional-planning`; review requirements with `itsol-requirements-review`
- authorized feature/refactor: `itsol-feature-implementation`
- bug/regression: `itsol-bug-debugging`
- rewrite/toolchain migration: `application-technology-migration`
- code/PR review: `itsol-code-review-workflow`
- browser dogfood: `agent-browser-dogfood-workflow`
- QA handoff: `itsol-qa-handoff`
- delegation packet or delegated-worker boundary: `itsol-subagent-workflow`
- execution budget, stop, or completion gap: `itsol-execution-policy`
- version/API research: `itsol-current-tech-context`
- ML evaluation: `ml-data-evaluation`
- security design: `security-threat-modeling`
- infrastructure incident: `infra-incident-debugging`

Use `itsol-tdd-workflow` before behavior-changing code. Finish implementation with `itsol-self-review`. Use `itsol-codex-setup` or `itsol-codex-doctor` only for explicit Codex role setup or diagnosis.

## 4. Add the smallest domain set

Read candidate skill descriptions, then add only touched surfaces. Families include `agent-browser-*`, `security-*`, `infra-*`, `ml-*`, `ui-*`, `react-nextjs-*`, `tanstack-query-*`, `svelte-*`, `expo-*`, `electron-*`, `tauri-*`, `dotnet-web-api-*`, `effect-typescript-*`, `hey-api-openapi-*`, `rust-*`, `postgres-*`, `mongodb-*`, and `mssql-*`. Prefer implementation/debugging/review variants matching the task stage. Load `itsol-current-tech-context` when a material claim depends on a runtime, framework, SDK, package, generator, or external API.

## 5. Load execution and review policy only when needed

Load `itsol-execution-policy` for explicit budget/model/stop constraints, delegation, long-running completion, multi-surface review/QA, or other material execution risk. Load `itsol-subagent-workflow` only after delegation is authorized. Only the main agent delegates; children never delegate or invoke agent CLIs. Use one writer per file/semantic contract and validate evidence before accepting `completed`; preserve honest `partial`, `blocked`, and `failed`.

Context profile precedence is explicit task, `ITSOLPOWERS_CONTEXT_PROFILE`, validated runtime capability, then `compatibility`. Invalid input fails closed and is surfaced. Provider name alone never selects `frontier`. Profiles never weaken workflow authority, repository restrictions, protected actions, deterministic contracts, honest incomplete status, or nested-delegation prohibition.

`frontier` uses risk-proportionate verification/review and stays inline for small or sequential work unless independent work adds material value. `compatibility` keeps explicit RED/GREEN, verification, response, and review scaffolding. Neither profile defaults to small-task fan-out or verifier-only spawning.

## Delegated packet

Carry a stable work-item ID; all seven `itsol-workflow-mode` fields; approved/ready/not-required artifact evidence appropriate to the mode; execution policy and `done_when`; dependency state; narrow read/write/forbidden scope; one semantic owner; selected skills; RED/GREEN or an explicit replacement check; allowed terminal statuses; and stop/escalation conditions.

Only the main agent delegates. Keep writers disjoint. A different read-only reviewer checks each implementation slice; concrete material findings return to the same writer for a bounded fix and targeted verification. A stopped child is not automatically complete.

## Handoff

Report changed and inspected files, commands and observed results, assumptions, unverified items, coverage gaps, risks, blockers, integration dependencies, and the next review target. Preserve `completed`, `partial`, `blocked`, or `failed` exactly.

For a separately authorized commit, inspect the exact diff, stage only the verified coherent slice, use Angular convention, and never imply authority to push, publish, release, or deploy.
