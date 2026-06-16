# Security Documentation And Decommissioning

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
