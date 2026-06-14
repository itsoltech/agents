# ITSOL Subagent Workflow Reference

Use this reference to execute approved work with multiple agents without losing integration control.

## Preconditions

Do not start subagent execution until all are true:

- the Business Plan is approved
- the Technical Plan is approved
- the user chose subagent-driven execution
- the main agent understands the current git state and existing user changes

If any condition is missing, stop and ask for the missing approval or execution decision.

## Task Split

Split the Technical Plan into task slices that can be owned independently:

- one UI flow, route, component group, or form path
- one API endpoint, service, handler, or validation path
- one data model, migration, query, repository, or cache path
- one integration, job, generated-client, or infrastructure path
- one focused test or diagnostic slice when it unblocks implementation

Each task must include:

- goal and acceptance criteria
- files or bounded areas the subagent may edit
- files or areas the subagent must not touch
- required ITSOL skills to load
- RED/GREEN expectation from `itsol-tdd-workflow` when code changes
- verification command or evidence expected from the subagent
- output contract: changed files, behavior, tests, risks, and next review target

Keep integration decisions, shared contracts, cross-task conflict resolution, and final validation in the main agent.

## Parallelism

Before launching implementation subagents, set a concurrency limit.

Use this decision rule:

- 1 concurrent task for high-conflict files, migrations, shared contracts, auth, security-sensitive behavior, or unclear requirements
- 2 concurrent tasks for moderate changes with separate file ownership but shared integration points
- 3 concurrent tasks for clearly independent UI/API/database/infrastructure surfaces
- more than 3 only when the user explicitly approves and the repository surfaces are strongly independent

State the proposed limit to the user or apply the limit already approved in the Technical Plan. Do not exceed the agreed limit. When a task finishes, start the next queued task only if doing so will not conflict with active work.

## Implementation Delegation

For each implementation subagent:

- use the matching ITSOL skill subagent when available
- give a narrow task, owned files, and forbidden areas
- tell it to follow TDD for code changes
- require it to preserve unrelated user changes
- require it to report verification evidence
- prohibit broad refactors not present in the approved Technical Plan

The main agent must not delegate the current blocker, approval decisions, or final integration responsibility.

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

The review subagent returns findings by severity with file references, required fixes, and missing verification. The main agent decides whether findings are valid, assigns fixes, and repeats implementation plus review until:

- no blocking or high-severity findings remain
- all agreed medium/low findings are fixed, deferred with reason, or converted into follow-up tasks
- verification evidence is sufficient for the task slice

Do not let the same subagent both implement and approve its own work.

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
4. Run a quick diff review for accidental scope, unrelated edits, debug logs, missing tests, and generated-file drift.
5. Run the relevant review or self-review skills for the whole integrated change when risk warrants it.

## User Summary

Finish with:

- what was implemented
- which subagents or review areas were used
- commits created
- verification performed
- any deferred findings, risks, or missing tests
- a direct question about the next step
