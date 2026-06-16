# Model Setup And API Client

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
