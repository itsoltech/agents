---
name: svelte-debugging
description: "Debug Svelte routes, loads, stores, reactivity, forms, auth, hydration, and SSR."
---

# Svelte Debugging

Debug Svelte problems by isolating whether the failure is data loading, reactivity, component state, browser behavior, API integration, or deployment mode.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Isolate the boundary that fails and compare it with a known working path.
4. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Svelte 5 reactivity; Props, events, bind i snippets; State management
- [02-autoryzacja-i-sesja.md](./references/02-autoryzacja-i-sesja.md) - Autoryzacja i sesja; Formularze, Superforms i Zod; CSRF, CORS i cookies; Storage w przeglądarce
- [03-deployment-i-hosting.md](./references/03-deployment-i-hosting.md) - Deployment i hosting; SPA z osobnym API; SSR/SvelteKit server mode
