# Discovery And Technical Decision Depth

Use `itsol-workflow-mode` to choose interview depth. Inspect the codebase, contracts, tests, and conventions before asking questions.

## Governed Discovery Gate

In `governed`, a vague, short, broad, or multiply-interpretable functional request starts a PM/client Discovery Gate before a Business Plan is written. Summarize known evidence, major unknowns, plausible scenarios with tradeoffs, recommended first scope, and targeted questions covering business outcome, roles and permissions, scope, data, states, integrations, UX/API behavior, nonfunctional needs, rollout, acceptance, QA, and decision ownership.

Do not continue to the governed Business Plan until material scenario and scope decisions are answered or explicitly confirmed. Do not replace product choices with internet defaults.

## Autonomous Planned Discovery

In `autonomous-planned`, use the same question areas internally to make plans complete, but prefer repository-backed assumptions and the documented recommendation. Ask one targeted question only when equally plausible interpretations materially change user-visible behavior, permissions, data handling, rollout, or architecture. Record assumptions and delegated decisions, then continue through review without approval pauses.

## Direct Scoping

In `direct`, do not run the Discovery Gate or create planning artifacts. Establish the smallest safe implementation scope from the request and repository evidence. Ask only about unresolved material ambiguity, then route implementation with `artifact_state: not-required`. Do not recreate planning gates as an interview or chat-only plan.

## Technical Decision Gate

In `governed`, after the Business Plan is explicitly approved and before the Technical Plan, present repo constraints, relevant current-tech evidence, feasible approaches or the forced approach, tradeoffs, recommendation, and a direct request for the user's choice.

In `autonomous-planned`, record the same decision evidence, choose the documented recommendation, and continue unless a material ambiguity has no safe recommendation. In `direct`, skip the Technical Decision Gate and make ordinary implementation choices from repository evidence.

Decision analysis should cover relevant architecture, reuse, API compatibility, migration, validation, permissions, async work, cache invalidation, rollout, rollback, security, performance, testability, and operational complexity. Load `itsol-current-tech-context` when technology versions or external behavior matter.

Every question must close a real gap. Safely infer established conventions, document assumptions, and propagate all seven workflow-state fields in artifacts and handoffs.
