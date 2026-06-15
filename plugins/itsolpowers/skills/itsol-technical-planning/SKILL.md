---
name: itsol-technical-planning
description: "Technical planning: architecture, spikes, rollout, rollback, monitoring, approval gates."
---

# ITSOL Technical Planning

Turn risky or cross-module work into an explicit technical plan before implementation or release.

## Process

1. For functional work, confirm the Business Plan markdown file has already been approved before writing the Technical Plan.
2. If `.itsol.md` exists, load `itsol-repo-memory` and apply matched project policy for touched paths.
3. Map affected modules, data, API contracts, cache, events, queues, integrations, permissions, infrastructure, observability, QA needs, repo policy, and technology-version dependencies.
4. Load `itsol-current-tech-context` when the plan depends on frameworks, SDKs, runtimes, packages, generated clients, external APIs, language editions, database drivers, or infrastructure tooling.
5. Before writing the plan, ask the user to choose among implementation approaches or approve the single forced/recommended approach.
6. Capture the selected approach, rejected alternatives, risks, open questions, owners, and verification plan.
7. Prefer the simplest safe vertical slice; avoid hidden scope, unbounded refactor, and unverifiable estimates.
8. Include concrete files/modules, repo memory context, current tech context, required ITSOL skills, logical branches, TDD entry points or repo-policy TDD exception, verification commands, candidate subagent split, and a proposed subagent concurrency limit when subagent-driven execution is likely.
9. For risky release work, document deployment order, post-release validation, monitoring, rollback, and responsible people.
10. Write new Technical Plans as `Draft`; never mark a plan `Approved` before the user has seen that specific plan.
11. Require explicit user approval of the Technical Plan after presenting its path and summary, then ask whether execution should be subagent-driven or inline.
12. Do not infer approval from "direct user request", the original task request, `continue`, silence, or a generic main-agent statement.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
