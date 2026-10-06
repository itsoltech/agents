# Technical Plan

## Technical Plan

For planned modes under `itsol-workflow-mode`, the Technical Plan must be implementation-ready and complete enough that an agent can execute without guessing. It references an `Approved` governed Business Plan or a `Ready for execution` autonomous Business Plan. `direct` does not require this artifact. Use this structure:

```markdown
# <Feature or Change> Technical Plan

**Status:** Draft
**Workflow Mode:** governed | autonomous-planned
**Mode Source:** explicit-user-task-instruction | repo-default | fallback-default
**Decision Authority:** user | delegated
**Scope:** current-task
**Artifact State:** draft | approved | ready-for-execution
**Protected Constraints:** [] | <matched restrictions or action boundaries>
**Execution Policy:** <preset, sources, model/reasoning control, agent/parallel/review ceilings, resolved stop, escalation>
**Done When:** <observable completion criteria>
**Authorization:** Pending explicit user approval | Delegated by user for the current task
**Created:** YYYY-MM-DD
**Business Plan:** <path and Approved | Ready for execution state>
**Technical Approach:** <user-confirmed governed option | autonomous documented recommendation | Forced by existing architecture>
**Execution Mode:** Pending | Subagent-driven | Inline

## Implementation Goal
<One paragraph tying technical work to the Business Plan goal.>

## Repository Context
<Relevant frameworks, existing patterns, files inspected, and constraints.>

## Repo Memory Context
Use `itsol-repo-memory` before completing this section when `.itsol.md` exists or when repository testing/verification policy is unclear.

| Path/Project | Policy Source | Maintained Test Support | Required Verification | Constraints |
| --- | --- | --- | --- | --- |
| `<path>` | `.itsol.md` or `not present` | `available/limited/unavailable/not-applicable/unknown` | `<permitted checks/evidence>` | `<constraint or None>` |

## Selected Technical Approach
<Governed user choice or autonomous documented recommendation. Include rejected alternatives and why they were not selected.>

## Current Tech Context
Use `itsol-current-tech-context` before completing this section when the work depends on framework, SDK, runtime, package, generated client, external API, language edition, database driver, or infrastructure-tool behavior.

| Area | Detected Or Selected Version | Source Checked | Decision | Risk |
| --- | --- | --- | --- | --- |
| `<framework/runtime/package>` | `<repo version or latest stable>` | `<official docs/registry/release notes>` | `<use/pin/upgrade/defer>` | `<risk or None>` |

**Version Policy:** `<repo-pinned | latest stable | user-pinned | LTS | compatibility target>`
**Internet Check:** `<performed with date | unavailable; limitation>`

## Files And Ownership
| Path | Action | Owner/Agent | Purpose |
| --- | --- | --- | --- |
| `path/to/file` | Create/Modify/Test | main or subagent name | reason |

## Required ITSOL Skills
List the exact skills that must be loaded while implementing this plan. Include the reason and when to use each skill.

| Skill | Use During | Reason |
| --- | --- | --- |
| `itsol-feature-implementation` | whole implementation | primary feature workflow |
| `itsol-repo-memory` | planning, implementation, review | apply `.itsol.md` repo/monorepo constraints and supported verification commands |
| `itsol-current-tech-context` | planning and review where technology versions matter | verify repo-pinned or latest stable docs and package context |
| `<domain-skill>` | specific task or review | technology, security, data, infra, or review coverage |

Include the implementation process and only materially relevant domain skills. Add `itsol-tdd-workflow` only when the user explicitly requested test-first development. Prefer narrow skills such as `security-authz-tenant-review` over broad generic security language.

For visible frontend work, include `ui-ux-workflow` and focused UI skills in the Technical Plan. Examples: `ui-design-system` for component/token changes, `ui-view-states-forms` for forms and data states, `ui-responsive-media` for viewport behavior, `ui-accessibility-motion` for keyboard/focus/reduced motion, `ui-performance-stability` for layout shift or large lists, and `ui-frontend-testing-qa` for UI verification.

## Data Flow And Contracts
<API requests/responses, DTOs, schemas, database collections/tables, events, jobs, cache keys, generated clients, external integrations.>

## Logical Rules And Branches
- `if <condition>` then <behavior>; else <behavior>
- validation, authorization, tenant isolation, feature flags, error paths, retries, idempotency, concurrency, and compatibility rules

## Verification Plan
- observable behavior/contracts and material regression risks to verify
- relevant existing checks, permitted commands, and expected evidence
- new or changed tests only where useful coverage is missing
- permitted integration, contract, lint/typecheck, or manual checks when relevant
- unverified gaps and final diff/self-review

Follow the router's proportionate verification contract. Avoid tests of private structure, mock-call counts, duplicate coverage, and test files per function. No failing-test prerequisite or TDD exception is required. Only if the user explicitly requested TDD, describe the meaningful RED/GREEN proof here.

## Task Breakdown
### Task 1: <name>
**Goal:** <outcome>
**Files:** <exact paths or bounded areas>
**Required Skills:** `<skill-1>`, `<skill-2>`
**Steps:**
- [ ] <small executable step>
**Verification:** `<command>` and expected result
**Commit:** `<angular commit message>`

## Subagent Plan
If `Execution Mode` is `Subagent-driven` or subagents are likely, complete this section using `itsol-subagent-workflow` as the canonical contract for task graph, task packet, statuses, write scope, stop conditions, response contract, review loop, and final validation. Reinforce the contract here; do not redefine a conflicting parallel version.

**Concurrency Limit:** `<1 | 2 | 3 | user-approved higher>` because `<write ownership/risk rationale>`.

**Task Graph:**
| Task ID | Name | Type | Dependencies | Write Scope | Reviewer/Review Area | Verification Or Evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `T1` | `<short name>` | `implementation/review/research/verification/integration` | `<none or task ids>` | `<exact files/areas or read-only>` | `<skill or area>` | `<command/evidence>` | `planned` |

**Task Packet Requirements:** each delegated task must receive mode-valid plan paths and artifact state (`Approved`, `Ready for execution`, or `not-required`), all seven workflow-state fields, goal and acceptance criteria, source of truth, read scope, write scope or `read-only`, forbidden scope, required ITSOL skills, proportionate verification and evidence, expected artifacts, allowed statuses, budget when useful, stop conditions, and escalation triggers. Carry an explicit test-first instruction only when the user requested it.

Also include the complete `itsol-execution-policy` state, observable `done_when`, remaining distinct-child and review-cycle capacity, and a ranked child stop no later than the parent. Never use `maxTurns`.

**Response And Review Handling:** the main agent must validate every subagent response before accepting it. Require status `completed`, `partial`, `blocked`, or `failed`; changed files or inspected scope; evidence; assumptions; unverified items; coverage gap notes; risks; blockers; and next review target when files changed. Resolve `partial` and `blocked` results through revised packets, serialization, user/main-agent decisions, or stopped execution. For `failed`, inspect whether any artifacts are salvageable, then rerun with a narrower packet, switch to inline work, escalate, or stop.

**Conflict Handling:** state which files or shared semantic contracts require one writer at a time, how write scope conflicts will be serialized, and how semantic conflicts between subagent results will be checked during integration.

If inline execution is better, explain why subagents would add coordination overhead or risk for this plan.

## Rollout And Rollback
<Migration order, flags, deployment notes, rollback plan, monitoring, compatibility. Use "Not applicable" only with reason.>

## Risks And Mitigations
- <technical/security/data/operational risk and mitigation>

## Open Questions
- <Question or "None">
```

In `governed`, after proportionate self-review and any required/selected isolated review pass, present the path and summary, request explicit approval, and only then set `Approved`:

`Technical Plan saved to <path>. Approve this file before I start implementation.`

In `autonomous-planned`, resolve concrete material findings and set `**Status:** Ready for execution`. Add `**Rubber Duck Verdict:** Ready` only when isolated review ran, select the documented recommendation, choose execution mode, and continue without asking for approval. Never call this user-approved.
