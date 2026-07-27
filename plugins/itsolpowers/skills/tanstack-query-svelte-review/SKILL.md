---
name: tanstack-query-svelte-review
description: "Review Svelte TanStack Query v5/v6 runes, keys, cache, SSR, and mutations."
---

# TanStack Query Svelte Review

Review server-state behavior for stable keys, correct query functions, version-aware Svelte reactivity, safe mutation side effects, SSR correctness, and security-sensitive cache handling.

## Process

1. Inspect the diff and surrounding code before applying checklist items.
2. Detect whether the project uses `@tanstack/svelte-query` v5 or v6 before judging Svelte stores/runes patterns.
3. Check correctness, boundaries, security, data flow, observability, tests, and deployment impact for the changed behavior.
4. Report concrete findings first, ordered by severity, with file references and affected behavior.
5. Call out missing tests or residual risk only when it is tied to the reviewed change.

## Large PR Subagent Review

For broad or materially risky pull requests, recommend focused additional review only when independent expertise is likely to improve the verdict. Judge this from concrete risk, novelty, blast radius, reversibility, and context size—not file count or category matching alone. Small and conventional changes should remain one pragmatic pass.

When additional reviewers add value, split only by independent material surfaces. Each returns concrete evidence-based findings; the main agent removes duplicates and false positives and owns the proportional final verdict.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [11-version-policy-and-v6-review.md](./references/11-version-policy-and-v6-review.md) - Version gate; review v5; review v6; review migracji z v5 do v6
- [01-overview.md](./references/01-overview.md) - Overview; Kiedy używać TanStack Query; Minimalna konfiguracja klienta; Konfiguracja dla SvelteKit SSR
- [02-prefetch-w-sveltekit-przez-prefetchquery.md](./references/02-prefetch-w-sveltekit-przez-prefetchquery.md) - Prefetch w SvelteKit przez `prefetchQuery`; Domyślne zachowania v5
- [03-query-keys.md](./references/03-query-keys.md) - Query keys; Query options factory; `createQuery`
- [04-reaktywnosc-w-svelte.md](./references/04-reaktywnosc-w-svelte.md) - Reaktywność w Svelte; Statusy query w v5/v6; `enabled` i queries zależne
- [Shared API client and fetch](../_shared/references/tanstack-query-svelte/api-client-fetch.md) - wspólne fakty; użyj ich jako review rubryku requestów, cancellation i `select`
- [Shared mutations](../_shared/references/tanstack-query-svelte/mutations.md) - wspólne fakty; użyj ich jako review rubryku statusów, invalidacji i optimistic rollback
- [07-paginacja.md](./references/07-paginacja.md) - Paginacja; Infinite queries; Polling, refetch i realtime; Cache a auth, logout i tenant
- [Shared error handling](../_shared/references/tanstack-query-svelte/error-handling.md) - wspólne fakty; użyj ich jako review rubryku błędów, formularzy, filters, typing, performance i offline cache
- [09-devtools.md](./references/09-devtools.md) - Devtools; ESLint plugin query; Testy; CI
- [10-checklist-do-code-review.md](./references/10-checklist-do-code-review.md) - Checklist do code review
