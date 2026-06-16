# Review Commit And Validation

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
