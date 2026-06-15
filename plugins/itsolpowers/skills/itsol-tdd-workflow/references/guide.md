# ITSOL TDD Workflow Reference

Use this reference for feature work, bugfixes, behavior changes, and refactors that touch production code.

## Default Rule

Do not write production code for a behavior change until there is a focused failing test or diagnostic that proves the desired behavior is currently missing or broken.

Before deciding what test to write, read `.itsol.md` through `itsol-repo-memory` when it exists. In monorepos, apply the most specific project policy for the touched paths.

Allowed exceptions:

- throwaway prototype
- generated code
- pure configuration or documentation
- legacy code where a safe automated test is not practical yet
- `.itsol.md` marks the touched project as `limited`, `not-supported`, or `not-applicable` for TDD

For any exception, write down the reason and the replacement verification before changing production code.

Do not introduce or scaffold a new test framework in a legacy project only to satisfy the TDD workflow unless the user explicitly approves that setup work or the approved Technical Plan includes it.

## Repo Policy Modes

- `full`: follow RED-GREEN-REFACTOR with automated tests.
- `limited`: use existing supported tests where they fit; otherwise document a TDD exception and run listed replacement verification.
- `not-supported`: skip test-framework setup, document the exception, and run listed replacement verification.
- `not-applicable`: use verification appropriate to generated code, docs, config, infrastructure, or other non-TDD surfaces.
- `unknown`: inspect local configs and ask or propose a small discovery step before assuming test support.

## Red-Green-Refactor

RED:

- Write one minimal test for one behavior.
- Prefer the lowest reliable level: domain/unit first, then integration or UI when the boundary matters.
- Run the focused test and confirm it fails for the expected reason.
- If it passes immediately, the test does not prove the change.
- If it errors because of setup, fix the test until it fails for the behavior.

GREEN:

- Implement only enough production code to pass the failing test.
- Do not add speculative abstractions, extra options, or unrelated cleanup.
- Run the focused test again and confirm it passes.
- Run nearby tests or the relevant package/test target before moving on.

REFACTOR:

- Clean names, duplication, structure, and seams only after GREEN.
- Keep behavior unchanged.
- Re-run the focused test after each meaningful cleanup.

## Good Test Shape

A good TDD test:

- names the behavior in business or user terms
- exercises real code whenever possible
- checks externally visible behavior, not incidental implementation details
- fails before the implementation
- is deterministic and can be run by the next developer

Avoid tests that only prove mocks were called, mirror implementation details, or combine several behaviors in one assertion block.

## Bugfixes

For bugs, the RED test should reproduce the reported failure or the smallest root-cause condition. The test should fail on the old code and pass only after the root-cause fix.

If the bug cannot be reproduced in an automated test, create a minimal diagnostic, script, fixture, log assertion, or documented manual reproduction and explain why automation is not practical.

## Reporting

When handing off work, include:

- RED command and observed failure
- GREEN command and passing result
- wider verification command
- any TDD exception and the replacement verification
