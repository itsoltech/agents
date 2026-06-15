---
name: itsol-task-intake
description: "Task intake: classify work, choose workflow, identify risks, route skills."
---

# ITSOL Task Intake

Classify the work before changing code. The first decision is the task mode, because features, bugs, reviews, incidents, and deployments require different evidence.

## Process

1. Read the user request and current repo context.
2. Classify the task as requirements/refinement, functional feature, bug, technical planning, code review, self-review, QA handoff, deployment, incident, data/database change, or security-sensitive change.
3. Identify touched surfaces: UI, API, auth, tenant boundary, database, cache, files, jobs, external integrations, infrastructure, observability.
4. Decide whether independent surfaces should be handled by subagents, and keep integration decisions in the main thread.
5. For functional features or behavior changes, load `itsol-functional-planning` and `itsol-requirements-review`; vague, one-sentence, or underspecified requests must go through a PM-style Discovery Gate before any Business Plan is written.
6. In that Discovery Gate, treat the user as the client: require scenario and scope clarification, business problem, users/roles, data, edge cases, acceptance, rollout, and decision ownership when they affect the plan.
7. After Business Plan approval, require a Technical Decision Gate before the Technical Plan when multiple implementation approaches are possible. Do not choose product behavior, UI/API scope, rollout, data migration, permissions, architecture, or UX only from assumptions or internet research.
8. Require Business Plan approval, Technical Plan approval, and execution-mode choice before implementation.
9. Load the focused ITSOL workflow and domain skills for those surfaces.
10. Ask only for missing information that cannot be inferred safely; if the missing information changes scope, behavior, architecture, rollout, data, permissions, or UX, ask before planning.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
