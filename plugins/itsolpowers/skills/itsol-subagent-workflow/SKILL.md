---
name: itsol-subagent-workflow
description: "Mode-authorized subagent execution: task split, ownership, reviews, verification, optional commits."
---
# ITSOL Subagent Workflow

Validate authorization through `itsol-workflow-mode` before delegation. Every task packet must contain `workflow_mode`, `mode_source`, `decision_authority`, `scope`, `artifact_state`, `execution_mode`, and `protected_constraints`; incomplete, inconsistent, or restriction-conflicting state returns `blocked`.

Then validate `itsol-execution-policy`. Every packet carries the complete execution state, observable `done_when`, a resolved child `stop_after` no later than the parent, remaining distinct-agent/parallel/review ceilings, and escalation behavior. Missing, expanded, or restriction-conflicting execution state returns `blocked`.

Accept `approved` only for genuinely approved `governed` artifacts, `ready-for-execution` for reviewed `autonomous-planned` artifacts, and `not-required` for `direct`. A `Draft` never authorizes execution. Direct mode requires no plan files or paths.

Build a dependency-aware task graph, set a concurrency limit, give bounded read/write scope, enforce one writer per file/shared contract, require TDD or documented replacement verification, validate every response, and use independent review for changed surfaces. Preserve `partial`, `blocked`, `failed`, unverified, and coverage-gap results. Keep integration and final validation with the main agent.

Only the main agent delegates. Delegated agents must not spawn agents or invoke external agent CLIs. Never set `maxTurns`. A child response must use `completed`, `partial`, `blocked`, or `failed`, but the main agent accepts `completed` only after validating packet evidence and every `done_when` criterion. Commit only when separately authorized, using Angular convention and one coherent verified slice; otherwise leave changes uncommitted.


## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

Read [references/guide.md](references/guide.md) and the focused delegation/review references before delegating.
