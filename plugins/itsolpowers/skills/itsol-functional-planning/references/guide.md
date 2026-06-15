# ITSOL Functional Planning Reference

Use this reference when a user asks to build, modify, add, remove, or change application behavior.

## Hard Gate

For functional tasks, do not edit production code, tests, configs, migrations, or generated clients until all conditions are true:

- the Discovery Gate is complete for vague, one-sentence, broad, or underspecified requests
- the Business Plan markdown file exists in the repo
- the user approved the Business Plan file
- the Technical Decision Gate is complete before the Technical Plan is written, unless there is only one viable technical path forced by existing repo architecture
- the Technical Plan markdown file exists in the repo
- the user approved the Technical Plan file
- the user chose execution mode: subagents or inline

If the user asks to skip planning, still produce the shortest useful version of both plans and ask for approval.

Do not write a Business Plan directly from a vague request. A short user brief is only a starting signal for discovery, not permission to choose product behavior, scope, architecture, or rollout strategy on the user's behalf.

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
- every product or implementation scenario chosen in the plan was either explicitly selected by the user, forced by existing repo conventions, or documented as a low-risk assumption that does not change business behavior
- business rules cover edge cases, negative paths, roles, permissions, tenants, and data ownership where relevant
- UX/API behavior and copy are explicit enough for QA and implementation
- QA scenarios cover happy path, negative path, permission path, and important regressions
- risks, assumptions, and open questions are either resolved or explicitly safe to carry forward without changing scope, business behavior, architecture, rollout, or user-facing expectations
- the plan is small enough to implement as one coherent first scope

For the Technical Plan, check:

- exact files or bounded areas are named wherever reasonably knowable
- the selected technical approach was explicitly chosen by the user, explicitly approved after recommendation, or forced by existing repo architecture
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

### Discovery Gate

Run the Discovery Gate before writing the Business Plan when the user gives only a short request, a desired outcome without acceptance criteria, a broad goal, or a request with multiple possible product/technical interpretations.

Treat the agent as a project manager and the user as the client. Load `itsol-requirements-review` for this phase and use its client-interview and Definition-of-Ready guidance. The goal is not to impress the user with an assumed solution; the goal is to uncover the real business problem, decision owner, constraints, success criteria, and first safe scope.

The Discovery Gate output must be a chat response, not a plan file. It must contain:

1. **Known context:** what the user asked for and what the repo/code inspection confirms.
2. **Major unknowns:** missing decisions that affect scope, behavior, architecture, testing, risk, rollout, or user experience.
3. **Scenario options:** several plausible ways to solve the request, with concise tradeoffs. Include options such as backend-only, frontend-only, full-stack, MVP slice, migration-first, compatibility-preserving, or operationally safer rollout when relevant.
4. **Scope boundary question:** ask whether the first plan should cover backend, frontend, both, data migration, permissions, integrations, documentation, deployment, and QA.
5. **Edge-case prompts:** ask about negative paths, old data, permissions, tenant isolation, error states, concurrency, idempotency, audit, notifications, reports, exports, and rollback where relevant.
6. **Decision request:** ask the user to choose a scenario or combine scenarios before the Business Plan is written.

Use this client-interview question bank to choose relevant questions. Do not ask all questions mechanically; select questions that materially affect the Business Plan:

- **Business problem:** What problem are we solving, who has it, what fails today, what happens if we do nothing, and what is the success measure?
- **Current process:** How does the process work today step by step, who participates, where are manual workarounds, and what examples/screens/documents show the expected behavior?
- **Target users and roles:** Who will use it, who can view/create/edit/delete/approve, which roles or tenants are excluded, and who decides exceptions?
- **Scope:** Is the first release backend-only, frontend-only, full-stack, API contract only, migration-only, admin-only, selected tenants only, or a full production rollout?
- **Out of scope:** Which related workflows, roles, reports, notifications, exports, mobile behavior, integrations, or legacy data cases must not be included in this first plan?
- **Data:** What fields are required or optional, what examples are valid/invalid, what old data exists, what must be migrated, retained, archived, audited, imported, or exported?
- **Process states:** What statuses exist, what transitions are allowed, who can trigger them, can actions be repeated or reverted, and what happens during concurrent changes or interrupted flows?
- **UX and API behavior:** What should the user or API client see on success, empty state, validation error, permission denial, external failure, timeout, loading, retry, and long-running operations?
- **Integrations:** Which system is source of truth, is the integration sync/async/batch/event-based, what are timeouts/rate limits/retries, and are sandbox credentials/examples available?
- **Nonfunctional needs:** What response time, scale, idempotency, consistency, observability, audit, security, compliance, and cost constraints matter?
- **Rollout and support:** Feature flag, rollout per role/tenant/environment, rollback path, support instructions, customer communication, post-release metrics, and monitoring.
- **Acceptance and QA:** What scenarios prove the work is complete, including happy path, negative path, permission path, legacy data, integration failure, and regression checks?
- **Decision ownership:** Who approves ambiguous business rules, technical tradeoffs, rollout risk, and scope changes?

Do not continue to the Business Plan until the user answers the scenario and scope questions, or explicitly authorizes a specific default. If the user says "use your recommendation", state the recommended scenario and ask for confirmation before writing the plan when the choice changes product behavior, architecture, rollout, data, permissions, or UX.

