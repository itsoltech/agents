---
name: itsol-self-review
description: "Self-review before handoff: plans, tests, edge cases, security, UX, risks."
---

# ITSOL Self Review

Resolve and validate artifact authorization through `itsol-workflow-mode`. Preserve all seven workflow-state fields in review handoffs.

Run a concise final self-review before saying work is complete. Use isolated Rubber Duck review for Business and Technical Plans only when required by policy or when the main agent judges it proportionate to scale, uncertainty, novelty, and material risk.

## Process

1. Re-read the artifact under review: plan file, diff, PR, patch, migration, deployment config, or generated artifact.
2. If `.itsol.md` exists, load `itsol-repo-memory` and check whether the artifact respects matched project policy.
3. For plans, act as a pragmatic teammate: challenge only omissions that could materially change scope, acceptance, correctness, safety, feasibility, rollout, or verification. Do not demand exhaustive detail for a small conventional task.
4. In `governed`, treat `Approved` without evidence that the user saw and explicitly approved that specific plan as a blocker. In `autonomous-planned`, accept a material-blocker-free `Ready for execution` artifact with delegated authorization and reject any false user-approval claim. In `direct`, accept `not-required` without plan paths and review the implementation evidence instead.
5. For Technical Plans with `Execution Mode: Subagent-driven`, verify the `Subagent Plan` reinforces `itsol-subagent-workflow` as the canonical contract and names task packets, write scope, concurrency, review split, response evidence, `partial`/`blocked` handling, unverified items, coverage gaps, and conflict handling.
6. For code changes, check requirements, edge cases, permissions, validation, data consistency, errors, logs, rollout risk, and invalid scope expansion beyond approved plans or task packet write scope.
7. Confirm RED/GREEN evidence for code changes, or explain why a TDD test was not practical and what replaced it. If `.itsol.md` says TDD is limited or not supported, verify the required replacement checks were performed.
8. For subagent-driven work, validate task results against the canonical response contract before handoff: status, changed files or inspected scope, evidence, assumptions, unverified items, coverage gap notes, risks, blockers, and next review target when files changed.
9. Load focused domain review skills only when the touched risk justifies their cost; do not fan out by default.
10. Report blockers, important gaps, optional suggestions, verification commands, `partial`, `blocked`, or `failed` items, meaningful unverified items, coverage gaps, and remaining risks. A blocker requires concrete impact and a plausible failure path introduced by the task.

## Rubber Duck Plan Review

When reviewing a Business Plan or Technical Plan, do not edit the file. Keep the review proportional and return one consolidated report with:

1. Plan inspected and related context used.
2. Blockers that make the plan not ready for approval.
3. Invalid approval status, important gaps, hidden assumptions, weak acceptance criteria, missing technical decisions, or missing verification.
4. For Technical Plans, whether the `Subagent Plan` is executable without guessing and aligns with the canonical `itsol-subagent-workflow` task packet, write scope, response contract, and `partial`/`blocked` handling.
5. Questions the main agent must ask the user before approval.
6. Plan sections that need updates.
7. Verdict by `itsol-workflow-mode`: governed `ready for approval`/`not ready for approval`; autonomous-planned `ready for execution`/`not ready for execution`; direct has no plan-review verdict.

Use a not-ready verdict only for a concrete material defect that could plausibly lead to wrong, unsafe, infeasible, or unverifiable implementation. Style, wording, optional detail, speculative edge cases, personal preferences, and out-of-scope improvements are non-blocking and must not cause another round.


## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.

## Proportionate Independent Review

For large or materially risky pull requests, consider focused subagents when independent expertise is likely to improve the verdict. Size alone is not enough: weigh cross-cutting behavior, security/data/infra blast radius, novelty, reversibility, and whether one context can review the diff reliably. Small or conventional changes should remain inline.

When subagents add value, split only by independent material surfaces such as UI, API, database, infrastructure, or security. Each returns concrete findings with file references, severity, affected behavior, and meaningful missing verification. The main agent removes duplicates and false positives, resolves conflicts, and owns the pragmatic final verdict.

For subagent-driven implementation reviews, reuse the canonical `itsol-subagent-workflow` response validation rules. Preserve genuine `partial`, `blocked`, `failed`, unverified, or coverage-gap items, but do not promote harmless uncertainty or optional improvements into blockers.
