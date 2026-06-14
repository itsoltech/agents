# Application Technology Migration Reference

Use this reference for application rewrites and technology migrations. The goal is not to copy code into a new stack; the goal is to safely preserve or intentionally change business value, behavior, data, integrations, permissions, stability, and operations.

## Hard Rules

- Prefer incremental migration over big bang rewrite.
- Do not migrate because the old code is unpleasant or the new technology is fashionable.
- Do not mix technology migration with large product redesign unless the difference is explicitly approved.
- Do not remove old behavior until the new slice is verified, observable, reversible, and accepted.
- Do not treat data migration as a final script. Design data strategy, dry run, reconciliation, and rollback from the beginning.
- Do not implement a migration slice without characterization or contract coverage for critical old behavior.

## Phase 0: Migration Decision

Before planning implementation, confirm that rewrite is better than refactor, upgrade, replacing one module, or improving the development process.

Ask:

- what business problem the migration solves
- what cannot be fixed by refactor or upgrade
- what improves after migration
- what can get worse
- which functions are critical, daily, rare-but-important, unused, or removable
- who owns product, technology, QA, data, infrastructure, support, release, and risk
- what success looks like
- when migration should stop or change strategy

Decision artifact:

```markdown
# Migration Decision

## Problem
## Options
- refactor current system
- upgrade current technology
- rewrite selected module
- incremental migration
- big bang rewrite
- buy/replace with product

## Selected Option
## Rejected Options
## Accepted Risks
## Success Criteria
## Stop Criteria
## Owners
```

## Phase 1: Current-System Inventory

Inventory before proposing target architecture.

Features:

- feature name, business owner, user type, route or entry point
- usage frequency, criticality, dependencies, known bugs, workarounds
- inputs, outputs, business rules, performance, security, migration status

Data:

- source of truth, used tables/collections, duplicated/dead/computed data
- constraints, indexes, triggers, views, jobs, date/time/currency formats
- sensitive data, retention, backup/restore, files, data quality issues
- what must migrate, archive, be reconstructed, or be deleted

Integrations:

- system owner, protocol, auth, direction, data format, frequency
- retry, timeout, rate limit, idempotency, failure mode, sandbox, support contact
- informal integrations: CSV exports, email imports, SFTP folders, webhooks, manual reports, admin scripts, cron jobs, support SQL

Infrastructure:

- build, deploy, environments, secrets, domains, certificates, proxy, load balancing
- health checks, logs, metrics, alerts, backup, restore, rollback
- files, queues, cache, scheduler, host-specific dependencies

Security:

- auth, authz, roles, tenant isolation, sessions, tokens, CORS, CSRF, XSS
- password reset, MFA, audit log, sensitive data, encryption, secrets
- payload limits, rate limiting, uploads, webhooks, admin panels, internal APIs

## Phase 2: Behavior Map

For important flows, document current behavior from code, data, logs, metrics, support, users, tickets, audit logs, configs, deploy scripts, cron jobs, imports/exports, and operational SQL.

Capture:

- input, user steps, validations, permissions, database writes, integrations
- events, cache invalidation, side effects, emails, notifications, files
- audit logs, API responses, errors, retries, timeouts, business rollback

Add characterization tests for calculations, validations, permissions, parsing, exports, reports, status mapping, queues, retries, batch jobs, integrations, and edge cases. These tests describe current behavior; they do not need to approve that behavior as ideal.

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

## Phase 8: Testing And QA

Use more than normal feature tests:

- unit, integration, contract, characterization, regression, E2E
- snapshot tests for exports and reports
- migration and reconciliation tests
- performance/load, security, accessibility, visual regression
- canary monitoring and post-deploy smoke tests

QA should verify:

- new behavior matches old behavior or differences are accepted
- old links redirect or still work
- roles and tenants are isolated
- errors are readable
- save and refresh behavior is correct
- idempotency and retries do not duplicate side effects
- reports, exports, emails, events, and integrations remain correct
- rollback returns the user to a working path

## Phase 9: Implementation Rules

- Understand old behavior first.
- Do not improve product behavior during migration without approval.
- Start with a small slice.
- Add tests before or with implementation.
- Keep PRs small and reviewable.
- Separate refactor, behavior change, data migration, compatibility adapter, and new logic.
- Add telemetry and feature flags from the start.
- Document accepted differences.
- Keep old implementation until rollout and observation are complete.

Use `itsol-tdd-workflow` for migration slices. Prefer characterization tests and contract tests as RED gates.

## Phase 10: Rollout And Cutover

Choose rollout:

- internal rollout for smoke and first UX feedback
- tenant rollout for B2B risk control
- percentage rollout for large traffic
- route-based rollout for Strangler Fig
- blue-green for simple state
- canary for risky backend, API, performance, or infrastructure changes

