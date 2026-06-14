# ITSOL TDD Workflow Reference

Use this reference for feature work, bugfixes, behavior changes, and refactors that touch production code.

## Default Rule

Do not write production code for a behavior change until there is a focused failing test or diagnostic that proves the desired behavior is currently missing or broken.

Allowed exceptions:

- throwaway prototype
- generated code
- pure configuration or documentation
- legacy code where a safe automated test is not practical yet

For any exception, write down the reason and the replacement verification before changing production code.

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
