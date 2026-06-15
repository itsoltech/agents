---
name: itsol-task-intake
description: "Task intake: classify work, choose workflow, identify risks, route skills."
---

# ITSOL Task Intake

Classify the work before changing code. The first decision is the task mode, because features, bugs, reviews, incidents, and deployments require different evidence.

## Process

1. Read the user request and current repo context.
2. If root `.itsol.md` exists, load `itsol-repo-memory` and identify matched project policy for touched paths, especially TDD mode and verification commands.
3. Classify the task as requirements/refinement, functional feature, bug, technical planning, code review, self-review, QA handoff, deployment, incident, data/database change, or security-sensitive change.
4. Identify touched surfaces: UI, API, auth, tenant boundary, database, cache, files, jobs, external integrations, infrastructure, observability.
5. Decide whether independent surfaces should be handled by subagents, and keep integration decisions in the main thread.
6. For functional features or behavior changes, load `itsol-functional-planning` and `itsol-requirements-review`; vague, one-sentence, or underspecified requests must go through a PM-style Discovery Gate before any Business Plan is written.
7. In that Discovery Gate, treat the user as the client: require scenario and scope clarification, business problem, users/roles, data, edge cases, acceptance, rollout, and decision ownership when they affect the plan.
8. After Business Plan approval, always require a Technical Decision Gate before the Technical Plan. Ask the user to choose among implementation approaches or approve the single forced/recommended approach. Do not choose product behavior, UI/API scope, rollout, data migration, permissions, architecture, or UX only from assumptions or internet research.
9. Before requesting approval for Business Plan or Technical Plan, require Plan Self-Review and Rubber Duck Plan Review through the `itsol-self-review` subagent; material findings must be resolved first.
10. Plan approval must be explicit after the user saw the specific plan. Do not infer approval from the original task request, "continue", "direct user request", silence, or a generic main-agent statement.
11. For bugfixes, require evidence, Fix Decision Gate before plan writing, and an approved Technical Fix Plan before implementation.
12. Require Business Plan approval, Technical Plan approval, and execution-mode choice before implementation.
13. Load the focused ITSOL workflow and domain skills for those surfaces.
14. Ask only for missing information that cannot be inferred safely; if the missing information changes scope, behavior, architecture, rollout, data, permissions, or UX, ask before planning.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
