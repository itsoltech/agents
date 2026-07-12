---
name: itsol-tdd-workflow
description: "TDD workflow: RED-GREEN-REFACTOR for features, bugfixes, refactors, migrations."
---

# ITSOL TDD Workflow

Use test-driven development as the default coding loop for behavior changes. Prove the test can fail before trusting the implementation. Respect `.itsol.md` repo policy when a legacy project cannot support TDD.

## Process

1. State the behavior or regression that must be proven.
2. If `.itsol.md` exists, load `itsol-repo-memory` and apply the matched project TDD mode and verification policy.
3. If TDD mode is `full` or supported, write the smallest automated test or diagnostic that captures that behavior.
4. Run the focused test and confirm RED: it fails for the expected reason.
5. Write the smallest production change that can make the test pass.
6. Run the focused test and confirm GREEN, then run the relevant wider verification.
7. Refactor only after GREEN, keeping tests green after each cleanup.
8. If TDD mode is `limited`, `not-supported`, or automation is not practical, do not scaffold a new test framework only to satisfy TDD. Record the exception and replacement verification before changing production code.


## Execution Policy

After resolving `itsol-workflow-mode`, load `itsol-execution-policy`, resolve the complete sibling execution state and observable `done_when`, and preserve both contracts through plans, task context, compaction, delegation, continuation, review, and handoff. Resource policy never changes workflow authority. Do not set `maxTurns`; do not accept agent termination or a `completed` label without validating evidence.

Read [references/guide.md](references/guide.md) before writing production code. If TDD is not practical, record the explicit exception and the alternative verification before implementing.
