---
name: itsol-feature-implementation
description: "Approved ITSOL feature implementation: scoped changes, TDD, verification, handoff."
---

# ITSOL Feature Implementation

Implement the smallest coherent change that satisfies the user-visible behavior and leaves the code easier to review.

## Process

1. Confirm the Business Plan file and Technical Plan file were both explicitly approved by the user.
2. Confirm the user chose execution mode: subagent-driven or inline.
3. If execution mode is subagent-driven, load `itsol-subagent-workflow`; otherwise continue inline.
4. Inspect existing patterns before designing new structure.
5. Identify affected permissions, validation, data shape, cache, events, jobs, and deployment implications.
6. Load `itsol-tdd-workflow` and create the focused RED test before writing production code.
7. Implement the smallest GREEN change, then refactor only while tests stay green.
8. Keep implementation narrow; avoid speculative abstractions.
9. Run focused verification and finish with `itsol-self-review`.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
