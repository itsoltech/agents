# API Client And OpenAPI

## Hey API And OpenAPI

- Keep generated code in one directory such as `src/shared/api/generated`.
- Never manually edit generated output.
- Pin generator version.
- Make OpenAPI spec and generated client diffs visible in PRs.
- If a spec is fetched from URL, CI needs a stable tag, version, snapshot, or artifact.
- Do not generate from a random local backend without a reviewable diff.
- Use manual wrappers only for application behavior: auth, base URL, error mapping, telemetry, retry, runtime config.
- If an endpoint is missing from OpenAPI, fix the spec instead of writing one-off `fetch`.
- Treat generated TanStack Query keys as source of truth.

Useful scripts:

- `openapi:generate`
- `openapi:check`
- `typecheck`
- `lint`
- `test`
- `test:e2e`

## API Client Wrapper

The shared API client should handle:

- `baseUrl`;
- credentials, cookies, or tokens;
- `Accept`, `Content-Type`, and `X-Request-Id`;
- HTTP error mapping;
- `401` and `403` behavior;
- telemetry and correlation id;
- request cancellation through `AbortSignal`;
- runtime config when one build runs in multiple environments.

Rules:

- Do not configure API clients in each component.
- Prefer HttpOnly cookies over long-lived localStorage tokens when possible.
- Do not add cross-origin `Authorization` without reviewing CORS and CSRF.
- `fetch` does not throw on HTTP 4xx/5xx; wrapper must map bad statuses.
- Error responses should have a stable shape such as ProblemDetails or `ApiError`.
- Retry must depend on error type.
- Mutating endpoints need idempotency keys when retry can repeat the operation.
