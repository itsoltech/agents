---
name: ui-component-architecture
description: "UI component architecture: decomposition, container/presentational split, refactor safety."
---

# UI Component Architecture

Keep components understandable, testable, and aligned with ownership boundaries.

## Process

1. Inspect whether the component mixes data fetching, layout, forms, validation, modals, lists, formatting, permissions, and API/cache decisions.
2. Split by user-visible sections and independent state, not by arbitrary file size.
3. Keep page/container components responsible for composition, data fetching, mutations, error mapping and screen state.
4. Keep presentational components free of HTTP clients, cache details, route loaders and backend assumptions; pass data and callbacks as props.
5. Move formatting, mapping and validation helpers out of large render bodies.
6. Keep base components domain-free; domain components may know business types.
7. Add or preserve tests before risky UI refactors, then separate refactor commits from feature commits when possible.

## When A Component Is Too Large

Refactor when a component:

- mixes fetching, layout, form state, validation, modal state and list rendering;
- contains several independent sections with separate loading/error states;
- has many render branches and local state groups;
- is hard to test without mocking much of the app;
- makes a small variant change risk unrelated regressions;
- contains helpers used only by one part of the screen.

## Decomposition Pattern

```txt
FeaturePage
  FeaturePageHeader
  FeatureFilters
  FeatureList
  FeatureListItem
  FeatureEmptyState
  FeatureErrorState
  FeatureDetailsPanel
  FeatureDeleteDialog
```

Rules:

- page component composes the view and passes data down;
- section components own one screen area;
- reusable list components should not decide API endpoints;
- forms should separate data model, validation and UI;
- modal open state should have one clear owner;
- API/cache logic should not live in reusable presentational components.

## Container And Presentational Split

Container components:

- fetch data;
- handle mutations;
- map API errors to UI state;
- decide screen state;
- pass prepared data and callbacks down.

Presentational components:

- render data;
- do not import HTTP clients;
- do not know cache keys;
- receive callbacks via props;
- are easy to test and show in Storybook.

Do not force this split for tiny single-use components.

## UI Refactor Gate

Refactor UI when duplication, hard-to-understand flags, style overrides, inaccessible patterns, performance issues, or untestable components are slowing safe delivery.

Prefer:

1. small behavior-preserving refactor;
2. tests that protect behavior;
3. feature implementation after the structure is stable.
