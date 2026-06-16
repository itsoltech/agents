# Planning Templates And Review

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
