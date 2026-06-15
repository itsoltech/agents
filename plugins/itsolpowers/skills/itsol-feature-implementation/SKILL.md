---
name: itsol-feature-implementation
description: "Approved ITSOL feature implementation: scoped changes, TDD, verification, handoff."
---

# ITSOL Feature Implementation

Implement the smallest coherent change that satisfies the user-visible behavior and leaves the code easier to review.

## Process

1. Confirm the Business Plan file and Technical Plan file were both explicitly approved by the user after the user saw each specific plan.
2. Reject invalid approval sources: original task request, `continue`, "direct user request", silence, or a generic main-agent statement.
3. Confirm both plan files have `**Status:** Approved`; if either is `Draft`, stop and ask for approval instead of implementing.
4. Confirm the user chose execution mode: subagent-driven or inline.
5. If execution mode is subagent-driven, load `itsol-subagent-workflow`; otherwise continue inline.
6. If `.itsol.md` exists, load `itsol-repo-memory` and apply matched project policy for touched paths.
7. Inspect existing patterns before designing new structure.
8. Identify affected permissions, validation, data shape, cache, events, jobs, and deployment implications.
9. Load `itsol-tdd-workflow` before writing production code. Create the focused RED test when supported; if repo policy says TDD is limited or not supported, record the exception and replacement verification instead of scaffolding a new test framework.
10. Implement the smallest GREEN change, then refactor only while tests or replacement checks stay green.
11. Keep implementation narrow; avoid speculative abstractions.
12. Run focused verification and finish with `itsol-self-review`.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
