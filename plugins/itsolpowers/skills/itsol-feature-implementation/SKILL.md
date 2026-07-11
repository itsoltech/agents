---
name: itsol-feature-implementation
description: "Mode-authorized ITSOL feature implementation: scoped changes, TDD, verification, handoff."
---
# ITSOL Feature Implementation

Validate authorization through `itsol-workflow-mode` before production changes and preserve all seven state fields.

## Authorization

- `governed`: require the specific Business and Technical Plans to be genuinely user-approved with `artifact_state: approved`; a `Draft` is not authorized.
- `autonomous-planned`: require reviewed plans with `artifact_state: ready-for-execution`; never reinterpret them as user-approved. A `Draft` is not authorized.
- `direct`: require `artifact_state: not-required`; do not require plan files, plan paths, approvals, Decision Gates, or execution-mode approval.

Reject incomplete, inconsistent, or restriction-conflicting state. Then apply `.itsol.md`, inspect existing patterns, identify permissions/data/contracts/cache/events/jobs/deployment impact, load `itsol-tdd-workflow`, produce RED or a documented replacement check, implement the smallest GREEN change, refactor only while green, verify, and finish with `itsol-self-review`. Use `itsol-subagent-workflow` when the validated `execution_mode` requires it.

Read [references/guide.md](references/guide.md) and only relevant sector references.
