---
name: itsol-task-intake
description: Use when beginning an ITSOL engineering task and the agent must classify whether it is requirements/refinement work, a feature, bugfix, technical plan, review, deployment, incident, security-sensitive change, database change, QA handoff, or mixed workflow before choosing implementation steps.
---

# ITSOL Task Intake

Classify the work before changing code. The first decision is the task mode, because features, bugs, reviews, incidents, and deployments require different evidence.

## Process

1. Read the user request and current repo context.
2. Classify the task as requirements/refinement, feature, bug, technical planning, code review, self-review, QA handoff, deployment, incident, data/database change, or security-sensitive change.
3. Identify touched surfaces: UI, API, auth, tenant boundary, database, cache, files, jobs, external integrations, infrastructure, observability.
4. Decide whether independent surfaces should be handled by subagents, and keep integration decisions in the main thread.
5. Load the focused ITSOL workflow and domain skills for those surfaces.
6. Ask only for missing information that cannot be inferred safely.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
