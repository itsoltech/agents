# Data Cache And Hydration

Use this guide for API communication, generated clients, TanStack Query, Next.js cache boundaries, SSR hydration, forms, and client/server validation.

## Data Ownership

Classify data first:

- first-render data fetched server-side;
- interactive client-side server state;
- form draft and mutation state;
- URL state such as filters, sorting, pagination, active tabs;
- realtime data from WebSocket/SSE;
- public runtime config;
- private server-only data.

Rules:

- In Server Components, fetch server-side through backend SDKs, server-only clients, BFF, or data access helpers.
- In Client Components, use TanStack Query for server state.
- Do not copy server state into `useState` unless editing a draft.
- Do not use a global store as HTTP cache.
- Keep API functions testable without React.
- Map every API error to a stable application error type.

## Next.js Cache Versus TanStack Query

Use Next.js cache when:

- data is fetched server-side;
- data should be shared between requests or revalidated by tags/paths;
- the first render should be fast;
- data is mostly static or not heavily interactive;
- the feature uses `use cache`, `revalidateTag`, `revalidatePath`, or Cache Components.

Use TanStack Query when:

- data is fetched/refreshed client-side;
- UI has filters, pagination, infinite scroll, polling, focus refetch, or optimistic updates;
- mutations need targeted invalidation;
- live events update data;
- components need `pending`, `error`, `success`, `isFetching`, or `isStale`.

Avoid:

- fetching the same data server-side and client-side without hydration/revalidation plan;
- live events invalidating TanStack Query while UI reads stale Next.js cache;
- using `router.refresh()` after every mutation;
- unscoped `invalidateQueries()`;
- global caching of private user or tenant data.

## TanStack Query V5

- Create the browser `QueryClient` once in a Client Component provider.
- Create a separate server `QueryClient` per SSR request.
- Query keys must include every parameter that changes the result.
- Prefer generated query key factories from Hey API when available.
- Set `staleTime` from data behavior, not by global guess.
- Set `gcTime` deliberately for large lists and payloads.
- Retry 5xx, 429, and network failures differently from validation, 401, 403, and other 4xx failures.
- Do not retry validation or authorization errors.
- Mutations should invalidate or update only related query keys.
- Optimistic updates need rollback and immutable cache updates.
- For live events, use `setQueryData` for small deterministic changes and `invalidateQueries` for complex effects.
- Do not treat TanStack Query as local UI state.

## SSR And Hydration

Use SSR with TanStack Query when first-render data matters, SEO matters, or empty loading states would hurt UX.

Rules:

- Server prefetch QueryClient must be per request.
- Never keep a server QueryClient singleton.
- Dehydrated state must include only data safe for the browser.
- Do not hydrate secrets, tokens, private fields, or excessive backend data.
- If using `useSuspenseQuery`, make sure the query is prefetched or the Suspense boundary is deliberate.
- Client invalidation and Next.js server cache invalidation are separate decisions.
