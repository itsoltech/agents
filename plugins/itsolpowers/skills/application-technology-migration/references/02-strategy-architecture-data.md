# Strategy Architecture And Data

## Phase 3: Strategy Choice

Choose deliberately:

- **Refactor without technology change** when technology is supported and the issue is code organization, tests, or deployment.
- **Technology upgrade** when staying in the same technology family has lower risk than rewrite.
- **Strangler Fig** when production traffic can move gradually through routing, proxy, gateway, facade, tenant, route, or feature flag.
- **Branch by Abstraction** when changing an implementation behind an interface inside one system.
- **Parallel run** when old and new results can be compared without uncontrolled duplicate side effects.
- **Big bang** only for small systems with simple data, few integrations, accepted downtime, strong tests, and proven rollback.

If the user asks for a full rewrite, challenge the scope and propose the smallest useful slice unless the system is genuinely small and low risk.

## Phase 4: Migration Slicing

Good slices are:

- one business flow, module, endpoint group, UI path, job type, integration, document type, report type, user group, tenant, region, or batch process
- independently deployable and measurable
- protected by feature flag or routing switch where possible
- small enough to review, test, monitor, and roll back

Bad slices:

- "rewrite whole frontend"
- "rewrite whole backend"
- "move all reports"
- "create the new system"
- "move entire database"

Each slice needs:

- old behavior and new behavior
- accepted differences
- acceptance criteria
- characterization and contract tests
- rollout, rollback, telemetry, owner, QA decision, release decision

## Phase 5: Target Architecture

Document enough architecture to prevent accidental redesign:

- context diagram, modules, integrations, high-level data model
- request flow, async/job flow, error model, auth/authz, multi-tenancy
- config, telemetry, testing without infrastructure, deployment, rollback
- compatibility layer and stable contracts
- ADRs for major choices

Use ADRs for strategy, architecture boundaries, data migration strategy, routing/cutover model, and decommissioning decisions.

## Phase 6: Compatibility Contracts

Write contracts for:

- URL/routing, API request/response, HTTP codes, error format, auth headers, cookies, CORS, CSRF
- form fields, validations, date/number/currency/unit formats, sorting, filtering, pagination, encoding
- imports/exports, events, webhooks, queues, emails, notifications
- permissions, audit logs, cache keys, SEO metadata, deep links, links from emails and external systems

For API endpoints, capture endpoint, auth, request, success response, error response, side effects, idempotency, limits, and contract tests.

For UI views, capture route, access, loading/error/empty states, validation, save behavior, offline or slow API behavior, 401/403, breakpoints, keyboard access, translations, long text, and large data.

For data, capture owner, source of truth, fields, types, nullability, uniqueness, constraints, relations, schema version, migrations, sensitive fields, indexes, TTL, and backup rules.

## Phase 7: Data Strategy

Choose data strategy early:

- one-time migration for small or archival data with acceptable freeze window
- incremental backfill for large production datasets
- dual write only when operations are idempotent, failures are explicit, and reconciliation exists
- CDC for long-running sync when the team can operate and test it

Rules:

- migrations are idempotent, resumable, observable, dry-runnable, batched, and report errors
- validate with record counts, checksums, money totals, counts by status/tenant/date, random records, extremes, relations, missing IDs, duplicates, nulls, rounding, time zones, and linked files
- test on production-like data, anonymized where required
- define rollback or correction plan before release
