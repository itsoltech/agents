---
name: svelte-review
description: "Review Svelte/SvelteKit changes to components, routes, data flow, forms, SSR, or browser security."
---

# Svelte Review

Review Svelte changes for correctness, reactivity, data flow, accessibility, security, async UX, and maintainability.

## Trigger boundary

Use this skill when a Svelte/SvelteKit diff changes component or route behavior, reactivity/data flow, forms, SSR/hydration, accessibility, browser security, async UX, or deployment behavior.

Do not load it for a small local rename, comment, formatting change, or mechanical edit with no user-visible or server/browser impact; follow the repository's established convention directly.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [01-overview.md](./references/01-overview.md) - Overview; Zasady ogólne; TypeScript; Struktura projektu
- [02-komunikacja-z-api.md](./references/02-komunikacja-z-api.md) - Komunikacja z API; Runtime config i zmienne środowiskowe; Autoryzacja i sesja; Formularze, Superforms i Zod
- [03-csp-i-naglowki-bezpieczenstwa.md](./references/03-csp-i-naglowki-bezpieczenstwa.md) - CSP i nagłówki bezpieczeństwa; CSRF, CORS i cookies; Storage w przeglądarce; API security z perspektywy frontendu
- [04-testy-e2e.md](./references/04-testy-e2e.md) - Testy E2E; Dostępność w testach; Observability i diagnostyka; CI, lint i formatowanie
