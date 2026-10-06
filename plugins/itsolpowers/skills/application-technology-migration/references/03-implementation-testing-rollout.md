# Implementation Testing And Rollout

## Phase 8: Testing And QA

Select checks for actual migration contracts, data integrity, and rollback risk, starting with meaningful existing coverage. These are options, not a mandatory suite; run only permitted checks relevant to the slice:

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
- Use relevant existing checks; add tests only where material behavior or migration contracts lack useful coverage.
- Keep PRs small and reviewable.
- Separate refactor, behavior change, data migration, compatibility adapter, and new logic.
- Add telemetry and feature flags from the start.
- Document accepted differences.
- Keep old implementation until rollout and observation are complete.

Verify migration slices through relevant existing behavior and contract checks. Add characterization or regression tests only for material gaps, without freezing incidental legacy implementation details. Use `itsol-tdd-workflow` only on explicit user request; RED is not an implementation gate.

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
