# UI Performance And Fix Discipline

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
