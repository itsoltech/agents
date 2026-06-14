---
name: itsol-technical-planning
description: Use when preparing or reviewing ITSOL technical plans, implementation meetings, tech notes, architecture choices, spikes, estimates, rollout, rollback, migration, monitoring, or release planning for risky changes.
---

# ITSOL Technical Planning

Turn risky or cross-module work into an explicit technical plan before implementation or release.

## Process

1. Decide whether the change needs a technical meeting, tech notes, spike, rollout plan, rollback plan, or release owner decision.
2. Map affected modules, data, API contracts, cache, events, queues, integrations, permissions, infrastructure, observability, and QA needs.
3. Capture the selected approach, rejected alternatives, risks, open questions, owners, and verification plan.
4. Prefer the simplest safe vertical slice; avoid hidden scope, unbounded refactor, and unverifiable estimates.
5. For risky release work, document deployment order, post-release validation, monitoring, rollback, and responsible people.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
