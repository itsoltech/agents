---
name: tanstack-query-react-nextjs-implementation
description: "TanStack Query v5 React/Next.js implementation: QueryClient, query keys, query options, Hey API, SSR hydration, mutations, invalidation, optimistic updates, polling, realtime, auth cache, tests."
---

# TanStack Query React Next.js Implementation

Model React 19 and Next.js client-side server state explicitly with stable query keys, generated API contracts, safe cache invalidation, SSR-aware hydration, typed errors, and tested mutation behavior.

## Process

1. Inspect repo conventions, `.itsol.md`, React/Next/TanStack versions, generated OpenAPI client, auth model, query provider, tests, and CI before editing.
2. Use `itsol-current-tech-context` for TanStack Query, React, Next.js, Hey API, testing, or package-version decisions.
3. Read [references/guide.md](references/guide.md) before adding or changing QueryClient, query options, queries, mutations, SSR prefetch, invalidation, optimistic updates, realtime, or cache persistence.
4. Decide whether TanStack Query owns the data. Use it for interactive client-side server state, not local UI state, form draft state, or static server-only data.
5. Prefer generated Hey API query keys/options when available; otherwise create domain query key and query options factories.
6. Implement the smallest coherent data flow with explicit loading, empty, error, stale/refetching, pending mutation, and auth/tenant behavior.
7. Verify success, error, invalidation, cache cleanup, and SSR/hydration behavior with tests or documented replacement verification.

## Coordination

Use with `react-nextjs-api-cache-forms`, `react-nextjs-app-router-rendering`, `react-nextjs-quality-security`, `hey-api-openapi-codegen`, `hey-api-openapi-review`, `security-frontend-browser-review`, and `itsol-tdd-workflow`.
