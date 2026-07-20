---
name: itsol-code-review-workflow
description: "ITSOL PR review workflow: coverage map, subagents, severity, risk, final verdict."
---

# ITSOL Code Review Workflow

Review the PR as a risk-control step: verify behavior, safety, tests, and maintainability before style preferences.

## Extension-managed review policy

When the Pi extension exposes an effective review profile, treat it as the controlling contract:

- `off`: do not add review ceremony unless the user explicitly requests a review.
- `poc`: perform at most one lightweight final inline review; do not delegate or automatically re-review.
- `balanced`: let the main agent decide whether formal review is worth its cost, then use one proportionate inline or specialist pass; do not automatically re-review by default.
- `strict`: require risk-based independent coverage and re-review after actual fixes until approved or the configured cap is reached.

`trigger=manual` means review runs only on explicit request; `trigger=adaptive` delegates the run/skip and depth decision to the main agent; `trigger=final` means once before completion, not after each edit. `delegation=never` authorizes inline review even for surfaces that would normally require specialists. Automatic re-review requires a prior material `changes-requested` verdict, a changed diff fingerprint, and an available round. Never silently exceed `max_rounds` or `execution.max_review_rounds`.

## Process

1. Read the story, acceptance criteria, tech notes, PR description, changed files, RED/GREEN evidence, tests, risks, migrations, config, and QA notes.
2. If `trigger=adaptive`, first decide whether formal review adds enough value. Consider scale, novelty, uncertainty, blast radius, trust/data boundaries, reversibility, and strength of tests/verification. Skip formal review for small, conventional, low-risk, well-verified changes and record that judgment briefly.
3. When reviewing, build only the relevant coverage map: functional scope, changed surfaces, security/trust boundaries, data/storage, infrastructure/deployment, tests, performance, observability, maintainability, and release/QA risk. Do not expand into untouched areas.
4. Check priorities in order: acceptance criteria and correctness, security/data safety, compatibility and operations, test evidence, then maintainability. Style is non-blocking unless it violates an enforced repository rule or obscures a real defect.
5. Choose inline or specialist review proportionally. Use specialists when independent expertise has clear value—typically material security/data/infra risk, broad cross-cutting behavior, or a diff too large for reliable context—not merely because a filename matched a category.
6. Delegate focused review subagents by changed surface and risk dimension, for example current technology context, UI/UX, security, infrastructure, frontend, backend, database, generated API clients, migration/rewrite, QA/release, performance, or test strategy. Use the narrowest ITSOL skill/subagent that matches each area.
7. For subagent-driven implementation reviews, use `itsol-subagent-workflow` as the canonical contract for task packets, write scope, statuses, response validation, unverified items, coverage gap handling, review-loop closure, and final integration checks.
8. Require each review subagent to return a single consolidated, evidence-based pass with severity, file references, affected behavior, meaningful missing verification, assumptions, and residual risk. Unsupported claims are unverified, not blockers.
9. Consolidate findings, remove duplicates, and challenge false positives. A blocking finding needs a plausible failure path and concrete impact introduced by the change. Do not block on personal preferences, optional refactors, hypothetical edge cases without evidence, unrelated legacy debt, or missing tests that do not protect changed behavior.
10. Label comments by intent: `Blocker`, `Should`, `Question`, `Suggestion`, `Nit`, or `Note`. Only `Blocker` or critical/high-severity concrete defects require changes; suggestions and nits never trigger re-review.
11. Stop and request technical discussion only when a material scope, architecture, requirement, migration, rollout, or evidence gap prevents a reliable safety/correctness judgment.


## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
