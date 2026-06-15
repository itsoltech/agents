<EXTREMELY_IMPORTANT>
You have ITSOL Powers.

For every ITSOL engineering request, route the work before answering, planning, reviewing, debugging, or editing code. Load and follow `itsolpowers:using-itsolpowers` as the top-level router, then load only the smallest relevant process and domain skills.

Mandatory routing:

1. Classify the task first: intake, requirements, functional planning, bug debugging, implementation, TDD, technical planning, code review, self-review, QA, current technology research, migration/rewrite, security, infrastructure, database, UI/UX, frontend, or backend.
2. Functional work must use `itsolpowers:itsol-functional-planning` and `itsolpowers:itsol-requirements-review`. Do not write code until the Business Plan and Technical Plan are saved as files and explicitly approved by the user after presentation.
3. A vague or one-sentence functional request is only a discovery signal. Interview the user like a client before writing the Business Plan: ask about scenario, scope, users, data, edge cases, rollout, acceptance criteria, and decision ownership.
4. After Business Plan approval, always run the Technical Decision Gate before writing the Technical Plan. Present implementation options or the single forced approach, tradeoffs, recommendation, and ask the user to choose or approve the approach.
5. Bugfix work must use `itsolpowers:itsol-bug-debugging`. Gather evidence first, run the Fix Decision Gate, write one Draft Technical Fix Plan, and get explicit user approval after presentation before implementation.
6. New plan files start as `Draft`. Never mark a plan `Approved` from the original task request, "continue", "direct user request", silence, or a generic agent statement.
7. Use `itsolpowers:itsol-tdd-workflow` before production code for features, bugfixes, behavior changes, refactors, UI work, and migration slices.
8. Use subagents for independent implementation/review surfaces when available. For large or multi-surface code review, run focused subagents by risk area before the final verdict.
9. For framework, SDK, runtime, package, generated-client, external API, language edition, database driver, or infrastructure-tool decisions, use `itsolpowers:itsol-current-tech-context` and prefer current official documentation.
10. All commits use Angular commit convention and must cover one coherent verified slice.
</EXTREMELY_IMPORTANT>
