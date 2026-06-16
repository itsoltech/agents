# SSR Mutations Auth And Tests

## SSR, Hydration, And Next.js Cache

Review for:

- Server Component prefetches only first-render data.
- `HydrationBoundary` wraps the Client Component using the same query.
- server prefetch and client query share the same options/key.
- no root layout prefetching of unrelated data.
- `useSuspenseQuery` has guaranteed prefetch or explicit Suspense/error boundaries.
- dehydrated state contains no secrets or excessive private data.
- mutation changing RSC data uses `revalidatePath`/`revalidateTag` as needed.
- mutation changing Query data invalidates or updates Query cache separately.

Red flags:

- expecting `router.refresh()` to invalidate client Query cache.
- expecting `invalidateQueries` to revalidate RSC cache.
- singleton server QueryClient.
- hydration mismatch from different keys, time/random/browser data, or missing prefetch.

## Mutations, Optimism, Realtime

Review for:

- mutation input/output is typed.
- mutation has key when mutation state is consumed globally.
- pending state blocks unsafe double submit.
- `onSuccess`, `onError`, or `onSettled` handles cache effects.
- invalidation targets exact affected keys.
- `setQueryData` uses immutable updates and complete data.
- optimistic update cancels active queries, snapshots previous data, rolls back on error, and refetches/finalizes.
- live events are domain events mapped to cache operations by frontend.
- events are deduplicated, tenant-scoped, revision-aware, and resync after reconnect.
- infinite list event handling avoids unsafe manual edits across unknown pages.

Red flags:

- create/update/delete leaves list/detail stale.
- broad invalidation after every mutation creates unnecessary request storms.
- optimistic list patch duplicates server filtering/sorting rules.
- `useOptimistic` and Query optimism both mutate the same UI without a clear contract.

## Auth, Security, Tenant

Review for:

- backend enforces authorization independently from frontend hooks.
- tenantId is in keys for tenant data.
- logout and session expiration clear user cache.
- tenant/org switch clears or removes previous scoped queries.
- 401 and 403 are handled differently.
- 403 does not leave sensitive cached data visible.
- persisted cache, if used, has security approval, TTL, version, logout cleanup, and tenant cleanup.
- public and private data do not share a key.

## Tests And QA

Review for:

- fresh QueryClient per test.
- retry disabled for error tests.
- MSW or API boundary mocks instead of mocking `useQuery`.
- tests cover loading, success, empty, error, refetch, invalidation, optimism rollback, auth errors, tenant switch, filter key changes, and logout cleanup where relevant.
- E2E covers slow API, 401/403/409/422/500, fast filter changes, double submit, tenant switch, list/detail navigation, offline/reconnect, live event echo, and optimistic rollback when relevant.
- CI runs lint, typecheck, tests, Playwright where supported, OpenAPI generate/check, and generated diff checks.
- `@tanstack/eslint-plugin-query` is enabled or absence is justified.