Use internet research and current documentation only to improve the quality of scenario options and risk notes. Do not let a documentation result silently pick the implementation path. Present the relevant option and ask whether it matches the user's intent.

Good Discovery Gate shape:

```markdown
Before I write the Business Plan, I need to choose the right scope with you.

Known:
- <confirmed request/repo facts>

Possible scenarios:
1. <Scenario A> - <when it fits / tradeoff>
2. <Scenario B> - <when it fits / tradeoff>
3. <Scenario C> - <when it fits / tradeoff>

Questions:
1. Which scenario should be the first implementation scope?
2. Should this include backend, frontend, generated client/API contract, data migration, permissions, and QA?
3. What edge cases or negative paths must be covered?
```

Bad behavior:

- writing a Business Plan from a one-sentence request
- choosing a library, integration model, UX flow, auth rule, or rollout path only because internet search found a common approach
- hiding uncertainty in vague assumptions instead of asking the user
- asking generic checklist questions that do not affect the plan
- moving a blocking unknown into `Open Questions` and still asking for plan approval

### Technical Decision Gate

Run the Technical Decision Gate after the Business Plan is approved and before writing the Technical Plan when there is more than one viable implementation path.

The Technical Decision Gate output must be a chat response, not a plan file. It must contain:

1. **Approved business target:** the Business Plan path and the product scenario/scope the user approved.
2. **Repo constraints:** relevant architecture, existing patterns, framework/package versions, data model, deployment constraints, tests, and integration contracts found in the repo.
3. **Current technology context:** when framework, SDK, runtime, package, generated client, external API, language edition, database driver, or infrastructure tooling behavior matters, use `itsol-current-tech-context` to verify repo-pinned or current official documentation before proposing choices.
4. **Technical options:** two to four feasible approaches with tradeoffs. Compare implementation size, risk, compatibility, migration, testability, rollback, performance, security, data impact, and operational complexity.
5. **Recommendation:** one recommended approach with reasoning tied to the approved Business Plan, repo conventions, risk, and delivery size.
6. **Decision request:** ask the user to choose an option or approve the recommendation before writing the Technical Plan.

Ask technical-decision questions that materially affect implementation:

- Should we implement this as a vertical slice, backend-first, frontend-first, API-contract-first, feature-flagged rollout, migration-first, or compatibility-preserving adapter?
- Should the change reuse existing modules/components/contracts or introduce a new abstraction?
- Should existing data be migrated eagerly, lazily, backfilled by job, dual-written, or left read-compatible?
- Should API changes be breaking, additive, versioned, hidden behind feature flags, or exposed only to generated clients?
- Should validation live on backend only, frontend plus backend, schema/contracts, database constraints, or all relevant layers?
- Should permissions be centralized, checked per endpoint/action, modeled in policy objects, or inherited from existing ownership rules?
- Should long-running work be sync, async job, queue/event, scheduled task, streaming, or external integration callback?
- Should cache invalidation be targeted, broad, event-driven, time-based, or avoided by changing query shape?
- Should rollout be global, per environment, per tenant, per role, per user, or dark-launched?
- What rollback is acceptable: config flag, revert, data rollback, compatibility mode, or manual remediation?
- How strict should tests be: unit, contract, integration, e2e, snapshot/visual, migration test, load test, security test?
- Should implementation be delegated through subagents by UI/API/database/security/infra or done inline?

If the user asks for a recommendation, provide it, but still ask for approval before writing the Technical Plan when the choice changes architecture, API contracts, data, rollout, security, UX, or operational behavior.

Good Technical Decision Gate shape:

```markdown
Before I write the Technical Plan, we need to choose the implementation approach.

Approved business target:
- <Business Plan path and scope>

Technical options:
1. <Option A> - <tradeoffs>
2. <Option B> - <tradeoffs>
3. <Option C> - <tradeoffs>

Recommendation:
- <recommended option and why>

Questions:
1. Which technical option should the Technical Plan use?
2. Are there constraints on rollout, migration, compatibility, or testing that change this choice?
```

Bad behavior:

- writing the Technical Plan immediately after Business Plan approval when multiple technical approaches exist
- choosing the newest library, common pattern, or internet-found implementation without asking whether that path fits the user's constraints
- hiding a major technical choice as an implementation detail
- asking for Technical Plan approval while the selected architecture, migration path, API contract, or rollout strategy is still undecided

Before writing either plan:

1. Inspect relevant code, routes, API contracts, schemas, tests, configs, existing UI, and recent local conventions.
2. Ask follow-up questions only after that inspection, so questions are specific and not obvious.
3. For vague or short briefs, run the Discovery Gate first and get scenario/scope answers before drafting any plan file.
4. Continue interviewing until the Business Plan and Technical Plan can be written without placeholders, guesses, or vague requirements.
5. Prefer one focused question at a time after the initial scenario/scope discovery. If the runtime provides a dedicated user-question tool, use it; otherwise ask directly in chat.
6. Group related alternatives into clear choices when that helps the user answer, but ask open-ended questions when the domain requires nuance.
7. Stop asking only when remaining unknowns can be safely written as explicit assumptions or open questions in the plan file.

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
**Technical Approach:** <confirmed option or "Forced by existing architecture">
**Execution Mode:** Pending | Subagent-driven | Inline

## Implementation Goal
<One paragraph tying technical work to the Business Plan goal.>

## Repository Context
<Relevant frameworks, existing patterns, files inspected, and constraints.>

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
