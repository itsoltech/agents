---
name: itsol-feature-implementation
description: Use when implementing a new ITSOL feature, behavior change, endpoint, UI flow, integration, or data workflow and the agent needs to translate requirements into a small, testable, reviewable change.
---

# ITSOL Feature Implementation

Implement the smallest coherent change that satisfies the user-visible behavior and leaves the code easier to review.

## Process

1. Confirm the user, system, and data behavior that must change.
2. Inspect existing patterns before designing new structure.
3. Identify affected permissions, validation, data shape, cache, events, jobs, and deployment implications.
4. Add or update tests at the lowest reliable level, plus integration coverage for boundaries.
5. Keep implementation narrow; avoid speculative abstractions.
6. Run focused verification and finish with `itsol-self-review`.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.

