# React Next.js API Cache Forms Guide

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

## Hey API And OpenAPI

- Keep generated code in one directory such as `src/shared/api/generated`.
- Never manually edit generated output.
- Pin generator version.
- Make OpenAPI spec and generated client diffs visible in PRs.
- If a spec is fetched from URL, CI needs a stable tag, version, snapshot, or artifact.
- Do not generate from a random local backend without a reviewable diff.
- Use manual wrappers only for application behavior: auth, base URL, error mapping, telemetry, retry, runtime config.
- If an endpoint is missing from OpenAPI, fix the spec instead of writing one-off `fetch`.
- Treat generated TanStack Query keys as source of truth.

Useful scripts:

- `openapi:generate`
- `openapi:check`
- `typecheck`
- `lint`
- `test`
- `test:e2e`

## API Client Wrapper

The shared API client should handle:

- `baseUrl`;
- credentials, cookies, or tokens;
- `Accept`, `Content-Type`, and `X-Request-Id`;
- HTTP error mapping;
- `401` and `403` behavior;
- telemetry and correlation id;
- request cancellation through `AbortSignal`;
- runtime config when one build runs in multiple environments.

Rules:

- Do not configure API clients in each component.
- Prefer HttpOnly cookies over long-lived localStorage tokens when possible.
- Do not add cross-origin `Authorization` without reviewing CORS and CSRF.
- `fetch` does not throw on HTTP 4xx/5xx; wrapper must map bad statuses.
- Error responses should have a stable shape such as ProblemDetails or `ApiError`.
- Retry must depend on error type.
- Mutating endpoints need idempotency keys when retry can repeat the operation.

## Forms

Use simple Server Functions plus `useActionState` and `useFormStatus` for simple Next.js forms.

Use client-side form tooling for complex forms:

- React Hook Form;
- Zod, Valibot, or another runtime validator;
- TanStack Query mutations;
- generated Hey API client.

Rules:

- Client validation improves UX but never replaces backend validation.
- Field errors should map to fields.
- General errors should appear in a visible place.
- Do not reset the form after failed mutation.
- Do not clear user input on network errors.
- Block double submit or use idempotency keys.
- Inputs need labels and keyboard access.
- Field errors need `aria-describedby`.
- Do not show raw backend errors, stack traces, SQL errors, or internal codes unless explicitly safe.

## State Boundaries

- Local UI state: `useState`, `useReducer`.
- Derived state: normal calculations or measured `useMemo`.
- Server state: TanStack Query.
- URL state: search params and dynamic route params.
- Global UI state: Context, Zustand, Jotai, or similar lightweight store.
- Form state: form library or local reducer.
- Auth/session state: server/session provider, not an arbitrary global store.

Do not keep server state in global store. Do not copy TanStack Query data into local state unless editing a draft. Clear user-scoped cache and state on logout.
