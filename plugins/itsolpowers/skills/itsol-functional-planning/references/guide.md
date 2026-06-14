# ITSOL Functional Planning Reference

Use this reference when a user asks to build, modify, add, remove, or change application behavior.

## Hard Gate

For functional tasks, do not edit production code, tests, configs, migrations, or generated clients until all conditions are true:

- the Business Plan markdown file exists in the repo
- the user approved the Business Plan file
- the Technical Plan markdown file exists in the repo
- the user approved the Technical Plan file
- the user chose execution mode: subagents or inline

If the user asks to skip planning, still produce the shortest useful version of both plans and ask for approval.

## Plan Files

Persist planning artifacts in the target repository, similar to how Superpowers saves specs and implementation plans before execution.

Default location:

- Business Plan: `.itsol/plans/YYYY-MM-DD-<task-slug>-business.md`
- Technical Plan: `.itsol/plans/YYYY-MM-DD-<task-slug>-technical.md`

Use a different location only when the repo already has a clear planning convention or the user requests one. Do not use plugin source documentation folders or external best-practices source directories as the default destination.

Before writing:

1. Inspect existing repo conventions for planning docs.
2. Create the destination directory if missing.
3. Use the current date and a short lowercase slug from the task.
4. Keep both plan files under version control unless the user says planning artifacts should stay local.
5. After each file is written, run the Plan Self-Review and fix placeholders, contradictions, missing sections, vague acceptance criteria, TODOs, unresolved questions, and verification gaps before asking for approval.

## Plan Self-Review

After writing or updating a plan file, review the file before asking the user for approval. Fix issues inline first; do not ask the user to approve a plan with known gaps.

For the Business Plan, check:

- no `TODO`, `TBD`, placeholders, empty sections, or generic filler
- goal, current behavior, desired behavior, scope, out-of-scope, and acceptance criteria are specific
- business rules cover edge cases, negative paths, roles, permissions, tenants, and data ownership where relevant
- UX/API behavior and copy are explicit enough for QA and implementation
- QA scenarios cover happy path, negative path, permission path, and important regressions
- risks, assumptions, and open questions are either resolved or explicitly safe to carry forward
- the plan is small enough to implement as one coherent first scope

For the Technical Plan, check:

- exact files or bounded areas are named wherever reasonably knowable
- Required ITSOL Skills are complete and mapped to tasks or review phases
- Current Tech Context is present when the plan depends on frameworks, SDKs, runtimes, package managers, libraries, generated clients, external APIs, language editions, or infrastructure tooling
- logical branches include important `if`/else behavior, validation, authorization, tenant isolation, error handling, idempotency, retries, and compatibility where relevant
- TDD plan has a concrete RED test or diagnostic, expected failure, GREEN scope, and refactor checkpoint
- each task has files, required skills, steps, verification, and an Angular commit message
- subagent split and concurrency limit are present when subagent-driven execution is plausible
- verification commands are concrete and scoped
- rollout, rollback, monitoring, and data migration notes are covered or explicitly not applicable with reason
- no task depends on undefined types, functions, external services, or assumptions hidden outside the plan

If self-review finds unresolved items that materially affect scope or implementation, ask targeted follow-up questions before requesting approval. If an item is intentionally deferred, document it in out-of-scope or follow-up scope.

## Scope Gate

Before interviewing in detail, decide whether the request is small enough for one coherent Business Plan and one Technical Plan.

Treat the request as too broad when it includes:

- several independent products, workflows, modules, or user journeys
- unrelated UI, API, data, infrastructure, and integration changes with separate rollout risks
- unclear acceptance criteria across multiple stakeholder goals
- migrations plus large feature work plus operational changes in one request
- more task slices than can be reviewed and validated as one safe release

When the request is too broad:

1. Explain the risk concretely: broad plans create weak acceptance criteria, missed edge cases, conflicting implementation work, and unreliable verification.
2. Propose a smaller first scope that can be implemented, reviewed, deployed, and validated independently.
3. Name the deferred follow-up scopes explicitly.
4. Ask the user to approve the smaller first scope before continuing the interview.
5. Plan follow-up changes only after the first plan is implemented and validated, unless the user explicitly asks for a roadmap document rather than an implementation plan.

Do not bury multiple independent projects inside one Technical Plan. A good first plan should produce a useful, testable increment on its own.

## Embedded Deep-Planning Interview

Use the interview pattern embedded directly in this skill. Do not assume any other plugin, slash command, or external planning command is installed. The pattern is: review the current codebase first, then interview the user in depth before writing planning artifacts.

Before writing either plan:

1. Inspect relevant code, routes, API contracts, schemas, tests, configs, existing UI, and recent local conventions.
2. Ask follow-up questions only after that inspection, so questions are specific and not obvious.
3. Continue interviewing until the Business Plan and Technical Plan can be written without placeholders, guesses, or vague requirements.
4. Prefer one focused question at a time. If the runtime provides a dedicated user-question tool, use it; otherwise ask directly in chat.
5. Group related alternatives into clear choices when that helps the user answer, but ask open-ended questions when the domain requires nuance.
6. Stop asking only when remaining unknowns can be safely written as explicit assumptions or open questions in the plan file.

