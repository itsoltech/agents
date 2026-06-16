# React Next.js App Router Rendering Guide

Use this guide for App Router, Server Components, Client Components, Server Functions, Route Handlers, and rendering/cache decisions.

## Server Components

Use Server Components when a component:

- fetches data server-side;
- uses secrets, server-side tokens, private env, or private connection strings;
- renders static or partially static UI;
- does not need event handlers;
- does not use `useState`, `useEffect`, `localStorage`, `window`, or `document`;
- should reduce client JavaScript;
- composes a page from data and smaller Client Components.

Rules:

- Keep `page.tsx` and `layout.tsx` server-side unless there is a concrete client requirement.
- Do not add `'use client'` to a large subtree because one child is interactive.
- Push interactivity down the tree.
- Pass only serializable data from server to client.
- Do not pass functions, classes, DB clients, connection pools, or objects with methods to Client Components.
- Keep secret-reading modules server-only, commonly `.server.ts`.
- Keep browser-only modules client-only, commonly `.client.ts`.

## Client Components

Use Client Components when a component:

- has event handlers;
- uses local state, effects, refs tied to browser behavior, or browser APIs;
- handles highly interactive forms;
- uses TanStack Query client-side;
- uses websockets or SSE client-side;
- depends on DOM-bound UI libraries.

Rules:

- Add `'use client'` only when required.
- Do not make the whole route a Client Component by default.
- Pass minimal data from server to client.
- Move larger client logic into custom hooks and model functions.
- Split large interactive components into domain logic, UI primitives, and presentational pieces.
- Avoid importing heavy libraries into components rendered on every route.

## Server Functions And Actions

Use Server Functions when:

- the mutation belongs to a Next.js form;
- progressive enhancement matters;
- the logic is specific to this Next.js app;
- no mobile/CLI/partner/shared client needs the endpoint;
- the form does not need a shared OpenAPI contract.

Use HTTP API and generated clients when:

- the endpoint is a public or internal backend contract;
- multiple clients use the API;
- backend is a separate application;
- versioning, OpenAPI, SDK generation, endpoint monitoring, and stable contracts matter;
- TanStack Query mutations should manage invalidation.

Rules:

- Validate input server-side.
- Check auth and authorization server-side.
- Do not trust hidden fields.
- Return field and general errors in a UI-safe model.
- Revalidate Next.js cache when server-cached data changes.
- Coordinate with TanStack Query invalidation when client cache also owns the data.

## Route Handlers And BFF

Use Route Handlers when Next.js acts as a Backend for Frontend:

- hide private backend details from the browser;
- add cookie/session/token-exchange or proxy auth;
- compose multiple backend calls for UI;
- normalize frontend-facing errors and telemetry;
- stream responses or handle webhooks server-side.

Do not use Route Handlers to:

- proxy 1:1 without adding value;
- duplicate an existing backend contract;
- create a second backend without owner, tests, monitoring, and security review;
- bypass backend authorization.

Rules:

- Validate input.
- Require auth and server-side permission checks for mutations.
- Do not return stack traces to clients.
- Do not log full sensitive payloads.
- Choose dynamic, cached, revalidated, or private behavior for every `GET`.
- Do not run long jobs in request-response without queueing or timeout strategy.

## Routing, Layouts, And Boundaries

- Use route groups for organization and layout composition, not as security boundaries.
- Validate dynamic route params before API use.
- Treat search params as user input.
- Add `loading.tsx` where requests can visibly wait.
- Add `error.tsx` where a route segment needs isolated recovery.
- Add `not-found.tsx` for dynamic resource routes.
- Keep root layout lean; do not fetch heavy data there unless every route needs it.
- Design navigation after mutation explicitly: stay, redirect, replace, optimistic transition, toast, or refresh.
- Do not use navigation alone as save confirmation.

## Cache And Hydration

- Use Next.js cache for server-side data and render caching.
- Use TanStack Query for client-side server state, filters, pagination, polling, live events, optimistic updates, and refetching.
- Do not fetch the same data in Server Components and TanStack Query without a hydration or revalidation plan.
- Do not cache private user/tenant data globally without scope.
- Avoid `router.refresh()` as a generic mutation hammer.
- Remember that client-side invalidation does not automatically invalidate Next.js server cache.
- For SSR/hydration with TanStack Query, create one server QueryClient per request and hydrate only client-safe data.

## Hydration Risk Checklist

- no time/random/locale/media-query mismatch in initial render;
- no storage-dependent branch changing initial DOM;
- no browser-only package imported server-side;
- no server-only package imported client-side;
- no non-serializable props crossing server/client boundary;
- skeletons, images, fonts, embeds, and headers have stable dimensions.
