# React Next.js Debugging Guide

Use this guide to debug React 19 and Next.js issues with evidence before fixes.

## First Triage

Classify the symptom:

- server render failure;
- client render failure;
- hydration mismatch;
- Server/Client Component boundary issue;
- API/client wrapper failure;
- Next.js server cache issue;
- TanStack Query cache issue;
- routing/layout boundary issue;
- auth/session/tenant issue;
- CSS/responsive/layout shift issue;
- bundle/dependency/runtime config issue;
- deployment-only behavior.

Collect:

- route, component, commit/version, environment, user/tenant scope, and reproduction steps;
- browser console errors and stack traces;
- terminal/dev server or production logs;
- Network tab status, payload, cookies, redirects, CORS, cache headers, and request id;
- React/Next build output and TypeScript/lint output;
- TanStack Query key, status, enabled flag, stale state, invalidation, and mutation result;
- Next.js cache mode, tags, revalidation, `router.refresh()` behavior, and server response age;
- telemetry release, route, environment, correlation id, and web vitals when relevant.

## Hydration And Rendering

Check:

- server render and client render use the same data, locale, time zone, random IDs, media-query assumptions, and feature flags.
- `window`, `document`, localStorage, sessionStorage, media queries, or browser-only packages are not used in Server Components.
- Client Components do not import `.server.ts` modules, DB clients, secrets, or server-only helpers.
- Server Components pass only serializable props to Client Components.
- conditional rendering does not change DOM shape after hydration without a stable placeholder.
- fonts, images, skeletons, headers, and dynamic widgets reserve stable space.

Common causes:

- local time or `Date.now()` used during render.
- random IDs generated during render instead of stable IDs.
- storage value affects first client render.
- responsive branch changes DOM after hydration.
- `'use client'` moved too high and changes module graph.

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

## UI, Performance, And Bundle

Check:

- route has loading, empty, error, partial error, permission denied, and stale/refetching states where relevant.
- long text, empty lists, no permissions, slow API, and mobile viewport are handled.
- focus is not lost after dialog close, route transition, or validation error.
- heavy libraries are not imported into common Client Components.
- charts, editors, maps, PDFs, datepickers, and syntax highlighters are dynamically loaded when not needed for first paint.
- large lists are paginated or virtualized.
- bundle analyzer or Next.js analysis identifies unexpected large imports.
- React Profiler identifies actual expensive renders before memoization changes.

## Fix Discipline

- Fix the smallest root cause, not every adjacent smell.
- Prefer a regression test for cache keys, mutation invalidation, API error mapping, form validation, permission handling, or hydration-sensitive behavior.
- If tests are unavailable by repo policy, document manual reproduction and replacement verification.
- After a fix, verify production build behavior when the issue involves SSR, hydration, env, caching, images, routing, or dependencies.
