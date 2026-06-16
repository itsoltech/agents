---
name: react-nextjs-api-cache-forms
description: "React 19 and Next.js API/cache/forms: TanStack Query v5, Hey API OpenAPI client, data fetching, SSR hydration, mutations, invalidation, forms, validation."
---

# React Next.js API Cache Forms

Implement, debug, or review React 19 and Next.js data flows with explicit ownership between OpenAPI-generated clients, API wrappers, Next.js server cache, TanStack Query client cache, mutations, forms, validation, and error mapping.

## Process

1. Inspect API contract source, generated client, query key factory, API wrapper, auth model, form library, cache policy, and tests before editing.
2. Use `itsol-current-tech-context` for TanStack Query, Hey API, Next.js data/cache, or form-library behavior.
3. Read [references/guide.md](references/guide.md) before changing API, cache, mutation, hydration, or form behavior.
4. Decide which layer owns each data category: Server Component/Next cache, Client Component/TanStack Query, form draft, URL state, realtime updates, or public runtime config.
5. Prefer generated Hey API code for OpenAPI-covered endpoints; handwritten wrappers should add auth, base URL, error mapping, telemetry, retry, or runtime config behavior.
6. Verify cache keys, invalidation, rollback, field errors, double submit, logout cleanup, and SSR/hydration privacy when relevant.

## Coordination

Use with `react-nextjs-implementation`, `react-nextjs-app-router-rendering`, `hey-api-openapi-codegen`, `hey-api-openapi-review`, `react-nextjs-quality-security`, and `security-api-input-review`.
