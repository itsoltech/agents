---
name: ultra-plan
description: Interview the user and write SPEC.md for a new feature or fix.
---

# Ultra Plan

Use this skill when the user asks to turn a new feature or fix request into a `SPEC.md`.

## Workflow

1. Read the current codebase and identify files, modules, workflows, and conventions relevant to the request.
2. Interview the user in depth before writing the spec.
3. Ask focused, non-obvious questions about implementation constraints, UX, tradeoffs, data flow, risk, rollout, and testing.
4. Continue until the requirements are specific enough to implement without guessing.
5. Write the resulting spec to `SPEC.md` in the project root.

## Spec Content

Include:

- Problem statement and goals
- Non-goals
- User-facing behavior
- Technical approach
- Data and API changes
- Edge cases and failure modes
- Test plan
- Rollout or migration notes when relevant

Keep the spec concrete. If a decision remains unresolved, call it out explicitly instead of hiding it in vague wording.
