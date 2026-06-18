# Technical Plan

## Technical Plan

The Technical Plan must be implementation-ready and complete enough that an agent can execute it without guessing. It must reference the approved Business Plan. Use this structure:

```markdown
# <Feature or Change> Technical Plan

**Status:** Draft
**Created:** YYYY-MM-DD
**Business Plan:** <path>
**Technical Approach:** <confirmed option or "Forced by existing architecture">
**Execution Mode:** Pending | Subagent-driven | Inline

## Implementation Goal
<One paragraph tying technical work to the Business Plan goal.>

## Repository Context
<Relevant frameworks, existing patterns, files inspected, and constraints.>

## Repo Memory Context
Use `itsol-repo-memory` before completing this section when `.itsol.md` exists or when repository testing/verification policy is unclear.

| Path/Project | Policy Source | TDD Mode | Required Verification | Constraints |
| --- | --- | --- | --- | --- |
| `<path>` | `.itsol.md` or `not present` | `full/limited/not-supported/not-applicable/unknown` | `<commands/manual checks>` | `<constraint or None>` |

## Selected Technical Approach
<Option chosen or approved after the Technical Decision Gate. Include rejected alternatives and why they were not selected.>

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
| `itsol-repo-memory` | planning, implementation, review | apply `.itsol.md` repo/monorepo policy, TDD mode, and verification commands |
| `itsol-current-tech-context` | planning and review where technology versions matter | verify repo-pinned or latest stable docs and package context |
| `itsol-tdd-workflow` | before production code changes | RED-GREEN-REFACTOR gate |
| `<domain-skill>` | specific task or review | technology, security, data, infra, or review coverage |

At minimum include the process skills for implementation and TDD. Add focused domain skills for every touched surface: frontend, backend, database, generated clients, security, infrastructure, observability, or QA. Prefer narrow skills such as `security-authz-tenant-review` over broad generic security language.

For visible frontend work, include `ui-ux-workflow` and focused UI skills in the Technical Plan. Examples: `ui-design-system` for component/token changes, `ui-view-states-forms` for forms and data states, `ui-responsive-media` for viewport behavior, `ui-accessibility-motion` for keyboard/focus/reduced motion, `ui-performance-stability` for layout shift or large lists, and `ui-frontend-testing-qa` for UI verification.

## Data Flow And Contracts
<API requests/responses, DTOs, schemas, database collections/tables, events, jobs, cache keys, generated clients, external integrations.>

## Logical Rules And Branches
- `if <condition>` then <behavior>; else <behavior>
- validation, authorization, tenant isolation, feature flags, error paths, retries, idempotency, concurrency, and compatibility rules

## TDD Plan
**TDD Mode:** `<full | limited | not-supported | not-applicable | unknown>`
**Policy Source:** `<.itsol.md project section | repo default | none>`

### RED
- Test or diagnostic to add first
- Expected failing output

If TDD mode is `limited`, `not-supported`, or `not-applicable`, do not scaffold a new test framework only to satisfy TDD. Instead document why RED/GREEN TDD is skipped, supported verification commands, manual or diagnostic replacement verification, and residual risk from missing automated coverage.

### GREEN
- Minimal implementation to pass

### REFACTOR
- Cleanup allowed only after tests pass

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

**Task Packet Requirements:** each delegated task must receive approved plan paths, goal and acceptance criteria, source of truth, read scope, write scope or `read-only`, forbidden scope, required ITSOL skills, RED/GREEN or documented TDD exception, verification or replacement evidence, expected artifacts, allowed statuses, budget when useful, stop conditions, and escalation triggers.

**Response And Review Handling:** the main agent must validate every subagent response before accepting it. Require status `completed`, `partial`, `blocked`, or `failed`; changed files or inspected scope; evidence; assumptions; unverified items; coverage gap notes; risks; blockers; and next review target when files changed. Resolve `partial` and `blocked` results through revised packets, serialization, user/main-agent decisions, or stopped execution. For `failed`, inspect whether any artifacts are salvageable, then rerun with a narrower packet, switch to inline work, escalate, or stop.

**Conflict Handling:** state which files or shared semantic contracts require one writer at a time, how write scope conflicts will be serialized, and how semantic conflicts between subagent results will be checked during integration.

If inline execution is better, explain why subagents would add coordination overhead or risk for this plan.

## Verification Plan
- focused tests
- integration or contract tests
- lint/typecheck/build
- manual QA or smoke checks
- final diff/self-review

## Rollout And Rollback
<Migration order, flags, deployment notes, rollback plan, monitoring, compatibility. Use "Not applicable" only with reason.>

## Risks And Mitigations
- <technical/security/data/operational risk and mitigation>

## Open Questions
- <Question or "None">
```

After Plan Self-Review and Rubber Duck Plan Review pass, present the plan path and summary, then end with an explicit approval request:

`Technical Plan saved to <path>. Approve this file before I start implementation.`
