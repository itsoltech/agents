---
name: application-technology-migration
description: Use when planning, reviewing, or executing an application rewrite or technology migration, such as moving frontend, backend, desktop app, API, worker, integration, library, database access layer, infrastructure layer, monolith, or module from one technology or architecture to another while preserving business behavior, data, contracts, security, rollout safety, observability, and decommissioning.
---

# Application Technology Migration

Treat a rewrite as a product, technical, and operational migration. Do not start from code generation. First prove why migration is the right option, identify the smallest safe slice, preserve current behavior with characterization and contract tests, and plan rollout and rollback before implementation.

## Process

1. Clarify the migration driver: business problem, current technology, target technology, users, data, integrations, operational constraints, and why refactor or upgrade is insufficient.
2. Apply a scope gate. If the request says "rewrite the app" or spans unrelated modules, propose a smaller first migration slice and defer the rest into later plans.
3. Inventory the current system: features, data, integrations, infrastructure, security, support workarounds, hidden jobs, reports, exports/imports, and production behavior.
4. Map current behavior with characterization tests and contract tests before proposing replacement behavior.
5. Choose a migration strategy: refactor, upgrade, Strangler Fig, Branch by Abstraction, parallel run, or big bang only when risk is low and rollback is proven.
6. Write or update a migration plan file in the repo, including feature parity, slice plan, data plan, rollout, rollback, observability, security, risks, success criteria, stop criteria, and decommissioning.
7. Self-review the migration plan for hidden scope, missing contracts, missing data strategy, weak rollback, missing skills, untested behavior, and unresolved operational risk.
8. For implementation, route each approved slice through `itsol-functional-planning` or `itsol-bug-debugging` as appropriate, then `itsol-tdd-workflow`, focused domain skills, review skills, and `itsol-subagent-workflow` when the slice is subagent-driven.

Read [references/guide.md](references/guide.md) before making migration recommendations. If the task is only a small feature or bug in an existing migration, route to the narrower skill after checking migration constraints.
