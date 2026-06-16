# Mutations Optimism And Realtime

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
