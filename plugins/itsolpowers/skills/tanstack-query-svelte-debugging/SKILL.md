---
name: tanstack-query-svelte-debugging
description: "TanStack Query Svelte debugging for v5 and v6: stale data, keys, invalidation, optimistic UI, SSR, stores/runes migration bugs."
---

# TanStack Query Svelte Debugging

Trace cache state from query key to query function to invalidation and rendered UI before changing behavior. Detect the installed TanStack Query Svelte version before applying v5 store-style or v6 runes-style fixes.

## Process

1. State expected behavior, actual behavior, impact, and the smallest reproducible symptom.
2. Gather evidence from code, logs, traces, metrics, generated output, database plans, config, or failing tests before proposing a fix.
3. Detect `@tanstack/svelte-query` and `svelte` versions, then isolate whether the failure is cache, query key, SSR, store-style v5 usage, or runes-style v6 migration.
4. Isolate the boundary that fails and compare it with a known working path.
5. Implement one root-cause fix with focused verification or a regression test where feasible.

## Coordination

Use this skill together with `itsol-task-intake` for ambiguous work, `itsol-self-review` before handoff, and focused `security-*` or `infra-*` skills when the change touches trust boundaries or deployment behavior.

## Focused References

- [08-version-policy-and-v6-debugging.md](./references/08-version-policy-and-v6-debugging.md) - Version gate; objawy v6; debugowanie migracji v5 -> v6
- [01-overview.md](./references/01-overview.md) - Overview; Konfiguracja dla SvelteKit SSR; Prefetch w SvelteKit przez `initialData`; Prefetch w SvelteKit przez `prefetchQuery`
- [02-domyslne-zachowania-v5.md](./references/02-domyslne-zachowania-v5.md) - Domyślne zachowania v5/v6; Query keys; `createQuery`
- [03-reaktywnosc-w-svelte.md](./references/03-reaktywnosc-w-svelte.md) - Reaktywność w Svelte; Statusy query w v5/v6; `enabled` i queries zależne
- [Shared API client and fetch](../_shared/references/tanstack-query-svelte/api-client-fetch.md) - wspólne fakty; w debugowaniu prześledź request, cancellation i `select`
- [Shared mutations](../_shared/references/tanstack-query-svelte/mutations.md) - wspólne fakty; w debugowaniu prześledź status, invalidation, cache update i rollback
- [06-paginacja.md](./references/06-paginacja.md) - Paginacja; Infinite queries; Polling, refetch i realtime; Cache a auth, logout i tenant
- [07-url-params-search-params-i-filtry.md](./references/07-url-params-search-params-i-filtry.md) - URL params, search params i filtry; Performance; Persist cache i offline; Devtools