Ask about business and product depth:

- who the change is for
- what behavior changes from the user's perspective
- what is explicitly out of scope
- permissions, roles, tenant boundaries, and data ownership
- edge cases and negative paths
- states, statuses, workflows, notifications, copy, audit needs, reporting, and support implications
- rollout, migration, compatibility, and customer communication constraints
- success criteria, acceptance criteria, and QA scenarios

Ask about technical depth:

- exact UI surfaces, routes, components, API endpoints, background jobs, integrations, generated clients, schemas, migrations, cache, events, queues, and observability touched
- framework, SDK, runtime, package manager, dependency, generated-client, API, Rust edition, .NET SDK, Node/Bun/npm, database driver, and infrastructure-tool versions that must be verified against current documentation
- important tradeoffs, rejected approaches, backwards compatibility, performance, security, tenant isolation, error handling, retries, idempotency, concurrency, and data consistency
- test strategy, TDD entry point, expected RED failure, verification commands, manual smoke checks, and rollback
- which ITSOL skills should be used during implementation and review

Ask about UX depth when the change is visible:

- primary user path and alternate paths
- empty, loading, error, disabled, permission-denied, and success states
- validation messages, labels, copy, navigation, accessibility, responsiveness, browser behavior, and analytics if relevant

Ask about delivery depth:

- task slicing, subagent suitability, concurrency limit, code review coverage, commit boundaries, release order, and post-release checks
- rollout, migration, and compatibility constraints

If a detail can be inferred safely from existing code or established patterns, state it as an assumption in the plan instead of asking.

Do not ask checklist questions mechanically. Each question should close a real gap that affects scope, behavior, architecture, testing, or risk.

## Business Plan

The Business Plan must be understandable without reading code and complete enough for stakeholders, QA, and implementation agents to understand what must change. Use this structure:

```markdown
# <Feature or Change> Business Plan

**Status:** Draft | Approved
**Created:** YYYY-MM-DD
**Related request:** <short summary or ticket link>
**Technical Plan:** <path when available>

## Goal
<One paragraph describing the user-visible outcome and why it matters.>

## Current Behavior
<What happens now, including pain points or missing capability.>

## Desired Behavior
<What should happen after the change from the user's point of view.>

## Users And Roles
<Affected users, roles, permissions, tenant boundaries, data ownership, and actor-specific behavior.>

## Scope
### In Scope
- <Concrete behavior included>

### Out Of Scope
- <Explicit exclusions>

## Business Rules
- <Rule, condition, edge case, negative path, or policy>

## Acceptance Criteria
- [ ] <Observable criterion QA and the user can verify>

## UX, Copy, And API Behavior
<Visible UI/API behavior, messages, empty states, errors, notifications, or response semantics.>

## Data And Audit Expectations
<What data is read, written, retained, exposed, audited, or migrated.>

## QA Scenarios
- <Manual or automated scenario, including negative and permission cases>

## Risks
- <Business, operational, user, legal, data, migration, rollout, or compatibility risk>

## Assumptions
- <Assumption that must be true for this plan>

## Open Questions
- <Question or "None">
```

End with an explicit approval request:

`Business Plan saved to <path>. Approve this file before I prepare the Technical Plan.`

## Technical Plan

The Technical Plan must be implementation-ready and complete enough that an agent can execute it without guessing. It must reference the approved Business Plan. Use this structure:

```markdown
# <Feature or Change> Technical Plan

**Status:** Draft | Approved
**Created:** YYYY-MM-DD
**Business Plan:** <path>
**Execution Mode:** Pending | Subagent-driven | Inline

## Implementation Goal
<One paragraph tying technical work to the Business Plan goal.>

## Repository Context
<Relevant frameworks, existing patterns, files inspected, and constraints.>

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
### RED
- Test or diagnostic to add first
- Expected failing output

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
<If subagent-driven is likely: task split, reviewer split, concurrency limit, and handoff expectations. Otherwise explain why inline is better.>

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

End with an explicit approval request:

`Technical Plan saved to <path>. Approve this file before I start implementation.`

## Execution Mode Question

After both plans are approved, ask:

`How should I execute this: subagent-driven or inline?`

Recommend subagents when the task has independent surfaces, such as UI/API/database/security/infra, several files with separate ownership, or parallel review/debugging paths. Recommend inline for tiny single-surface changes where subagent coordination would add overhead.

Do not start implementation until the user answers or explicitly instructs a default. If the user asks for your recommendation, choose subagent-driven for medium or larger functional work and inline for very small single-file changes.

When the user chooses subagent-driven execution, load `itsol-subagent-workflow` before implementation. That workflow owns task splitting, concurrency, implementation delegation, independent review loops, per-task commits, final validation, and the final user summary.
