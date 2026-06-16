# Review Scope Blockers And Findings

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

## Finding Standard

Each finding should include severity, file reference, affected user/system behavior, the specific cache/query/mutation/security invariant violated, and a concrete fix or verification.
