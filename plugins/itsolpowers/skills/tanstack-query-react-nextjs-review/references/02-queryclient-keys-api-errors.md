# QueryClient Keys API And Errors

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
