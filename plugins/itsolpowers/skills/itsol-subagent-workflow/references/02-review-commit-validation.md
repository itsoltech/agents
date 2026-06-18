# Review Commit And Validation

Use this reference after a delegated task returns, during the independent review loop, before per-task commits, and during final integration validation.

## Response Validation

Before accepting a subagent result, compare it against the original task packet and the full response contract in [01-planning-and-delegation.md](01-planning-and-delegation.md#response-contract).

Reject, repair, or mark unverified any response that lacks:

- status: `completed`, `partial`, `blocked`, or `failed`
- task id and task name
- changed files for write tasks, or inspected scope for read-only tasks
- evidence for key claims
- verification command output summary or replacement evidence
- RED/GREEN evidence for code changes, or documented TDD exception and replacement verification
- unverified items and coverage gaps
- assumptions and risks
- blockers or next decisions when status is `partial`, `blocked`, or `failed`
- recommended next review target when implementation changed files

Status handling:

- `completed`: accept only when scope, verification, and response contract are satisfied.
- `partial`: record what is verified, what is unverified, and whether to create another task, revise the packet, ask the user, or stop.
- `blocked`: identify the missing context, decision, dependency, permission, or conflict; the main agent must resolve or stop rather than letting the subagent widen scope.
- `failed`: inspect whether any artifacts are salvageable, then rerun with a narrower packet, switch to inline work, or escalate.

Unsupported claims must be checked against source files, command output, tests, or other deterministic evidence. If they cannot be checked, label them unverified and do not use them as the basis for final confidence.

## Review Loop

After each implementation subagent reports completion, run review before accepting the task slice.

Choose a different review subagent from the implementer. Pick review coverage based on changed area:

- workflow or scope: `itsol-code-review-workflow`
- self-review/readiness: `itsol-self-review`
- security-sensitive area: the narrowest `security-*` skill
- infrastructure/deployment: the narrowest `infra-*` skill
- Svelte or SvelteKit: `svelte-review`
- TanStack Query: `tanstack-query-svelte-review`
- OpenAPI/client generation: `hey-api-openapi-review`
- .NET API: `dotnet-web-api-review`
- Effect TypeScript: `effect-typescript-review`
- Rust: `rust-review`
- Rust ML/LLM: `rust-ml-llm-review`
- PostgreSQL: `postgres-review`
- MongoDB: `mongodb-review`

The review subagent returns findings by severity with file references, affected behavior, required fixes, missing verification, unverified areas, and coverage gaps. The main agent decides whether findings are valid, assigns fixes, and repeats implementation plus review until:

- no blocking or high-severity findings remain
- all agreed medium/low findings are fixed, deferred with reason, or converted into follow-up tasks
- verification evidence is sufficient for the task slice
- `partial` or `blocked` review results are resolved, narrowed, or explicitly carried as risk

Do not let the same subagent both implement and approve its own work.

## Semantic Conflict Checks

A clean git merge is not enough. The main agent must check for semantic conflict after each reviewed slice and again before final handoff.

Look for conflicts in:

- APIs, generated clients, schemas, migrations, repositories, and fixtures
- auth, permissions, tenancy, privacy, rate limits, and security posture
- environment variables, feature flags, deployment config, and rollout assumptions
- UI labels, routes, navigation, form contracts, loading/error states, and accessibility expectations
- prompts, skill contracts, agent instructions, task packet wording, and response contract wording
- tests, test data, snapshots, generated files, and documentation examples

If two subagents disagree, or two slices make incompatible assumptions, resolve through source inspection, focused tests, deterministic commands, or user escalation. Do not average opinions or treat subagent agreement as proof.

## Per-Task Commit

After a task slice is implemented, independently reviewed, verified, and integrated, create a focused commit when repository policy and user approval allow committing.

Before committing:

- inspect `git status --short`
- stage only files belonging to the completed task slice
- exclude unrelated user changes and untracked files outside the slice
- run the task's focused verification, or document why it cannot run

Use Angular commit convention:

- `feat(scope): add customer export filter`
- `fix(scope): handle missing tenant permission`
- `test(scope): cover stale query invalidation`
- `refactor(scope): isolate webhook validation`

If the working tree contains unrelated changes that make a focused commit unsafe, stop and ask the user how to proceed.

## Final Validation

After all task slices are done:

1. Run the full planned verification or the closest feasible subset.
2. Compare implemented behavior against the approved Business Plan.
3. Compare touched files, branches, tests, and verification against the approved Technical Plan.
4. Confirm every task is `completed`, or that every `partial`, `blocked`, `failed`, or `deferred` item is documented with owner, reason, risk, and next step.
5. Validate that one writer owned each changed file or shared semantic contract at the time of edit.
6. Run a quick diff review for accidental scope, unrelated edits, debug logs, missing tests, generated-file drift, stale comments, and source-document path leakage.
7. Check for semantic conflicts across independently completed slices.
8. Run the relevant review or self-review skills for the whole integrated change when risk warrants it.

The main agent owns final validation. A subagent's `completed` status is input evidence, not final acceptance of the integrated work.

## User Summary

Finish with:

- what was implemented
- which subagents or review areas were used
- commits created
- verification performed
- task statuses, including any `partial`, `blocked`, `failed`, or `deferred` items
- any deferred findings, risks, missing tests, unverified items, or coverage gaps
- semantic conflicts checked or resolved
- a direct question about the next step
