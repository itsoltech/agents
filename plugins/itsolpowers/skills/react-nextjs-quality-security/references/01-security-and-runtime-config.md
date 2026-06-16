# Security And Runtime Config

Use this guide for security, auth, permissions, CSP, env, runtime config, accessibility, performance, tests, CI, QA, and production readiness in React 19 and Next.js applications.

## Security Baseline

- Client code is public.
- Secrets never go to the client bundle.
- `NEXT_PUBLIC_*` values are visible to users.
- Authorization is always enforced server-side.
- Hidden buttons are UX, not security.
- API data, forms, storage, query params, cookies, and websocket events are untrusted.
- Avoid `dangerouslySetInnerHTML`; if required, use a trusted sanitizer and security review.
- Do not render backend-provided HTML without sanitization.
- Use CSP as defense-in-depth against XSS impact.
- Do not store long-lived tokens in localStorage.
- Session cookies should be `HttpOnly`, `Secure`, `SameSite`, and have sane `Path`/`Domain`.
- Cookie-authenticated mutations need CSRF protection.
- Validate `Origin`/`Referer` for sensitive mutations when the model requires it.
- Validate uploads server-side: type, size, extension, path, scanning, and content sniffing.
- Do not log full payloads with PII, tokens, or passwords.
- Do not show raw backend errors to users.
- Middleware/proxy is not the only authorization layer for data.

## CSP And Headers

Minimum direction:

- `Content-Security-Policy`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- `Strict-Transport-Security` for HTTPS;
- secure cookies.

Rules:

- Test CSP in report-only before enforcing strict policy.
- Avoid `unsafe-inline` when possible.
- Use nonce or hash when inline scripts are required.
- Keep CSP domains minimal.
- Third-party analytics, chat widgets, and tag managers are high-risk code and need review.
- Coordinate app-level headers with CDN/reverse proxy/platform headers to avoid gaps or conflicts.

## Auth, Permissions, And Tenant Safety

- Treat authentication, session management, and authorization as separate concerns.
- Check permissions on backend, server-side DAL, or BFF.
- Client-side `canEdit` and `canDelete` are for UX only.
- Every multi-tenant request must carry trusted tenant context server-side.
- URL IDs do not prove ownership or tenant access.
- After logout, clear TanStack Query cache and user-scoped local state.
- Do not show previous user's data after account switch.
- Token refresh must handle concurrent requests without refresh loops.
- Handle `401` and `403` differently.
- Login redirects must preserve only safe return URLs.

## Env And Runtime Config

- Build-time env and runtime env are different problems.
- One Docker image for multiple environments cannot rely on changed `NEXT_PUBLIC_*` after build.
- Provide public runtime config through JSON endpoint or server-rendered config when values vary by environment.
- Validate runtime config.
- Read private env only server-side.
- Do not import private env modules into Client Components.
- Do not put secrets in `next.config.ts env`.
