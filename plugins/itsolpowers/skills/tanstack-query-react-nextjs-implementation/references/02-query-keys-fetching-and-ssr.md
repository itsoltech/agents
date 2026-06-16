# Query Keys Fetching And SSR

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
