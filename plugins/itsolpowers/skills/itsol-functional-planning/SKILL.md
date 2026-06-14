---
name: itsol-functional-planning
description: "Functional planning: repo Business Plan and Technical Plan, self-review, approval gate."
---

# ITSOL Functional Planning

Do not start functional implementation from a vague request. Clarify enough to produce two plans, get both approved, then ask how to execute.

## Process

1. Inspect the request and repo context before asking questions.
2. If the request is too broad for one coherent plan, propose a smaller first scope and defer later changes to separate plans after the first plan is implemented.
3. Run the embedded deep-planning interview: ask non-obvious follow-up questions about business logic, UX, technical constraints, tradeoffs, risks, and implementation concerns until the plan material is complete.
4. Write the Business Plan to a repo-local markdown file before requesting approval.
5. Self-review the Business Plan file for gaps, TODOs, contradictions, vague acceptance criteria, and unresolved questions; fix issues before asking for approval.
6. Stop and get explicit user approval for the Business Plan file.
7. Write the Technical Plan to a repo-local markdown file that references the approved Business Plan.
8. Self-review the Technical Plan file for missing files, missing skills, missing Current Tech Context, weak TDD steps, vague logic, TODOs, verification gaps, and unresolved risks; fix issues before asking for approval.
9. Stop and get explicit user approval for the Technical Plan file.
10. Ask whether execution should run with subagents or inline.
11. If the user chooses subagent-driven execution, proceed through `itsol-subagent-workflow` with both plan file paths.
12. If the user chooses inline execution, proceed to `itsol-feature-implementation` and `itsol-tdd-workflow` with both plan file paths.

Read [references/guide.md](references/guide.md) before presenting plans. If the task is not functional implementation, route to the narrower workflow instead.
