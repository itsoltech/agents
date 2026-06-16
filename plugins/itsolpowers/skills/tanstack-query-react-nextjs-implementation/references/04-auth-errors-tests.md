# Auth Errors And Tests

## Auth, Security, Errors

- Authorization belongs on the backend, not in hooks.
- Do not put tokens, full auth/session objects, functions, or secrets into query keys.
- Clear cache on logout/session expiration through `queryClient.clear()`.
- Clear or remove scoped queries on tenant/user switch.
- Do not show stale cached data after `401`, `403`, logout, or tenant change.
- Retry network and some 5xx errors; do not retry validation, `401`, `403`, `404`, `409`, or `422`.
- Do not swallow query errors with `catch(() => null)`.
- Map `422` to field errors and `409` to conflict state.

## Tests And CI

- Use a fresh `QueryClient` per test.
- Disable retries in tests that assert errors.
- Prefer MSW or API-client boundary mocks over mocking `useQuery`.
- Test loading, success, empty, error, refetch, invalidation, optimistic rollback, `401/403`, logout clearing, filter key changes, and tenant switch.
- CI should run lint, typecheck, tests, Playwright where supported, OpenAPI generation/check, and generated-client drift checks.
- Include `@tanstack/eslint-plugin-query` and enforce stable query client, exhaustive deps, no unstable query results in dependencies, and correct infinite query options.
