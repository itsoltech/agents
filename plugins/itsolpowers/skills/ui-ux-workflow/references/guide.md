# UI/UX Workflow Guide

## Routing Map

- UI process, planning questions, and minimum standard: `ui-ux-workflow`.
- Design tokens, base components, variants, consistency: `ui-design-system`.
- Component decomposition, container/presentational split, UI refactor: `ui-component-architecture`.
- View hierarchy, loading/empty/error, forms, tables/lists, API/cache states, optimistic UI: `ui-view-states-forms`.
- Mobile/tablet/desktop layouts, breakpoints, images, media: `ui-responsive-media`.
- Tailwind theme, tokens, variants, arbitrary values, `@apply`: `ui-tailwind-tokens`.
- Semantic HTML, keyboard, ARIA, focus, reduced motion and motion design: `ui-accessibility-motion`.
- Core Web Vitals, layout shift, expensive rendering, images, large lists: `ui-performance-stability`.
- Component/E2E/a11y/visual tests, manual QA matrix, edge cases: `ui-frontend-testing-qa`.
- UI pull request review and final verdict: `ui-code-review`.

## Before Implementation

Confirm:

- primary user goal and first thing the user should see;
- roles, permissions, readonly and permission-denied behavior;
- required, optional, partial, stale and deleted data;
- first load, background refetch, empty, validation error, server error, network error, rate limit and offline states;
- main action, destructive action, undo/confirmation, toast/inline message/redirect/cache update;
- existing matching component or pattern;
- mobile/tablet/desktop/wide desktop behavior;
- animation, skeleton, lazy loading, media and layout-stability needs.

Ask only questions that cannot be answered from existing code or patterns.

## During Implementation

- Start with semantic HTML and accessible structure.
- Reuse existing base components and tokens before adding new style.
- Add labels, accessible names, keyboard behavior, visible focus and error associations.
- Handle all data states without assuming perfect mock data.
- Reserve space for async content, images, skeletons, toasts and validation errors.
- Test long text, empty strings, many records, localization, zoom and slow API.
- Add tests for user-visible behavior, not internal component details.

## Minimum Standard For New Views

A new view should not be considered ready when it lacks:

- loading, error and empty states where data can be missing;
- mobile behavior and no-unwanted-horizontal-scroll check;
- keyboard path for primary action;
- labels and visible field errors for forms;
- stable image/skeleton dimensions;
- design tokens instead of one-off colors and spacing;
- security review for untrusted HTML or dangerous links;
- tests for the primary user behavior;
- justification for a new UI pattern.

## Developer Self-Review

Check before PR:

- existing components and tokens are used;
- long text, missing optional data and partial data do not break layout;
- main action, destructive action and feedback are clear;
- mobile, tablet, desktop and wide layouts work;
- keyboard, focus, labels and reduced motion work;
- images, fonts, skeletons and API refetch do not shift layout;
- large lists and heavy imports are controlled;
- tests cover the main behavior, errors and permission states.
