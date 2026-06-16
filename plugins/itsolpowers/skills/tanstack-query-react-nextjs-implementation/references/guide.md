# TanStack Query React Next.js Implementation Guide

Use this guide when implementing TanStack Query v5 in React 19 and Next.js App Router applications.

## Mental Model

TanStack Query manages client-side server state: data whose source of truth is backend or an external system. Use it for lists, detail views, search results, import status, paginated documents, organization config, polling, realtime events, cache sharing, retry, cancellation, stale/fresh status, mutations, optimistic updates, and invalidations.

Do not use it as the primary store for modal state, active UI tab, local form draft, drag-and-drop state, local preferences, or component-only state.

In Next.js, separate:

- Next.js server/routing cache;
- TanStack Query client cache.

`revalidatePath`, `revalidateTag`, and `router.refresh()` affect Next.js-rendered data. `queryClient.invalidateQueries`, `setQueryData`, `removeQueries`, and `clear` affect TanStack Query cache. They do not synchronize automatically.

## When To Use It

Use TanStack Query when a Client Component needs interactive data: filters, sorting, pagination, refetches, optimistic updates, polling, live events, URL/search-param driven data, shared cache across components, retry/cancellation, or precise request status.

Avoid it when data is only needed for static server rendering, a Server Component can fetch it directly, a page is mostly marketing/static, the request requires secrets that must not reach the browser, or the data should be fetched directly from a server-side data source.

Keep Client Components as low in the tree as possible. Do not move a whole page to `'use client'` only because one fragment uses `useQuery`.

## QueryClient

- The provider must be a Client Component in App Router.
- Create a new `QueryClient` per server request.
- Keep one browser `QueryClient` for the app lifecycle.
- Do not create `new QueryClient()` in a component rendered repeatedly.
- Do not create a global server-side cache shared between users.
- Use non-zero `staleTime` for SSR/hydration when immediate refetch would hurt UX.
- Run Devtools only in development.

Choose defaults deliberately:

- `staleTime` means how long data is fresh.
- `gcTime` means how long unused data stays in cache.
- Default `staleTime: 0` makes data stale immediately.
- `invalidateQueries` marks data stale and may refetch active queries.
- Query functions must return data or throw; return `null`, not `undefined`, when empty data is valid.
- Use TanStack Query v5 object signature for `useQuery` and `useMutation`.

## Hey API And API Client

- Generate API client, types, query options, query keys, and mutation options from OpenAPI when the endpoint is covered by the contract.
- Pin `@hey-api/openapi-ts`.
- Never edit generated files manually.
- Keep generated output in a dedicated directory.
- Start review of large generated diffs from OpenAPI changes.
- Require stable `operationId` and documented status codes, parameters, request bodies, response bodies, and error shapes.
- Keep custom wrappers outside generated code for base URL, auth, error mapping, telemetry, retry, request id, and runtime config.
- Use `@hey-api/client-next` when Next.js integration/fetch semantics matter; use `@hey-api/client-fetch` for runtime-neutral clients.
- Do not put secrets in `NEXT_PUBLIC_*`.
- Pass `AbortSignal` from TanStack Query to fetch/client code.
- Normalize failed non-2xx responses into typed application errors.

## Query Keys And Options

Treat query keys like dependency arrays for query functions:

- include every variable used by `queryFn`;
- include tenant/org/user scope when it changes data;
- include filters, sort, pagination, search params, language, and feature flags when they affect results;
- avoid functions, classes, Date instances, and unstable objects;
- normalize filter objects before using them in keys;
- never reuse one key for different data shapes;
- never reuse the same key for `useQuery` and `useInfiniteQuery`;
- centralize key factories or generated keys.

Prefer query options factories:

- options factories should not depend on React hooks;
- use the same options for `useQuery`, `prefetchQuery`, tests, and invalidation reasoning;
- wrapper hooks may add UI-level behavior, but should not hide the query key or side effects.

## Queries And UX

- `isPending` means no data yet.
- `isFetching` means any fetch, including background refetch.
- `isRefetching` means refetch after first data.
- `isPlaceholderData` means placeholder data is displayed.

UX rules:

- first pending: skeleton/loading/route-level loading;
- background refetch: subtle indicator, not full skeleton when data exists;
- error without data: error state with retry;
- error with existing data: keep data and show inline warning/toast where appropriate;
- empty state is separate from loading and error.

Use `enabled` or `skipToken` for dependent queries. Do not send requests with fake IDs to satisfy TypeScript. Avoid long request waterfalls; use parallel prefetch or `useQueries` for independent queries.