Observe:

- error rate, p95/p99 latency, throughput, CPU, RAM, DB connections/query time
- cache hit rate, queue depth, failed jobs, retries, timeouts
- old/new output differences, user tickets, and business metrics

Stop rollout if error rate or latency crosses threshold, data isolation fails, data writes are wrong, events duplicate, integrations reject requests, critical functions break, QA finds a critical regression, reconciliation has unaccepted differences, or rollback fails.

Rollback plan must cover decision owner, flag off, routing reversal, worker stop, data written by new system, dual-write shutdown, support communication, old-system smoke check, and log capture.

## Phase 11: Operations And Observability

Emit:

- request count, error count, latency, dependency latency, DB query latency
- cache, queue, job duration, business events, migration progress
- reconciliation metrics, feature flag state, old/new target, correlation id, controlled tenant label, build version

Dashboards should show old/new traffic, errors, latency, active users/tenants, data migration status, parallel-run differences, queues, retries, alerts, deployments, and feature flags.

Logs must not include passwords, tokens, secrets, full sensitive payloads, connection strings, or auth headers.

## Phase 12: Security

Review:

- auth, authorization, role and tenant tests, IDOR
- CORS, CSRF, cookies, sessions, tokens, uploads, rate limiting
- input validation, API error leakage, stack traces
- dependencies, containers, secrets, logs, admin panel exposure
- webhook signatures, SSRF, encryption, audit logs
- stale endpoints and feature flags bypassing access control

Use the narrowest `security-*` skill for affected surfaces.

## Phase 13: Documentation And Communication

Document decisions, scope, accepted differences, feature parity, data mapping, contracts, rollout, rollback, operations, dashboards, alerts, known limitations, feature flags, and legacy removal status.

Customers should know what changes, what stays the same, risks, testing windows, needed decisions/data, old-system shutdown timing, and how to report issues.

The team needs slice order, owners, PR rules, testing rules, feature flag rules, data rules, release process, decision channel, risks, and rollout status.

## Phase 14: Decommissioning

Remove legacy only when:

- no traffic reaches old implementation
- logs confirm no use
- data is migrated or archived
- reconciliation is accepted
- support does not use old flow
- integrations are moved
- documentation is updated
- feature flags and routing are removed
- alerts and dashboards are moved
- backup/restore works for new system
- customer approved shutdown where needed

Before deleting, check legal retention, audit needs, historical access, archive format, encryption, backup, and approval owner.

## Required ITSOL Skills

Migration plans should list exact skills needed. Typical choices:

- `application-technology-migration` for migration strategy and slice governance
- `itsol-functional-planning` for each behavior-changing slice
- `itsol-tdd-workflow` for characterization, contract, regression, and implementation tests
- `itsol-subagent-workflow` for independent slice execution
- `itsol-code-review-workflow` and `itsol-self-review` for review gates
- technology implementation/review/debugging skills for old and new stacks
- `security-*` skills for auth, tenant, API/input, frontend/browser, secrets, supply chain, integrations
- `infra-*` skills for deployment, routing, edge protection, secrets, observability, backup/DR, capacity, production readiness
- database skills for PostgreSQL or MongoDB schema, query, operations, and review
- `itsol-qa-handoff` for QA scenarios and release handoff

## Migration Plan Template

```markdown
# Application Migration Plan

## Goal
## Scope
## Out Of Scope
## Migration Strategy
## Current System
## Target System
## Feature Inventory And Parity
## Migration Slices
## Compatibility Contracts
## Data Strategy
## Tests And QA
## Required ITSOL Skills
## Rollout
## Rollback
## Observability
## Security
## Risks And Mitigations
## Decommissioning
## Success Criteria
## Stop Criteria
```

## Feature Parity Matrix

```markdown
| Area | Feature | Old System | New System | Accepted Differences | Tests | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
```

Statuses: `not started`, `discovery`, `implementation`, `internal testing`, `QA`, `canary`, `production`, `deprecated legacy`, `removed legacy`.

## Risk Register

```markdown
| Risk | Area | Probability | Impact | Mitigation | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
```

## Self-Review Checklist

Before approving a migration plan or PR, check:

- the plan is one coherent slice or explicitly a roadmap
- rewrite is justified against refactor/upgrade alternatives
- old behavior is inventoried and protected by characterization or contract tests
- data migration strategy and reconciliation exist
- rollback covers code, routing, data, integrations, support, and communication
- feature flags/routing are designed before implementation
- observability distinguishes old and new behavior
- security and tenant boundaries are tested
- accepted differences are documented
- decommissioning has explicit conditions
