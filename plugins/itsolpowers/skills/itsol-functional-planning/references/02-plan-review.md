# Plan Review

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
- Repo Memory context is present when `.itsol.md` exists or the task touches monorepo projects with different testing/verification policies
- Current Tech Context is present when the plan depends on frameworks, SDKs, runtimes, package managers, libraries, generated clients, external APIs, language editions, or infrastructure tooling
- logical branches include important `if`/else behavior, validation, authorization, tenant isolation, error handling, idempotency, retries, and compatibility where relevant
- TDD plan has a concrete RED test or diagnostic, expected failure, GREEN scope, and refactor checkpoint, or a repo-policy TDD exception with replacement verification
- each task has files, required skills, steps, verification, and an Angular commit message
- subagent split and concurrency limit are present when subagent-driven execution is plausible
- verification commands are concrete and scoped
- rollout, rollback, monitoring, and data migration notes are covered or explicitly not applicable with reason
- no task depends on undefined types, functions, external services, or assumptions hidden outside the plan

If self-review finds unresolved items that materially affect scope or implementation, ask targeted follow-up questions before requesting approval. If an item is intentionally deferred, document it in out-of-scope or follow-up scope.

## Rubber Duck Plan Review

After Plan Self-Review and before asking the user to approve either plan, run a mandatory Rubber Duck Plan Review through a separate subagent. Use the `itsolpowers:itsol-self-review` subagent when Claude Code subagents are available. In Codex, use a forked-context subagent without an explicit `agent_type`, and pass `itsol-self-review` as the required ITSOL skill/instruction. Tell the reviewer that it is already the delegated subagent and must not spawn another subagent, run `codex exec`, run `claude`, or invoke another agent CLI. If subagent tooling is unavailable, do not silently skip the gate; state that Rubber Duck Review cannot be completed and ask how to proceed.

The Rubber Duck reviewer is read-only. It must not edit the plan. Its job is to act like a critical teammate who always looks for holes in the plan. Give it the plan file path, the related user request, the approved scope or technical approach, and only the minimal repo context needed to verify claims.

The main agent remains responsible for the plan. It must resolve the subagent report by updating the plan, asking the user targeted questions, or documenting a deliberately deferred item. Do not ask for approval while a material Rubber Duck finding remains unresolved. Repeat the Rubber Duck Review if the fix materially changes scope, acceptance criteria, architecture, data, rollout, or verification.

### Business Plan Rubber Duck Questions

The subagent must challenge the Business Plan with questions like:

- What important user, role, tenant, or decision owner is missing?
- Which acceptance criterion is too vague for QA to verify?
- Which edge case, negative path, permission path, or legacy-data case is not covered?
- Which assumption changes business behavior and should have been confirmed with the user?
- Is the scope small enough for one coherent first delivery?
- What is claimed as out of scope but still leaks into acceptance criteria, QA, rollout, or support?
- Which UX/API behavior, copy, error state, audit need, report, export, notification, or customer communication is underspecified?
- What could make the client reject this implementation even if the code matches the plan?

### Technical Plan Rubber Duck Questions

The subagent must challenge the Technical Plan with questions like:

- Which selected technical approach is unapproved, weakly justified, or inconsistent with the Business Plan?
- Which file, module, endpoint, component, schema, migration, generated client, job, cache, event, config, or deployment surface is missing?
- Which `if`/else branch, validation rule, authorization rule, tenant boundary, idempotency rule, retry path, compatibility rule, or error path is underspecified?
- Which required ITSOL skill or focused review area is missing?
- Where is Current Tech Context required but absent?
- Which RED/GREEN/TDD step is too vague to execute?
- Which verification command, manual QA scenario, migration check, rollback path, monitoring step, or release order is missing?
- What could fail in production even if every listed task is implemented?

### Rubber Duck Report Contract

The subagent must return:

1. Plan inspected and related context used.
2. Critical findings grouped as blockers, important gaps, and non-blocking suggestions.
3. Questions the main agent must ask the user before approval.
4. Plan sections that need updates.
5. A clear verdict: `ready for approval` or `not ready for approval`.

Only a `ready for approval` verdict with no material blockers lets the main agent request user approval. Non-blocking suggestions may be deferred only when the plan explicitly documents why they are out of scope.
