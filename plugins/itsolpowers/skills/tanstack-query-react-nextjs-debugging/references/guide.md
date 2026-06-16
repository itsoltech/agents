# TanStack Query React Next.js Debugging Guide

Use this guide to debug TanStack Query v5 issues in React 19 and Next.js App Router.

## Evidence Checklist

Collect:

- route/component, user id or anonymized user scope, tenant/org, environment, and package versions;
- exact query key from code and Devtools;
- query status, `dataUpdatedAt`, `staleTime`, `gcTime`, observer count, `isPending`, `isFetching`, `isRefetching`, `isPlaceholderData`;
- Network status, payload, cookies, CORS, redirect, cache headers, and request id;
- generated API client/options and OpenAPI operation;
- mutation key/status/variables and lifecycle callbacks;
- invalidation target and whether it matches actual cached key;
- server/client query options used for SSR prefetch and hydration;
- auth/session/logout/tenant switch behavior;
- Next.js `router.refresh`, `revalidatePath`, `revalidateTag`, and server cache behavior;
- live event payload, tenant, revision, dedupe id, and reconnect/resync behavior;
- tests, traces, or repro video when available.

## Common Failure Classes

### Stale Data After Tenant/User Switch

Likely causes:

- tenant/user not included in query key;
- cache not cleared on logout/session expiration;
- previous tenant queries not removed;
- persisted cache lacks tenant/user versioning or cleanup.

Fix:

- include tenant/user scope in query keys;
- call `queryClient.clear()` on logout/session expiration;
- remove scoped queries on tenant switch;
- add E2E/regression test for tenant switch and stale data.

### Mutation Succeeds But UI Does Not Change

Likely causes:

- missing invalidation;
- invalidation uses wrong key;
- list filters/pagination not covered;
- mutation response updates detail but list remains stale;
- Next.js RSC cache refreshed but Query cache not invalidated.

Fix:

- use key factory/generated keys;
- invalidate exact list/detail prefixes;
- set complete detail data from response when safe;
- remember that `router.refresh()` is not `invalidateQueries()`.

### Duplicate Or Excessive Requests

Likely causes:

- default `staleTime: 0`;
- focus/reconnect refetch with stale hydrated data;
- unstable query key object;
- component remounting due to routing/layout structure;
- manual fetch plus `useQuery` for same data;
- long dependent-query waterfall.

Fix:

- set domain-appropriate `staleTime`;
- normalize key values;
- use stable query options;
- remove duplicate fetch path;
- prefetch independent data in parallel where appropriate.

### Hydration Mismatch Or Immediate Refetch

Likely causes:

- server prefetch and client `useQuery` use different keys/options;
- `HydrationBoundary` wraps wrong subtree;
- server QueryClient is reused globally;
- `useSuspenseQuery` without guaranteed prefetch;
- data depends on time, random values, localStorage, media queries, or browser APIs during render;
- dehydrated state includes data client should not receive.

Fix:

- reuse the same query options factory/generated options;
- place `HydrationBoundary` around the consuming Client Component;
- create server QueryClient per request;
- avoid unsafe Suspense;
- move browser-only logic after hydration or into a Client Component branch.

### Optimistic Update Is Overwritten

Likely causes:

- missing `cancelQueries` in `onMutate`;
- no snapshot/rollback;
- background refetch or live event lands during mutation;
- parallel mutations update same record;
- React `useOptimistic` and Query optimistic update both control the same UI.

Fix:

- cancel affected queries before patching;
- snapshot previous data and rollback on error;
- use revision/version if available;
- refetch/finalize on settle;
- avoid double optimism.

### 401/403 Leaves Old Data Visible

Likely causes:

- auth errors handled locally without cache cleanup;
- retry keeps hitting unauthorized endpoint;
- cached private data remains after session expiration;
- 403 path shows previous successful data.

Fix:

- centralize 401/session-expired handling;
- clear cache on logout/session expiration;
- do not retry 401/403;
- render permission/session state explicitly;
- test with expired session and insufficient permission.

### Live Event Does Not Update Correct Data

Likely causes:

- event lacks tenant/entity/revision;
- frontend maps event to wrong key;
- duplicate event applied twice;
- event from another tenant is accepted;
- reconnect misses events and no resync happens;
- infinite list patched manually despite unknown filters/pages.

Fix:

- dedupe by event id;
- filter by tenant/org;
- compare revisions when available;
- invalidate affected detail/list keys;
- resync after reconnect;
- prefer invalidation over manual patching for filtered/infinite lists.

## Debugging Questions

- Does the key include every value used by `queryFn`?
- Does the key distinguish tenant/org/user?
- Are two different data shapes sharing one key?
- Does `queryFn` throw for non-2xx?
- Is `AbortSignal` causing expected cancellation or unexpected error UI?
- Is query disabled by `enabled` or `skipToken`?
- Does mutation return a Promise from invalidation when pending state matters?
- Is invalidation too narrow, too broad, or aimed at the wrong prefix?
- Is Next.js server cache fresh while Query cache is stale, or the reverse?
- Is `router.refresh()` being used where `invalidateQueries()` is needed?
- Is SSR prefetch using the same options as client `useQuery`?
- Does Devtools show previous tenant/user data after context switch?

## Fix Discipline

- Fix the smallest cache invariant that is broken.
- Prefer regression tests for query keys, invalidation, auth cache clearing, hydration, optimistic rollback, and live event mapping.
- If the repo lacks test support, document a manual repro and replacement verification according to `.itsol.md`.
- After a fix, inspect Devtools and Network to confirm the cache operation changed the intended query only.
