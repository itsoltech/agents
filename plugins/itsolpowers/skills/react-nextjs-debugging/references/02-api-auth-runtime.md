# API Auth And Runtime

## API, Cache, And Mutations

Check:

- API wrapper checks `response.ok` and maps 4xx/5xx into an application error.
- request carries expected credentials or token and does not violate CORS/CSRF policy.
- generated client matches current OpenAPI spec.
- query key contains filters, pagination, sort, user/tenant context, and feature flags that affect result.
- query is not accidentally disabled with `enabled: false`.
- mutation invalidates or updates the exact affected query keys.
- optimistic update has rollback and does not mutate cache in place.
- live events and background refetch do not race with local optimistic state.
- Next.js server cache and TanStack Query client cache have an explicit relationship.
- `router.refresh()` refreshes the intended segment and is not expected to clear client cache.

Common causes:

- stale UI after mutation because invalidation is missing or too broad.
- wrong tenant/user data because query key lacks scope.
- Next.js cache returns old server data while TanStack Query shows fresh client data.
- SSR prefetch uses a singleton `QueryClient`.
- dehydrated state includes private or excessive data.

## Auth, Session, Env, And Runtime

Check:

- `401` is treated as missing/expired auth and `403` as insufficient permission.
- logout clears TanStack Query cache and local user-scoped state.
- token refresh handles concurrent requests without loops.
- tenant changes invalidate scoped data.
- cookies have expected `HttpOnly`, `Secure`, `SameSite`, path/domain, and are present in the request.
- mutating cookie-auth endpoints have CSRF protection.
- `NEXT_PUBLIC_*` values changed after Docker build were actually rebuilt or delivered via runtime config.
- private env is read only server-side and not imported by client code.
- self-hosted deployments distinguish build-time env from runtime env.
