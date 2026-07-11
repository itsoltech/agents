---
name: tanstack-query-react-nextjs-debugging
description: "TanStack Query v5 React/Next.js debugging: stale data, duplicate requests, query keys, disabled queries, invalidation, optimistic bugs, hydration mismatch, logout cache leaks, tenant cache, realtime, performance."
---

# TanStack Query React Next.js Debugging

For bugfix authorization and plan prerequisites, defer to `itsol-workflow-mode`; retain evidence, root-cause analysis, TDD/replacement verification, and final review in every mode.

Trace React 19 and Next.js TanStack Query failures from query key to query function, API error mapping, cache state, invalidation, SSR hydration, auth scope, and rendered UI before changing behavior.

## Process

1. State expected behavior, actual behavior, affected route/component, user/tenant context, environment, and smallest reproducible symptom.
2. Gather evidence from React Query Devtools, Network tab, browser console, server logs, request ids, package versions, generated API output, tests, and route/server component code.
3. Use `itsol-current-tech-context` when symptoms depend on TanStack Query, React, Next.js, Hey API, or package versions.
4. Read [references/guide.md](references/guide.md), then classify the failure: key, query function, enabled/dependency, invalidation, mutation, optimistic update, hydration, auth/tenant cache, realtime, persistence, or performance.
5. Fix one root cause and verify with a regression test or documented replacement verification.
6. Use `itsol-bug-debugging`; in `governed`, require an approved Technical Fix Plan before implementation, while autonomous/direct prerequisites come from `itsol-workflow-mode`.

## Coordination

Use with `react-nextjs-debugging`, `react-nextjs-api-cache-forms`, `react-nextjs-app-router-rendering`, `react-nextjs-quality-security`, `hey-api-openapi-contract-debugging`, and `security-frontend-browser-review`.
