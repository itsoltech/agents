---
name: itsol-tdd-workflow
description: Use before writing production code for ITSOL feature implementation, bugfixes, behavior changes, or refactors when the agent needs to follow test-driven development with red-green-refactor.
---

# ITSOL TDD Workflow

Use test-driven development as the default coding loop for behavior changes. Prove the test can fail before trusting the implementation.

## Process

1. State the behavior or regression that must be proven.
2. Write the smallest automated test or diagnostic that captures that behavior.
3. Run the focused test and confirm RED: it fails for the expected reason.
4. Write the smallest production change that can make the test pass.
5. Run the focused test and confirm GREEN, then run the relevant wider verification.
6. Refactor only after GREEN, keeping tests green after each cleanup.

Read [references/guide.md](references/guide.md) before writing production code. If TDD is not practical, record the explicit exception and the alternative verification before implementing.
