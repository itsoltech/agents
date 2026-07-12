---
name: itsol-code-review-workflow
description: "ITSOL PR review workflow: coverage map, subagents, severity, risk, final verdict."
---

# ITSOL Code Review Workflow

Review the PR as a risk-control step: verify behavior, safety, tests, and maintainability before style preferences.

## Process

1. Read the story, acceptance criteria, tech notes, PR description, changed files, RED/GREEN evidence, tests, risks, migrations, config, and QA notes.
2. Build a review coverage map before reading deeply: functional scope, changed system surfaces, current technology documentation/version context, security/trust boundaries, data/storage, infrastructure/deployment, tests/TDD evidence, performance, observability, maintainability, and release/QA risk.
3. Check review priorities in order: scope and acceptance criteria, correctness, security, architecture, data, errors, TDD/test evidence, performance, observability, maintainability, then style.
4. Every code review must cover the relevant areas from the coverage map. For tiny single-surface diffs, an inline review is allowed only when the final response states why subagents were unnecessary and which areas were checked.
5. For large, cross-cutting, multi-surface, security-sensitive, data-sensitive, infrastructure/deployment, migration/rewrite, generated-client/API-contract, or hard-to-fit-in-one-context PRs, subagents are mandatory. Do not perform an inline-only review of one sector.
6. Delegate focused review subagents by changed surface and risk dimension, for example current technology context, UI/UX, security, infrastructure, frontend, backend, database, generated API clients, migration/rewrite, QA/release, performance, or test strategy. Use the narrowest ITSOL skill/subagent that matches each area.
7. For subagent-driven implementation reviews, use `itsol-subagent-workflow` as the canonical contract for task packets, write scope, statuses, response validation, unverified items, coverage gap handling, review-loop closure, and final integration checks.
8. Require each review subagent to return structured findings with severity, file references, affected behavior, evidence checked, missing verification, unverified items, assumptions, residual risk, and any coverage gap. Treat unsupported claims as unverified until checked against source, tests, logs, or command output.
9. Consolidate subagent findings into one final verdict: validate `completed`, `partial`, `blocked`, or `failed` statuses against the task packet, deduplicate, order by severity, keep evidence and file references, call out coverage gaps, and distinguish blockers from suggestions.
10. Label comments by intent: `Blocker`, `Should`, `Question`, `Suggestion`, `Nit`, or `Note`.
11. Stop review and request a technical discussion when scope, architecture, requirements, migration, rollout, PR size, unresolved `partial`, `blocked`, or `failed` status, or unreviewable coverage gap prevents reliable review.


## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
