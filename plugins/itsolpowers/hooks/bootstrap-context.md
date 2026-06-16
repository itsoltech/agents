<EXTREMELY_IMPORTANT>
You have ITSOL Powers.

For every ITSOL engineering request, route the work before answering, planning, reviewing, debugging, or editing code. Load and follow `itsolpowers:using-itsolpowers` as the top-level router, then load only the smallest relevant process and domain skills.

Mandatory routing:

1. Classify the task first: repo memory/init, intake, requirements, functional planning, bug debugging, implementation, TDD, technical planning, code review, self-review, QA, current technology research, migration/rewrite, security, infrastructure, database, MSSQL/SQL Server/.NET data access, UI/UX, React 19/Next.js, frontend, or backend.
2. If the user asks to create, initialize, inspect, or update `.itsol.md`, use `itsolpowers:itsol-repo-memory`. If root `.itsol.md` exists, use `itsolpowers:itsol-repo-memory` before planning or implementation. Apply the most specific monorepo project policy for touched paths, especially TDD mode and verification commands.
3. Functional work must use `itsolpowers:itsol-functional-planning` and `itsolpowers:itsol-requirements-review`. Do not write code until the Business Plan and Technical Plan are saved as files and explicitly approved by the user after presentation.
4. A vague or one-sentence functional request is only a discovery signal. Interview the user like a client before writing the Business Plan: ask about scenario, scope, users, data, edge cases, rollout, acceptance criteria, and decision ownership.
5. After Business Plan approval, always run the Technical Decision Gate before writing the Technical Plan. Present implementation options or the single forced approach, tradeoffs, recommendation, and ask the user to choose or approve the approach.
6. Bugfix work must use `itsolpowers:itsol-bug-debugging`. Gather evidence first, run the Fix Decision Gate, write one Draft Technical Fix Plan, and get explicit user approval after presentation before implementation.
7. New plan files start as `Draft`. Never mark a plan `Approved` from the original task request, "continue", "direct user request", silence, or a generic agent statement.
8. Use `itsolpowers:itsol-tdd-workflow` before production code for features, bugfixes, behavior changes, refactors, UI work, and migration slices. If `.itsol.md` says TDD is limited or not supported, do not scaffold a test framework only to satisfy TDD; document the exception and run replacement verification.
9. Use subagents for independent implementation/review surfaces when available. For large or multi-surface code review, run focused subagents by risk area before the final verdict. For React 19/Next.js work, route framework-specific surfaces through `itsolpowers:react-nextjs-*` skills/subagents; for TanStack Query v5 cache, query, mutation, SSR hydration, invalidation, optimistic update, auth cache, or tenant issues use `itsolpowers:tanstack-query-react-nextjs-*` in addition to UI, security, generated-client, or testing specialists.
10. For framework, SDK, runtime, package, generated-client, external API, language edition, database driver, or infrastructure-tool decisions, use `itsolpowers:itsol-current-tech-context` and prefer current official documentation.
11. All commits use Angular commit convention and must cover one coherent verified slice.
</EXTREMELY_IMPORTANT>
