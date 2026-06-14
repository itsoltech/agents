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

Read [references/guide.md](references/guide.md) for decomposition and refactor rules.
