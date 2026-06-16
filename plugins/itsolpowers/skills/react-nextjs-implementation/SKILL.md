---
name: react-nextjs-implementation
description: "React 19 and Next.js implementation: App Router, Server/Client Components, TypeScript, architecture, UI, API, forms, cache, security, performance, tests."
---

# React Next.js Implementation

Build React 19 and Next.js frontend changes around clear rendering boundaries, typed contracts, explicit cache ownership, accessible UI states, secure server/client separation, and measurable verification.

## Process

1. Inspect repo conventions, `.itsol.md` policy, package versions, routing mode, generated API setup, testing commands, and deployment target before introducing structure.
2. Use `itsol-current-tech-context` for React, Next.js, TanStack Query, Hey API, Tailwind, testing, or package-version decisions.
3. Read [references/guide.md](references/guide.md), then load focused skills when the change touches App Router/rendering, API/cache/forms, UI/UX, quality/security, or review.
4. Decide whether the app needs Next.js or a simpler React SPA, then choose the smallest architecture that matches product scope.
5. Keep `app/` thin: routing, layouts, providers, boundaries, and page composition. Put domain behavior in feature modules and shared primitives in `shared`.
6. Prefer Server Components by default and move Client Components as low in the tree as possible.
7. Define loading, empty, error, permission, stale/refetching, mobile, and keyboard behavior before editing visible UI.
8. Use TDD where repo policy supports it; otherwise document the `.itsol.md` exception and run replacement verification.

## Coordination

Use with `itsol-functional-planning`, `itsol-tdd-workflow`, `react-nextjs-app-router-rendering`, `react-nextjs-api-cache-forms`, `react-nextjs-quality-security`, `ui-ux-workflow`, `hey-api-openapi-*`, and `security-frontend-browser-review` as relevant.
