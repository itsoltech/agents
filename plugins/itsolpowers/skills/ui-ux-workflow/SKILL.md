---
name: ui-ux-workflow
description: "UI/UX workflow: plan, implement, route, self-review views, flows, a11y, perf, tests."
---

# UI/UX Workflow

Use this as the process skill for frontend UI work before loading framework-specific skills such as `svelte-implementation` or `svelte-review`.

## Process

1. Inspect the existing app first: similar views, base components, tokens, layout primitives, forms, tables, error states, tests, and Storybook or visual examples.
2. Clarify the user goal, roles, permissions, required data, optional data, actions, destructive paths, mobile/tablet/desktop expectations, and async states.
3. Route to focused UI skills for touched areas: design system, component architecture, view states/forms, responsiveness/media, Tailwind/tokens, accessibility/motion, performance/stability, tests/QA, and UI code review.
4. For functional work, include UI/UX requirements in the Business Plan and exact UI implementation/review skills in the Technical Plan.
5. During implementation, start from semantic HTML and existing components, then add accessibility, states, responsive layout, tokens, tests, and visual verification.
6. Before PR, self-review the UI for consistency, UX states, keyboard support, long text, responsive behavior, layout stability, performance, tests, and security-sensitive rendering.
7. For review, use `ui-code-review`; for large frontend PRs, delegate subagents by area instead of doing one broad inline pass.

Read [references/guide.md](references/guide.md) for the routing map and minimum standards for new UI.