Use `select` only for pure data transformation. Do not mutate data or hide bad API shapes in `select`.

Use `placeholderData: keepPreviousData` for paginated/filter transitions when preserving layout is better UX. Show that data is being refreshed.

## SSR, Hydration, And Server Components

Most predictable Next.js model:

1. Server Component creates a temporary `QueryClient`.
2. It calls `prefetchQuery` with the same query options used by the client.
3. It passes `dehydrate(queryClient)` to `HydrationBoundary`.
4. Client Component calls `useQuery` with the same query key/options.

Rules:

- prefetch only first-render data;
- do not prefetch everything in root layout;
- prefetch independent queries through `Promise.all`;
- use identical query options server-side and client-side;
- avoid `useSuspenseQuery` unless prefetch and boundaries are deliberate;
- hydration does not remove the need for mutation invalidation;
- hydration does not synchronize Next.js cache and Query cache;
- dehydrated state must contain only data safe for the browser.

Server Components can act as loader phase for auth, tenant context, server secrets, and first-render prefetch. Do not use them to bypass authorization or pass large private payloads into Client Components.

## Mutations And Invalidation

Use mutations for create/update/delete and other server side effects.

- `mutationFn` performs the server effect.
- `onSuccess` updates or invalidates cache.
- `onError` handles domain errors or rollback.
- `onSettled` is useful for final refetch.
- Returning a Promise from invalidation keeps mutation pending longer.
- Do not hide mutations in random `onClick` handlers with manual fetch.
- Do not refresh the whole page when targeted invalidation is enough.
- Do not call `invalidateQueries()` without a filter unless explicitly justified.

Default invalidation strategy:

- create: invalidate lists and set detail when response contains full object;
- update: set detail and invalidate lists when sort/filter membership can change;
- delete: remove detail and invalidate lists;
- permission change: invalidate permission-dependent data;
- tenant/org change: clear user cache or remove previous-tenant queries.

Use `setQueryData` only when mutation response contains complete data needed for cache. Update immutably and avoid duplicating server sorting/filtering rules in frontend.

## Optimistic Updates

Use optimistic updates only when latency matters, operation usually succeeds, and rollback is simple.

Rules:

- cancel active queries for the affected key before patching;
- snapshot previous data;
- apply immutable update;
- rollback on error;
- refetch or set final server response on settle/success;
- avoid optimism for high-conflict or backend-transformed operations;
- test parallel mutations on the same record;
- paginated list optimism is harder than detail optimism.

Do not mix React 19 `useOptimistic` and TanStack Query optimistic updates in the same flow without a clear reason. Double optimism causes flicker, conflicting rollbacks, and race conditions.

## Pagination, Infinite Queries, Polling, Realtime

- Put page, pageSize, filters, sort, and tenant in the key.
- Keep shareable list state in URL.
- Use `placeholderData` to prevent layout jumps.
- Do not fetch all records to paginate client-side.
- For infinite queries, provide `initialPageParam`, use a distinct key, consider `maxPages`, and guard `fetchNextPage`.
- Prefer invalidation over manual patching for live events that affect filtered/infinite lists.
- Poll only visible/relevant views with reasonable intervals.
- Use WebSocket/SSE when quick updates matter or polling would be too expensive.
- Map domain events to cache operations on the frontend.
- Deduplicate events, ignore other tenants, use revision/cursor when available, and resync after reconnect.

## Auth, Security, Errors

- Authorization belongs on the backend, not in hooks.
- Do not put tokens, full auth/session objects, functions, or secrets into query keys.
- Clear cache on logout/session expiration through `queryClient.clear()`.
- Clear or remove scoped queries on tenant/user switch.
- Do not show stale cached data after `401`, `403`, logout, or tenant change.
- Retry network and some 5xx errors; do not retry validation, `401`, `403`, `404`, `409`, or `422`.
- Do not swallow query errors with `catch(() => null)`.
- Map `422` to field errors and `409` to conflict state.

## Tests And CI

- Use a fresh `QueryClient` per test.
- Disable retries in tests that assert errors.
- Prefer MSW or API-client boundary mocks over mocking `useQuery`.
- Test loading, success, empty, error, refetch, invalidation, optimistic rollback, `401/403`, logout clearing, filter key changes, and tenant switch.
- CI should run lint, typecheck, tests, Playwright where supported, OpenAPI generation/check, and generated-client drift checks.
- Include `@tanstack/eslint-plugin-query` and enforce stable query client, exhaustive deps, no unstable query results in dependencies, and correct infinite query options.
