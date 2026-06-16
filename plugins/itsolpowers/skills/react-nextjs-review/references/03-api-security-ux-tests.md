# API Security UX And Tests

## API, Cache, And Forms

Review for:

- endpoint covered by OpenAPI uses generated Hey API client instead of handwritten fetch.
- generated output is not manually edited and its diff is visible when the contract changes.
- API wrapper handles base URL, credentials/tokens, request id, `AbortSignal`, HTTP 4xx/5xx mapping, telemetry, and stable error shape.
- query keys include every parameter affecting result, including filters, pagination, user/tenant context where relevant.
- `staleTime`, `gcTime`, retry, invalidation, optimistic update, and rollback are deliberate.
- Next.js server cache and TanStack Query client cache are not silently duplicating or contradicting each other.
- SSR/hydration does not expose secrets, private fields, or wrong-user data.
- forms map field errors, keep user input after failure, block double submit or use idempotency keys, and expose keyboard/a11y semantics.

Red flags:

- `fetch` response treated as success without checking `ok`.
- mutation succeeds but stale UI remains because invalidation/update is missing.
- `invalidateQueries()` without a bounded key.
- `router.refresh()` used as a generic mutation solution.
- hidden/disabled fields trusted as authority.

## Security, Auth, And Env

Review for:

- no secrets in `NEXT_PUBLIC_*`, `next.config.ts env`, Client Components, or static assets.
- authorization enforced server-side; hidden buttons are only UX.
- tenant and ownership checks happen on server-side API/DAL/BFF paths.
- `dangerouslySetInnerHTML` is absent or paired with sanitizer and security review.
- cookie auth has `HttpOnly`, `Secure`, `SameSite`, sane `Path`/`Domain`, and CSRF protection for mutating endpoints.
- CSP and security headers are present or intentionally handled by platform/proxy.
- logout clears TanStack Query cache and user-scoped local state.
- `401` and `403` are handled differently.
- runtime config is validated and build-time/runtime env differences are understood.

## UX, Performance, And Tests

Review for:

- loading, empty, error, partial error, permission denied, stale/refetching, and success states.
- keyboard flow, focus management, labels, error announcements, and reduced motion.
- mobile behavior that does not rely on hover.
- images and skeletons with stable dimensions to avoid layout shift.
- Client Component count and large dependency imports justified.
- heavy widgets such as charts, editors, maps, PDFs, datepickers, and syntax highlighters dynamically loaded when appropriate.
- large lists virtualized or paginated.
- tests cover success, error, permissions, deep link/reload, double submit, query invalidation, and logout cache cleanup where relevant.
- CI runs generated client check, lint, typecheck, tests, build, and E2E where repo policy supports them.
