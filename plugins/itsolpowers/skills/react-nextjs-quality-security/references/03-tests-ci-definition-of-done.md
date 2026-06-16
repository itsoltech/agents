# Tests CI And Definition Of Done

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
