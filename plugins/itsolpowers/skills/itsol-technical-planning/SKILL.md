---
name: itsol-technical-planning
description: "Technical planning by workflow mode: architecture, decisions, rollout, rollback, monitoring, and verification."
---

# ITSOL Technical Planning

Resolve and preserve the complete task state through `itsol-workflow-mode` before applying any plan prerequisite or Decision Gate.

## Process

1. Confirm all seven workflow-state fields and applicable `.itsol.md` restrictions; propagate them into artifacts and handoffs.
2. Branch prerequisites by mode:
   - `governed`: for functional work, require the specific Business Plan to be explicitly approved; run the Technical Decision Gate and wait for the user's choice before writing the Technical Plan.
   - `autonomous-planned`: require the Business Plan to be `Ready for execution`; record feasible options, choose the documented recommendation, and continue without a user-decision pause.
   - `direct`: do not create or require a Technical Plan, Business Plan, Decision Gate, plan review, plan approval, plan path, or execution-mode approval; route ordinary technical choices directly to implementation.
3. For planned modes, map affected modules, data, contracts, cache, events, integrations, permissions, infrastructure, observability, QA, repo policy, and technology-version dependencies.
4. Load `itsol-current-tech-context` when framework, SDK, runtime, package, generated client, external API, language edition, database driver, or infrastructure tooling affects the decision.
5. Capture the selected approach, rejected alternatives, risks, open questions, owners, and verification plan. In `autonomous-planned`, ask only when equally plausible choices materially change behavior, permissions, data, rollout, or architecture.
6. Include concrete files/modules, repo-memory context, current-tech context, required ITSOL skills, logical branches, TDD entry points or documented exception, verification commands, and candidate subagent split.
7. For risky release work, document deployment order, validation, monitoring, rollback, and responsibility.
8. For planned modes, write new Technical Plans as `Draft`, self-review them, run Rubber Duck Review, and resolve material findings.
9. In `governed`, present the specific Technical Plan, obtain explicit user approval, change it to `Approved`, and ask for execution mode. Do not infer approval from the original request, `continue`, silence, or a generic agent statement.
10. In `autonomous-planned`, change a reviewed plan to `Ready for execution`, record delegated authorization honestly, choose execution mode, and continue without an approval pause. Never call it user-approved.

Read [references/guide.md](references/guide.md) first; then read only the sector files relevant to the situation.
