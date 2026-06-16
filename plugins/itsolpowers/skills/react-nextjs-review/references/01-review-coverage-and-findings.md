# Review Coverage And Findings

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

## Finding Standard

Each finding should include severity, file reference, exact behavior affected, why the current change is unsafe or incorrect, and a concrete fix or verification path.
