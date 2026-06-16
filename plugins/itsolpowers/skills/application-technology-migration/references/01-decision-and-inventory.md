# Decision And Inventory

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
