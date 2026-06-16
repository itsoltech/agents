# React Next.js Review Guide

Use this guide to review React 19 and Next.js App Router changes. Report only actionable issues tied to changed behavior or meaningful risk.

## Coverage Map

For every relevant PR, check:

- whether Next.js is justified or a simple React SPA would be more appropriate for new projects;
- architecture and import boundaries;
- Server Components versus Client Components;
- Server Functions/Actions and Route Handlers;
- data fetching, Next.js cache, TanStack Query cache, and hydration;
- generated OpenAPI client and API wrapper;
- forms, validation, and mutation behavior;
- routing, layouts, loading/error/not-found boundaries;
- UI states, accessibility, responsive behavior, and layout shift;
- browser security, auth, permissions, CSP, cookies, env, and runtime config;
- bundle size, dependencies, React Compiler, and performance;
- tests, CI, QA evidence, and deployment impact.

## Architecture And Components

Review for:

- `app/` composing routes/layouts/providers instead of hiding domain logic.
- feature code containing API/model/schemas/components for a coherent business area.
- shared UI staying domain-free.
- no uncontrolled deep imports across features.
- no global bucket files that mix unrelated types or utilities.
- TypeScript strictness preserved.
- no `any`, unsafe casts, or ignored type errors masking API or user-input shape.
- component props expressing semantic intent rather than implementation toggles.
- local UI state, URL state, server state, form state, and auth/session state kept separate.

Red flags:

- `'use client'` at page/layout/root level because one child needs interaction.
- server-only modules imported into Client Components.
- browser-only modules imported into Server Components.
- non-serializable props passed from server to client.
- components mixing API calls, permissions, forms, layout, mapping, and UI primitives.

## App Router And Rendering

Review for:

- Server Components used by default where event handlers, state, effects, or browser APIs are not needed.
- Client Components placed as low in the tree as possible.
- secrets, private env, DB clients, and server tokens never crossing into client bundles.
- route groups used for organization, not authorization.
- dynamic route params and search params validated before API use.
- `loading.tsx`, `error.tsx`, and `not-found.tsx` used where the segment needs independent UX.
- route mutation navigation designed explicitly: stay, redirect, replace, optimistic transition, toast, or refresh.
- Route Handlers treated as backend code with input validation, auth, safe logging, and cache policy.
- Server Functions used for Next-specific forms/mutations, not as a replacement for shared HTTP contracts.

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

## Finding Standard

Each finding should include severity, file reference, exact behavior affected, why the current change is unsafe or incorrect, and a concrete fix or verification path.
