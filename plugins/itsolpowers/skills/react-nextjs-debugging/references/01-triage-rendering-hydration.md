# Triage Rendering And Hydration

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
