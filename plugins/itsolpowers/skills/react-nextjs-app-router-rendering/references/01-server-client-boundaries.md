# Server Client Boundaries

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
