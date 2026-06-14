---
name: ui-code-review
description: "UI code review: design system, states, a11y, responsive, Tailwind, perf, tests, QA."
---

# UI Code Review

Review UI as user-facing behavior: consistency, task completion, accessibility, responsive behavior, performance, and test evidence matter more than visual preference.

## Process

1. Inspect the diff, screenshots, changed components, existing nearby patterns, tests, routes, state/data flow, tokens and responsive behavior.
2. Build a UI review coverage map: design system, component architecture, UX states/forms/lists, responsive/media, Tailwind/tokens, accessibility/motion, performance/stability, tests/QA, and security-sensitive browser rendering.
3. For large frontend PRs, use subagents by focused UI area before producing the final verdict.
4. Verify the UI works for loading, empty, error, partial data, permission denied, readonly/disabled, long text, many records, mobile, keyboard and slow network when relevant.
5. Lead with concrete findings by severity, with file references and affected user behavior.
6. Treat missing screenshots, missing responsive evidence, missing a11y checks, missing visual/behavior tests, or unreviewed new patterns as review risks.

Read [references/guide.md](references/guide.md) for reviewer questions and subagent split.
