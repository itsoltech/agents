# React Next.js Quality Security Guide

Use this guide for security, auth, permissions, CSP, env, runtime config, accessibility, performance, tests, CI, QA, and production readiness in React 19 and Next.js applications.

## Security Baseline

- Client code is public.
- Secrets never go to the client bundle.
- `NEXT_PUBLIC_*` values are visible to users.
- Authorization is always enforced server-side.
- Hidden buttons are UX, not security.
- API data, forms, storage, query params, cookies, and websocket events are untrusted.
- Avoid `dangerouslySetInnerHTML`; if required, use a trusted sanitizer and security review.
- Do not render backend-provided HTML without sanitization.
- Use CSP as defense-in-depth against XSS impact.
- Do not store long-lived tokens in localStorage.
- Session cookies should be `HttpOnly`, `Secure`, `SameSite`, and have sane `Path`/`Domain`.
- Cookie-authenticated mutations need CSRF protection.
- Validate `Origin`/`Referer` for sensitive mutations when the model requires it.
- Validate uploads server-side: type, size, extension, path, scanning, and content sniffing.
- Do not log full payloads with PII, tokens, or passwords.
- Do not show raw backend errors to users.
- Middleware/proxy is not the only authorization layer for data.

## CSP And Headers

Minimum direction:

- `Content-Security-Policy`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- `Strict-Transport-Security` for HTTPS;
- secure cookies.

Rules:

- Test CSP in report-only before enforcing strict policy.
- Avoid `unsafe-inline` when possible.
- Use nonce or hash when inline scripts are required.
- Keep CSP domains minimal.
- Third-party analytics, chat widgets, and tag managers are high-risk code and need review.
- Coordinate app-level headers with CDN/reverse proxy/platform headers to avoid gaps or conflicts.

## Auth, Permissions, And Tenant Safety

- Treat authentication, session management, and authorization as separate concerns.
- Check permissions on backend, server-side DAL, or BFF.
- Client-side `canEdit` and `canDelete` are for UX only.
- Every multi-tenant request must carry trusted tenant context server-side.
- URL IDs do not prove ownership or tenant access.
- After logout, clear TanStack Query cache and user-scoped local state.
- Do not show previous user's data after account switch.
- Token refresh must handle concurrent requests without refresh loops.
- Handle `401` and `403` differently.
- Login redirects must preserve only safe return URLs.

## Env And Runtime Config

- Build-time env and runtime env are different problems.
- One Docker image for multiple environments cannot rely on changed `NEXT_PUBLIC_*` after build.
- Provide public runtime config through JSON endpoint or server-rendered config when values vary by environment.
- Validate runtime config.
- Read private env only server-side.
- Do not import private env modules into Client Components.
- Do not put secrets in `next.config.ts env`.

## Accessibility And UX Quality

- Inputs need labels or accessible names.
- Clickable actions should use `button`; navigation should use `a`/Link with href.
- Avoid `div` buttons unless full keyboard and ARIA behavior is implemented.
- Focus state must be visible.
- Dialogs trap focus and return focus after close.
- Menus, comboboxes, tabs, and tooltips should use proven accessible primitives or correct WAI-ARIA patterns.
- Color cannot be the only information channel.
- Field errors must be readable by assistive tech.
- Use `aria-live` only for dynamic messages users need to hear.
- Respect `prefers-reduced-motion`.
- Test keyboard flows for critical actions.

## Performance And Stability

Measure before optimizing. Check:

- bundle size and client JavaScript amount;
- number and placement of Client Components;
- request waterfalls;
- Core Web Vitals;
- hydration cost;
- API payload size;
- re-render count;
- table, list, form, chart, editor, map, and datepicker cost;
- dependency size and transitive dependencies.

Rules:

- Use Server Components to reduce client JS where possible.
- Do not place `'use client'` high in the tree without a reason.
- Load heavy client libraries dynamically when not required for first render.
- Use `next/image` where appropriate and define image dimensions or stable `fill` containers.
- Avoid client request waterfalls that server composition can eliminate.
- Do not render thousands of rows without pagination or virtualization.
- React Compiler may reduce manual memoization but does not fix wrong data architecture.
- Analyze bundle before adding large dependencies.

## Layout Shift

- Images need known dimensions or stable aspect ratio.
- Skeletons should match final content height.
- Fonts should use Next.js mechanisms or controlled fallbacks.
- Ads, iframes, maps, embeds, and widgets need reserved space.
- Conditional components should not push layout after hydration.
- Header height should not change after data load.
- Toasts/modals should not shift main content.
- Avoid server/client render differences that create hydration mismatch and visual jumps.

## Tests And QA

Minimum testing surface:

- unit tests for pure functions, mappers, validators, permissions;
- component tests for interactive UI;
- integration tests for forms, query/mutation hooks, and API wrappers;
- E2E for primary business flows;
- accessibility checks for critical components;
- visual regression for design systems when valuable;
- OpenAPI contract tests through generated client and typecheck.

Test behavior, not implementation. Use roles, labels, text, and user actions rather than CSS classes. Mock at network/API-client boundary. Cover loading, error, empty, success, permissions, double submit, retry, invalidation, logout cleanup, deep links, and refresh behavior where relevant.

E2E should cover login/logout, protected routing, primary workflows, create/edit/delete, validation, API error, reload on deep link, mobile viewport, and keyboard basics. Prefer production build E2E when possible.

## CI And Release

Minimal pipeline:

```bash
pnpm install --frozen-lockfile
pnpm openapi:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

For larger projects, add audit, dependency cleanup, bundle analysis, visual regression, or focused Playwright projects as appropriate.

Rules:

- `build` must include typecheck.
- generated client must be current.
- CI cache cannot hide generated-code drift.
- lockfile is part of review.
- dependency/framework upgrades should have separate or clearly scoped diffs.
- Production build should be verified after framework upgrades, env changes, caching changes, image changes, routing changes, or dependency updates.

## Definition Of Done For A View

A React/Next view is ready when it:

- has loading, empty, error, and success states;
- handles permissions;
- works after reload and deep link;
- works on mobile and desktop;
- does not assume backend fields that are not guaranteed;
- uses generated API client when endpoint is in OpenAPI;
- has complete query keys;
- updates or invalidates cache after mutations;
- displays errors clearly;
- does not leak secrets or excessive data;
- has tests for the main flow or documented replacement verification;
- passes lint, typecheck, tests, and build according to repo policy;
- does not add a large dependency without justification.
