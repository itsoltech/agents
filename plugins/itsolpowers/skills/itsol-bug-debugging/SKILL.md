---
name: itsol-bug-debugging
description: "ITSOL bugfix workflow: evidence, root cause, Technical Fix Plan approval, tests."
---

# ITSOL Bug Debugging

Do not guess fixes. Reproduce or gather evidence, isolate the failing layer, write and approve one Technical Fix Plan, then patch the root cause.

## Process

1. State expected behavior, actual behavior, and impact.
2. Reproduce locally or collect logs, traces, data samples, failing tests, or deployment evidence.
3. Locate the boundary: UI, API, domain logic, database, cache, queue, integration, infrastructure, or configuration.
4. Compare with a working path or similar code.
5. Write one Technical Fix Plan markdown file that explains evidence, likely root cause, touched files, required ITSOL skills, TDD regression plan, fix approach, verification, and risks.
6. Self-review the Technical Fix Plan for gaps, TODOs, unproven assumptions, weak reproduction, missing tests, missing skills, and unclear verification; fix issues before asking for approval.
7. Stop and get explicit user approval for the Technical Fix Plan file or revise it from user feedback.
8. After approval, load `itsol-tdd-workflow` and add a RED regression test or minimal diagnostic before changing production code where feasible.
9. Implement one root-cause GREEN fix and verify related paths.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
