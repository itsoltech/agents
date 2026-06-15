---
name: itsol-bug-debugging
description: "ITSOL bugfix workflow: evidence, root cause, Technical Fix Plan approval, tests."
---

# ITSOL Bug Debugging

Do not guess fixes. Reproduce or gather evidence, isolate the failing layer, always ask the user to choose or approve the fix approach, write one Draft Technical Fix Plan, get explicit approval after presenting it, then patch the root cause.

## Process

1. State expected behavior, actual behavior, and impact.
2. If `.itsol.md` exists, load `itsol-repo-memory` and apply matched project policy for touched paths, especially TDD mode and replacement verification.
3. Reproduce locally or collect logs, traces, data samples, failing tests, or deployment evidence.
4. Locate the boundary: UI, API, domain logic, database, cache, queue, integration, infrastructure, or configuration.
5. Compare with a working path or similar code.
6. Always run a Fix Decision Gate before writing the Technical Fix Plan: present repair options or the single forced approach, tradeoffs, recommendation, and ask the user which approach to use or whether to approve the recommendation.
7. Write one Technical Fix Plan markdown file with `**Status:** Draft` that explains evidence, likely root cause, touched files, required ITSOL skills, TDD regression plan or documented TDD exception, selected fix approach, verification, and risks.
8. Self-review the Technical Fix Plan for gaps, TODOs, unproven assumptions, weak reproduction, missing tests, missing skills, and unclear verification; fix issues before asking for approval.
9. Run Rubber Duck Plan Review with `itsol-self-review`; resolve material findings before asking for approval.
10. Stop and get explicit user approval after presenting the Technical Fix Plan file path and summary, or revise it from user feedback.
11. After approval, load `itsol-tdd-workflow` and add a RED regression test or minimal diagnostic before changing production code where feasible. If repo policy says TDD is limited or not supported, use replacement verification instead of scaffolding a new test framework.
12. Implement one root-cause GREEN fix and verify related paths.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
