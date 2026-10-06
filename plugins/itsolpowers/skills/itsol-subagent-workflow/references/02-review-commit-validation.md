# Review Commit And Validation

Validate task authorization and all seven fields through `itsol-workflow-mode`; direct execution does not require plan files, and autonomous `Ready for execution` is not user approval.

Validate the sibling state through `itsol-execution-policy`, including remaining review-cycle capacity and the `implementation-reviewed` or earlier stop. One review cycle contains one full report and at most one targeted same-reviewer verification of its fixes; it is not an unlimited review loop.

Use this reference after a delegated task returns, during the independent review loop, before per-task commits, and during final integration validation.

## Response Validation

Before accepting a subagent result, compare it against the original task packet and the full response contract in [01-planning-and-delegation.md](01-planning-and-delegation.md#response-contract).

Reject, repair, or mark unverified any response that lacks:

- status: `completed`, `partial`, `blocked`, or `failed`
- task id and task name
- changed files for write tasks, or inspected scope for read-only tasks
- evidence for key claims
- verification command output summary or replacement evidence
- meaningful verification of changed behavior; RED/GREEN evidence only when TDD was explicitly requested
- unverified items and coverage gaps
- assumptions and risks
- blockers or next decisions when status is `partial`, `blocked`, or `failed`
- recommended next review target when further review is required or selected

Status handling:

- `completed`: accept only when scope, verification, and response contract are satisfied.
- `partial`: record what is verified, what is unverified, and whether to create another task, revise the packet, ask the user, or stop.
- `blocked`: identify the missing context, decision, dependency, permission, or conflict; the main agent must resolve or stop rather than letting the subagent widen scope.
- `failed`: inspect whether any artifacts are salvageable, then rerun with a narrower packet, switch to inline work, or escalate.

Do not accept a status solely because an agent stopped or a hook allowed termination. Check `done_when`, verification, and unverified gaps. Never introduce `maxTurns` to bound the review loop.

Unsupported claims must be checked against source files, command output, tests, or other deterministic evidence. If they cannot be checked, label them unverified and do not use them as the basis for final confidence.

## Review Loop

After an implementation subagent returns, validate its packet evidence. Apply the effective `itsol-code-review-workflow` policy: independent review runs only when required by policy, explicitly requested, or justified by material risk. With an adaptive trigger, the main agent may review inline or skip formal review with a brief reason. Do not create a reviewer solely because the implementer was a subagent.

When independent review is selected, choose a different review subagent from the implementer. Pick only relevant coverage based on changed area:

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

The selected reviewer returns findings by severity with file references, affected behavior, required fixes, missing verification, unverified areas, and coverage gaps. The main agent validates findings and assigns concrete material fixes to the original writer. Automatic rereview requires a prior material `changes-requested` verdict, a changed diff fingerprint, and remaining capacity under both review and execution policy. Suggestions and nits do not start another round. Accept the slice when:

- no blocking or high-severity findings remain
- all agreed medium/low findings are fixed, deferred with reason, or converted into follow-up tasks
- verification evidence is sufficient for the task slice
- `partial` or `blocked` review results are resolved, narrowed, or explicitly carried as risk

Do not let the same subagent both implement and provide independent approval of its own work. If a required review cannot run within the resolved policy, preserve an incomplete status instead of adding rounds or weakening the requirement.

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

After a task slice is implemented, verified, integrated, and any required or selected review is satisfied, create a focused commit only when separately authorized.

Before committing:

- inspect `git status --short`
- stage only files belonging to the completed task slice
- exclude unrelated user changes and untracked files outside the slice
- confirm current focused verification evidence; rerun only if the slice changed, a failure or unresolved concern remains, or policy requires it

Use Angular commit convention:

- `feat(scope): add customer export filter`
- `fix(scope): handle missing tenant permission`
- `test(scope): cover stale query invalidation`
- `refactor(scope): isolate webhook validation`

If the working tree contains unrelated changes that make a focused commit unsafe, stop and ask the user how to proceed.

## Final Validation

After all task slices are done:

1. Check the required verification evidence and run only missing, stale, or unresolved permitted checks. Report required checks that cannot run.
2. Compare implemented behavior against the mode-valid source of truth: `Approved`, `Ready for execution`, or the direct user request when artifacts are `not-required`.
3. Compare touched files, branches, tests, and verification against the same mode-valid source of truth.
4. Confirm every task is `completed`, or that every `partial`, `blocked`, `failed`, or `deferred` item is documented with owner, reason, risk, and next step.
5. Validate that one writer owned each changed file or shared semantic contract at the time of edit.
6. Run a quick diff review for accidental scope, unrelated edits, debug logs, missing tests, generated-file drift, stale comments, and source-document path leakage.
7. Check for semantic conflicts across independently completed slices.
8. Run the relevant review or self-review skills for the whole integrated change when risk warrants it.

The main agent owns final validation. A subagent's `completed` status is input evidence, not final acceptance of the integrated work.

## User Summary

Follow the router's user communication defaults. Include relevant outcomes and evidence:

- what was implemented
- which subagents or review areas were used
- commits created
- verification performed
- task statuses, including any `partial`, `blocked`, `failed`, or `deferred` items
- any deferred findings, risks, missing tests, unverified items, or coverage gaps
- semantic conflicts checked or resolved
- a targeted question only when a material decision or missing authority blocks the remaining work
