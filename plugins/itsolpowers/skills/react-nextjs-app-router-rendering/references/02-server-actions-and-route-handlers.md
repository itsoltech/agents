# Server Actions And Route Handlers

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
