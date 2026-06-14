---
name: ui-frontend-testing-qa
description: Use when planning, implementing, reviewing, or handing off frontend UI tests and QA, including component tests, integration tests, E2E tests, accessibility tests, visual regression, performance checks, manual QA matrices, responsive QA, edge cases, stable selectors, flaky test prevention, and UI PR test evidence.
---

# UI Frontend Testing QA

Test user-visible behavior, not private implementation details.

## Process

1. Choose the smallest test level that proves the behavior: pure unit, component, integration, E2E, accessibility, visual, performance or manual QA.
2. Test interactions, validation, error messages, loading/disabled states, submit success/error, permission states, optimistic rollback, routing and focus behavior.
3. Avoid testing private functions, Tailwind class names, framework internals, cache implementation details or mock behavior that does not resemble the real API.
4. For E2E, cover critical user flows and use selectors based on roles, labels and text when stable; use `data-testid` only when no stable user-facing selector exists.
5. For visual regression, stabilize data, disable animations, freeze time/randomness, and review snapshot updates as UI changes.
6. For manual QA, cover data volume, empty/partial data, slow network, permissions, keyboard, touch, zoom, mobile/desktop and edge cases.

Read [references/guide.md](references/guide.md) for test and QA matrices.
