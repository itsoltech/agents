---
name: itsol-functional-planning
description: "Functional planning: mandatory interview, Business/Technical Plans, self-review, approvals."
---

# ITSOL Functional Planning

Do not start functional implementation from a vague request. Treat the user as the client and the agent as a project manager during discovery: interview for business intent, scope, roles, data, risks, and acceptance before writing the Business Plan. After Business Plan approval, interview for technical approach options before writing the Technical Plan. Before asking approval for either plan, run self-review and then a subagent Rubber Duck Review. Then get both plans approved and ask how to execute.

## Process

1. Inspect the request and repo context before asking questions.
2. If the user's request is a short brief, one sentence, a goal without acceptance criteria, or otherwise incomplete, do not write the Business Plan yet. Start a Discovery Gate instead.
3. In the Discovery Gate, load `itsol-requirements-review` and use its client-interview/Definition-of-Ready guidance to summarize what is known, list major unknowns, propose several plausible product scenarios, and ask the user which scenario or mix of scenarios matches the goal.
4. Ask about scope boundaries before planning: backend only, frontend only, full-stack, API/client contract, data migration, permissions, rollout, compatibility, observability, and QA expectations where relevant.
5. If the request is too broad for one coherent plan, propose a smaller first scope and defer later changes to separate plans after the first plan is implemented.
6. Run the embedded deep-planning interview: ask non-obvious follow-up questions about business logic, UX, technical constraints, tradeoffs, risks, and implementation concerns until the plan material is complete.
7. Do not replace unanswered product choices with internet-found defaults or your preferred solution. Use current documentation to inform options, then ask the user to choose unless the answer is already fixed by repo conventions or explicit user requirements.
8. Write the Business Plan to a repo-local markdown file only after the Discovery Gate has enough confirmed answers to avoid guessing.
9. Self-review the Business Plan file for gaps, TODOs, contradictions, vague acceptance criteria, unapproved assumptions, and unresolved questions; fix issues or ask more questions before requesting approval.
10. Run a Rubber Duck Plan Review with a subagent using `itsol-self-review`. The subagent must read the Business Plan as a critical reviewer and return gaps, hidden assumptions, weak acceptance criteria, missing edge cases, and blocking questions.
11. Resolve Rubber Duck findings by updating the plan or asking the user targeted questions. Do not request approval while material findings remain unresolved.
12. Stop and get explicit user approval for the Business Plan file.
13. Before writing the Technical Plan, always run a Technical Decision Gate: inspect repo constraints, verify current technology context when relevant, present feasible technical approach options or the single forced approach, recommend one, and ask the user to choose or approve the approach.
14. Write the Technical Plan to a repo-local markdown file that references the approved Business Plan and confirmed technical approach.
15. Self-review the Technical Plan file for missing files, missing skills, missing Current Tech Context, weak TDD steps, vague logic, unapproved technical choices, TODOs, verification gaps, and unresolved risks; fix issues before asking for approval.
16. Run a Rubber Duck Plan Review with a subagent using `itsol-self-review`. The subagent must read the Technical Plan as a critical reviewer and return implementation gaps, weak logic, missing files, missing skills, testing holes, rollout risks, and blocking questions.
17. Resolve Rubber Duck findings by updating the plan or asking the user targeted questions. Do not request approval while material findings remain unresolved.
18. Stop and get explicit user approval for the Technical Plan file.
19. Ask whether execution should run with subagents or inline.
20. If the user chooses subagent-driven execution, proceed through `itsol-subagent-workflow` with both plan file paths.
21. If the user chooses inline execution, proceed to `itsol-feature-implementation` and `itsol-tdd-workflow` with both plan file paths.

Read [references/guide.md](references/guide.md) before presenting plans. If the task is not functional implementation, route to the narrower workflow instead.
