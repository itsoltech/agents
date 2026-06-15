---
name: itsol-technical-planning
description: "Technical planning: architecture, spikes, rollout, rollback, monitoring, approval gates."
---

# ITSOL Technical Planning

Turn risky or cross-module work into an explicit technical plan before implementation or release.

## Process

1. For functional work, confirm the Business Plan markdown file has already been approved before writing the Technical Plan.
2. Map affected modules, data, API contracts, cache, events, queues, integrations, permissions, infrastructure, observability, QA needs, and technology-version dependencies.
3. Load `itsol-current-tech-context` when the plan depends on frameworks, SDKs, runtimes, packages, generated clients, external APIs, language editions, database drivers, or infrastructure tooling.
4. Before writing the plan, ask the user to choose among implementation approaches or approve the single forced/recommended approach.
5. Capture the selected approach, rejected alternatives, risks, open questions, owners, and verification plan.
6. Prefer the simplest safe vertical slice; avoid hidden scope, unbounded refactor, and unverifiable estimates.
7. Include concrete files/modules, current tech context, required ITSOL skills, logical branches, TDD entry points, verification commands, candidate subagent split, and a proposed subagent concurrency limit when subagent-driven execution is likely.
8. For risky release work, document deployment order, post-release validation, monitoring, rollback, and responsible people.
9. Write new Technical Plans as `Draft`; never mark a plan `Approved` before the user has seen that specific plan.
10. Require explicit user approval of the Technical Plan after presenting its path and summary, then ask whether execution should be subagent-driven or inline.
11. Do not infer approval from "direct user request", the original task request, `continue`, silence, or a generic main-agent statement.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
