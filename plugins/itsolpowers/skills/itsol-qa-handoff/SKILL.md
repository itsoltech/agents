---
name: itsol-qa-handoff
description: "QA handoff: test notes, acceptance evidence, bug reports, release readiness."
---

# ITSOL QA Handoff

Make QA testable: provide scope, data, environments, risks, scenarios, and a clear pass/fail outcome.

## Process

1. Confirm QA has the story, acceptance criteria, PR, tech notes, environment, data, roles, accounts, config, and known limitations.
2. Build scenarios from risk: happy path, negative path, edge cases, regression, permissions, data boundaries, integrations, retries, and security smoke.
3. Use test-design techniques where useful: equivalence classes, boundary values, decision tables, state transitions, and exploratory testing.
4. For bugs, require environment, reproducible steps, actual versus expected result, data, attachments, impact, severity, priority, and release-blocking status.
5. For release readiness, check QA result, regression, support notes, monitoring, feature flags, rollback, and production verification needs.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
