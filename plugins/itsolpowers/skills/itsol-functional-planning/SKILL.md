---
name: itsol-functional-planning
description: Use before implementing any ITSOL functional task, feature, behavior change, UI flow, endpoint, integration, or product logic change when the agent must clarify requirements, produce a business plan and a technical plan, get explicit user approval for both, and choose subagent or inline execution before coding.
---

# ITSOL Functional Planning

Do not start functional implementation from a vague request. Clarify enough to produce two plans, get both approved, then ask how to execute.

## Process

1. Inspect the request and repo context before asking questions.
2. Ask for missing business or product information that cannot be inferred safely.
3. Produce a Business Plan that describes the logical behavior, scope, users, acceptance criteria, out-of-scope items, risks, and QA expectations.
4. Stop and get explicit user approval for the Business Plan.
5. Produce a Technical Plan that lists files or modules to touch, data flow, contracts, branches/conditions, tests, TDD entry points, and verification.
6. Stop and get explicit user approval for the Technical Plan.
7. Ask whether execution should run with subagents or inline.
8. If the user chooses subagent-driven execution, proceed through `itsol-subagent-workflow`.
9. If the user chooses inline execution, proceed to `itsol-feature-implementation` and `itsol-tdd-workflow`.

Read [references/guide.md](references/guide.md) before presenting plans. If the task is not functional implementation, route to the narrower workflow instead.
