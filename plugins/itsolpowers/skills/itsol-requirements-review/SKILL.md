---
name: itsol-requirements-review
description: "Requirements review: stories, DoR, scope, roles, edge cases, MVP readiness."
---

# ITSOL Requirements Review

Check whether the work is clear, testable, scoped, and ready for implementation before code is written. During functional planning, use this skill as the project-manager interview engine: the agent is the PM, the user is the client, and the output is clarified Business Plan material plus blockers.

## Process

1. Identify the business problem, user, decision owner, expected outcome, and explicit out-of-scope items.
2. Classify the process formalism level by risk, size, number of people, data impact, security, and production impact.
3. Review story or technical-task structure, acceptance criteria, roles, permissions, data, UI/API/integration impact, and edge cases.
4. Check Definition of Ready; if it fails, recommend a spike, client question, refinement, prototype, data analysis, or tech notes instead of full implementation.
5. For vague or one-sentence functional requests, generate PM-style client questions and scenario options before any Business Plan is written. Cover business problem, current process, users/roles, data, states, integrations, UX/API behavior, nonfunctional needs, rollout, acceptance, QA, and decision ownership.
6. For functional work, feed the result into `itsol-functional-planning` as Business Plan material and require explicit user approval before technical planning.
7. Distinguish clarification from scope change and make blockers, assumptions, and owners explicit.

Read [references/guide.md](references/guide.md) first; it is a routing index for focused reference files. Then read only the sector files relevant to the current situation.
