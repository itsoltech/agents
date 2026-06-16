---
name: tanstack-query-react-nextjs-review
description: "TanStack Query v5 React/Next.js review: query keys, query functions, Hey API generated options, SSR hydration, mutations, invalidation, optimistic updates, auth cache, tenant isolation, errors, tests."
---

# TanStack Query React Next.js Review

Review React 19 and Next.js TanStack Query changes for stable keys, correct query functions, generated API usage, SSR/hydration safety, mutation side effects, cache invalidation, optimistic rollback, auth/tenant cache safety, errors, performance, and tests.

## Process

1. Inspect the diff, surrounding query factories, generated API client, QueryClient provider, auth/session flow, route/server component boundary, tests, and CI config before applying checklist items.
2. Use `itsol-current-tech-context` for findings that depend on TanStack Query, React, Next.js, Hey API, or testing package versions.
3. Read [references/guide.md](references/guide.md) before producing findings.
4. Build a coverage map: ownership, QueryClient, query keys/options, API client/errors, SSR/hydration, mutations, invalidation, optimistic updates, realtime, auth/logout/tenant, security, performance, tests, and CI.
5. Lead with concrete findings by severity, with file reference, affected behavior, and required fix or verification.
6. Treat missing query-key scope, missing invalidation, stale auth cache, and unsafe hydration as correctness or security risks, not style issues.

## Large PR Subagent Review

For large React/Next PRs touching TanStack Query, use focused subagents before the final verdict. Split review by query keys/options, API/generated client, SSR/hydration, mutations/invalidation, security/auth/tenant, UI states, performance/realtime, and tests/QA as relevant.

## Coordination

Use with `react-nextjs-review`, `react-nextjs-api-cache-forms`, `react-nextjs-app-router-rendering`, `react-nextjs-quality-security`, `hey-api-openapi-review`, and `security-frontend-browser-review`.
