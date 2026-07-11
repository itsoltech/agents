---
name: itsol-subagent-workflow
description: "Mode-authorized subagent execution: task split, ownership, reviews, verification, optional commits."
---
# ITSOL Subagent Workflow

Validate authorization through `itsol-workflow-mode` before delegation. Every task packet must contain `workflow_mode`, `mode_source`, `decision_authority`, `scope`, `artifact_state`, `execution_mode`, and `protected_constraints`; incomplete, inconsistent, or restriction-conflicting state returns `blocked`.

Accept `approved` only for genuinely approved `governed` artifacts, `ready-for-execution` for reviewed `autonomous-planned` artifacts, and `not-required` for `direct`. A `Draft` never authorizes execution. Direct mode requires no plan files or paths.

Build a dependency-aware task graph, set a concurrency limit, give bounded read/write scope, enforce one writer per file/shared contract, require TDD or documented replacement verification, validate every response, and use independent review for changed surfaces. Preserve `partial`, `blocked`, `failed`, unverified, and coverage-gap results. Keep integration and final validation with the main agent.

Only the main agent delegates. Delegated agents must not spawn agents or invoke external agent CLIs. Commit only when separately authorized, using Angular convention and one coherent verified slice; otherwise leave changes uncommitted.

Read [references/guide.md](references/guide.md) and the focused delegation/review references before delegating.
