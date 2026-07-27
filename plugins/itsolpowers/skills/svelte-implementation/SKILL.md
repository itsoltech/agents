---
name: svelte-implementation
description: "Implement Svelte UI, routes, loads, forms, APIs, accessibility, states, and tests."
---

# Svelte Implementation

Build Svelte code around clear component boundaries, typed data, trusted server-side validation, accessible states, and measurable performance.

## Process

1. Inspect existing project conventions before introducing new structure.
2. Define the contract, data flow, error behavior, permissions, observability, and tests before editing.
3. Make the smallest coherent change that satisfies the behavior.
4. Run focused verification and use `itsol-self-review` before handoff.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Cel dokumentu; Założenia techniczne; Zasady ogólne
- [02-load-i-pobieranie-danych.md](./references/02-load-i-pobieranie-danych.md) - `load` i pobieranie danych; Komunikacja z API; Runtime config i zmienne środowiskowe; Autoryzacja i sesja
- [03-dostepnosc.md](./references/03-dostepnosc.md) - Dostępność; Performance UI i rendering; Bundle size i zależności frontendowe; Obrazy, fonty i assets
- [04-ci-lint-i-formatowanie.md](./references/04-ci-lint-i-formatowanie.md) - CI, lint i formatowanie; Review zależności; Deployment i hosting; SPA z osobnym API
