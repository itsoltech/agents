# Architecture And Rendering

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
