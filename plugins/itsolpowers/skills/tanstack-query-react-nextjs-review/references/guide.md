# TanStack Query React Next.js Review Guide

Use this guide to review TanStack Query v5 usage in React 19 and Next.js App Router code. Report concrete behavioral defects and material risks.

## Coverage Map

Check:

- whether TanStack Query is the right owner for the data;
- QueryClient stability and server/client lifecycle;
- generated Hey API keys/options and generated-code drift;
- manual query key factories and query options factories;
- `useQuery`, dependent queries, status handling, and `select`;
- pagination, infinite queries, polling, realtime, and URL params;
- SSR prefetch, `HydrationBoundary`, and Server/Client Component split;
- Server Functions/Actions versus API-client mutations;
- mutation invalidation, `setQueryData`, optimistic updates, and rollback;
- auth/session/logout/tenant cache safety;
- error normalization and retry behavior;
- TypeScript typing and API response validation;
- ESLint plugin query, tests, E2E, CI, and QA evidence.

## Blocking Review Checks

Consider blocking when:

- query key misses tenant/user/filter/sort/page/language or another value used by `queryFn`;
- one key is reused for different data shapes or both normal and infinite queries;
- query function does not throw for non-2xx responses;
- `AbortSignal` is ignored for cancellable requests;
- manual `fetch` duplicates generated OpenAPI client behavior without reason;
- mutation has no invalidation, cache update, or documented reason;
- invalidation is unbounded and causes broad refetches without reason;
- optimistic update has no snapshot/rollback;
- logout/session expiration/tenant switch leaves old cached data visible;
- SSR prefetch and client query use different keys/options;
- dehydrated data exposes private fields or wrong-user data;
- `router.refresh()` is used as if it invalidated TanStack Query cache;
- generated files are manually edited;
- important cache behavior has no test or replacement verification.

## QueryClient And Defaults

Review for:

- Client Component provider in App Router.
- one browser QueryClient per app lifecycle.
- new server QueryClient per SSR request.
- no global server cache shared between users.
- non-zero `staleTime` for hydrated first-render data when immediate refetch would hurt UX.
- sensible domain-specific `staleTime`, `gcTime`, retry, refetch-on-focus, and devtools config.
- no `new QueryClient()` inside frequently rendered components.

Red flags:

- `staleTime: Infinity` for mutable backend data.
- default `staleTime: 0` causing repeated refetches with no product reason.
- retrying validation, authorization, not found, or conflict errors.
- Devtools shipped in production.

## Query Keys And Options

Review for:

- query key contains every query function dependency.
- tenant/org/user scope is included for scoped data.
- filters/search params are normalized before key use.
- Date instances, functions, class instances, and unstable objects are absent from keys.
- key factories or generated keys are used consistently for invalidation.
- options factories are hook-free and reusable in `useQuery`, prefetch, and tests.
- `skipToken` or `enabled` prevents fake-ID requests.
- dependent queries do not create avoidable waterfalls.

Red flags:

- `queryKey: ['projects']` with hidden `tenantId`, filters, or page in closure.
- copying query data to `useState` without draft-editing reason.
- `useEffect` performs a request that should be a query.
- `select` mutates data or hides invalid API shapes.

## API, Hey API, And Errors

Review for:

- endpoint covered by OpenAPI uses generated client/options.
- OpenAPI `operationId` is stable.
- generated output is current and not edited manually.
- API wrapper maps non-2xx responses to typed errors.
- error type carries status, code, message, optional field errors, and request/correlation id when available.
- `AbortSignal` flows from query function to fetch/client.
- cookies/credentials/CORS/CSRF are consistent with auth model.
- secrets are not in `NEXT_PUBLIC_*` or Client Components.

Red flags:

- `fetch` response is parsed without checking `response.ok`.
- `catch(() => null)` hides failed requests.
- tokens appear in query keys or logs.
- localStorage bearer tokens are introduced without security decision.

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

## Finding Standard

Each finding should include severity, file reference, affected user/system behavior, the specific cache/query/mutation/security invariant violated, and a concrete fix or verification.
