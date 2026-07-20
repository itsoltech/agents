# Technical Fix Planning By Workflow Mode

Resolve all seven fields through `itsol-workflow-mode`. Always gather reproduction/log/test/data/config/API evidence, separate facts from hypotheses, establish root cause, and preserve TDD or replacement verification.

## Mode Flow And Fix Decision

- In `governed`, summarize evidence/root cause, present two to four repair options or the forced option, compare tradeoffs, recommend one, and wait for the user's choice. Create one `Draft`, self-review it proportionately, use isolated review only when required or worthwhile, resolve concrete material findings, present the specific file, obtain explicit approval, set `Approved`, then implement. The original request, `continue`, silence, or agent inference is not approval.
- In `autonomous-planned`, record the same options/tradeoffs, choose the documented recommendation, create a `Draft`, complete proportionate self-review and any applicable isolated review, resolve concrete material findings, set `Ready for execution`, and continue without approval pause. Never call it user-approved.
- In `direct`, do not create a Fix Plan or run Fix Decision, plan-review, approval, or plan-path gates. Use `artifact_state: not-required` and proceed from root cause to regression verification and the smallest fix.

Possible approaches include a minimal root-cause hotfix, compatibility handling for old data, bounded refactor, feature-flagged rollout, backend/frontend/full-stack slice, or diagnostic spike when root cause remains unconfirmed. Do not hide material decisions as implementation details.

## Plan Location

Default: `.itsol/plans/YYYY-MM-DD-<bug-slug>-fix.md`. Use another path only for an established repo convention or explicit request.

## Detailed Planned-Mode Template

```markdown
# <Bug or Symptom> Technical Fix Plan

**Status:** Draft
**Workflow Mode:** governed | autonomous-planned
**Mode Source:** explicit-user-task-instruction | repo-default | fallback-default
**Decision Authority:** user | delegated
**Scope:** current-task
**Artifact State:** draft | approved | ready-for-execution
**Execution Mode:** pending | inline | subagents | auto
**Protected Constraints:** []
**Authorization:** Pending explicit user approval | Delegated by user for current task
**Created:** YYYY-MM-DD
**Related issue/request:** <ticket or summary>

## Symptom
<Expected behavior, actual behavior, impact, affected users, severity, and environment.>

## Evidence
- <Reproduction command, failing test, logs/traces, screenshot, data sample, API response, config or deployment evidence>

## Suspected Or Confirmed Root Cause
<Label confirmed versus suspected and cite exact files, functions, queries, configs, contracts, or runtime behavior.>

## Scope
### In Scope
- <Smallest coherent root-cause fix>
### Out Of Scope
- <Explicit exclusions and follow-up bugs>

## Required ITSOL Skills
| Skill | Use During | Reason |
| --- | --- | --- |
| `itsol-bug-debugging` | whole fix | evidence-first workflow |
| `itsol-workflow-mode` | authorization | validate artifact state |
| `itsol-repo-memory` | planning/implementation | apply TDD and verification policy |
| `itsol-tdd-workflow` | before production changes | regression RED gate |
| `<focused-domain-skill>` | implementation/review | affected surface |

## Files And Ownership
| Path | Action | Owner | Purpose |
| --- | --- | --- | --- |
| `path/to/file` | Create/Modify/Test | main/subagent | reason |

## Fix Decision And Strategy
- <Options, tradeoffs, selected/recommended approach>
- `if <condition>` then <behavior>; else <behavior>
- <validation, authorization/tenant, error, retry, idempotency, concurrency, and compatibility rules>

## TDD Regression Plan
**TDD Mode:** full | limited | not-supported | not-applicable | unknown
**Policy Source:** <project/root/none>
### RED
- <Failing test or diagnostic and expected failure>
### GREEN
- <Minimal root-cause change expected to pass>
### REFACTOR
- <Cleanup allowed while checks remain green>
<For limited/non-supported/not-applicable, explain exception, replacement checks, and residual risk; do not scaffold a framework solely for TDD.>

## Verification Plan
- <Focused command and expected result>
- <Manual failing-path smoke scenario>
- <Related-path and compatibility regression checks>

## Risk And Rollback
- <Regression/data/deployment risk, rollback or roll-forward mitigation, monitoring>

## Open Questions
- None | <material question>
```

## Bug Plan Self-Review

Check for placeholders/empty sections; concrete expected/actual/impact/environment; evidence-backed or honestly suspected root cause; one coherent bug; complete focused skills; exact ownership; executable RED or documented exception; smallest root-cause strategy; explicit branches and security/data behavior; verification of failing and related paths; and credible risks/rollback. Resolve material gaps before readiness or approval.

## Rubber Duck Review Questions And Report

The read-only `itsol-self-review` reviewer should ask:

- Does evidence reproduce the symptom and support the stated root cause?
- Which alternative layer or hypothesis remains untested?
- Is the strategy the smallest root-cause fix, and what regression could it introduce?
- Which old-data, permission/tenant, concurrency, retry, compatibility, or failure path is missing?
- Is RED/GREEN executable, or is the replacement verification sufficient?
- Which file, skill, related path, rollback, monitoring, or deployment concern is absent?
- Does status/authorization honestly match the selected mode?

Return inspected plan/context; blockers; important gaps; non-blocking suggestions; questions; sections to update; verification gaps; and `ready for approval`/`not ready for approval` in `governed`, or `ready for execution`/`not ready for execution` in `autonomous-planned`. Material findings block both. `direct` skips this plan review.
