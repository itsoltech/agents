---
name: using-itsolpowers
description: "ITSOL router: planning, tech context, migration, TDD, review, UI/UX, security, infra, data."
---

# Using Itsolpowers

Use this skill as the router for ITSOL engineering work. The goal is to load the smallest useful set of skills, not every checklist.

## Routing Rule

Before refining requirements, implementing, debugging, reviewing, planning, or handing off an ITSOL task:

1. If the user asks to create, initialize, inspect, or update `.itsol.md`, load `itsol-repo-memory` first. If root `.itsol.md` exists, load `itsol-repo-memory` and apply repo or monorepo project policy before choosing testing, verification, implementation, review, or deployment strategy.
2. Identify the task mode: repo memory/init, intake, current technology research, requirements review, feature implementation, bug debugging, technical planning, code review, self-review, QA handoff, security review, infrastructure work, database work, UI/UX work, frontend work, or backend work.
3. Load one process skill first, usually `itsol-task-intake`, `itsol-repo-memory`, `itsol-current-tech-context`, `application-technology-migration`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-requirements-review`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, or `itsol-qa-handoff`.
4. Load focused domain skills only for touched areas. Prefer `security-authz-tenant-review` over a broad security sweep when the change is only authorization.
5. Read the selected skill's guide index before making claims based on ITSOL standards. Within each selected skill, follow its [references/guide.md](references/guide.md) link; if it is a routing index, load only the sector files relevant to the task.
6. If several skills apply, use the most risk-shaping skill first: repo policy, security, data integrity, deployment safety, then implementation style.
7. Load `itsol-current-tech-context` whenever planning, reviewing, implementing, upgrading, or starting work depends on frameworks, SDKs, runtimes, libraries, package managers, generated clients, external APIs, Rust editions, .NET SDKs, Node/Bun/npm packages, database drivers, or infrastructure tooling.
8. For existing repos, use `itsol-current-tech-context` to inspect local version pins first and verify current official documentation for those versions. For new projects, use it to select latest stable versions unless the user explicitly pins otherwise.
9. For rewrite, technology migration, modernization, strangler, branch-by-abstraction, parallel run, data cutover, compatibility contract, or legacy decommissioning work, load `application-technology-migration` before normal feature or bug workflows.
10. For UI/UX tasks, new views, visible frontend flows, design-system changes, responsive behavior, accessibility, frontend tests, or UI review, load `ui-ux-workflow` plus the smallest focused UI skills for the touched surface.
11. For functional tasks, feature work, endpoints, UI flows, integrations, or behavior changes, load `itsol-functional-planning` and `itsol-requirements-review`; require approved Business and Technical Plan markdown files before implementation.
12. For vague, one-sentence, broad, or underspecified functional requests, do not write a Business Plan yet. Run the `itsol-functional-planning` Discovery Gate first as a PM/client interview: present known context, major unknowns, several plausible product scenarios, scope boundaries, edge-case prompts, and ask the user to choose or approve a scenario.
13. After Business Plan approval, do not write a Technical Plan yet. Always run the Technical Decision Gate: present technical options or the single forced/recommended approach, tradeoffs, recommendation, current-tech context when relevant, and ask the user to choose or approve the approach.
14. Before asking approval for either Business Plan or Technical Plan, require Plan Self-Review and Rubber Duck Plan Review through the `itsol-self-review` subagent. Approval is blocked until material findings are resolved.
15. Approval must be explicit after the user saw the specific plan. Never mark a plan as `Approved` because of "direct user request", the original task request, `continue`, silence, or a generic main-agent statement.
16. New plan files must start as `Draft`. Only after valid user approval may the agent update status to `Approved`.
17. Do not let internet research silently choose the user's product or technical direction. Use current documentation to frame options and risks, then ask before locking scope, behavior, architecture, rollout, data migration, permissions, API contracts, or UX into a plan.
18. For bugs, regressions, failing tests, production symptoms, or broken behavior, load `itsol-bug-debugging`; require evidence, Fix Decision Gate before plan writing, and an approved Technical Fix Plan before implementation.
19. For feature work, bugfixes, behavior changes, refactors, UI changes, or migration slices, load `itsol-tdd-workflow` before writing production code. If `.itsol.md` marks the touched project as `limited` or `not-supported`, do not scaffold a new test framework just to satisfy TDD; record the TDD exception and run required replacement verification.
20. If the user chooses subagent-driven execution, load `itsol-subagent-workflow` before starting implementation.
21. For every code review, build a coverage map of relevant review areas. If the PR is large, multi-surface, security/data/infra sensitive, migration-related, generated-contract related, documentation-version-sensitive, frontend/UI-heavy, or hard to review in one context, route review through focused subagents before producing the verdict.
22. If the work has independent surfaces, route them through subagents before implementation or review.

## Subagent Routing

In Claude Code, this plugin provides one subagent for every ITSOL skill under the same scoped name, for example `itsolpowers:dotnet-web-api-review` or `itsolpowers:security-api-input-review`. Prefer the matching plugin subagent when delegating work for a selected skill, because the subagent preloads that skill and carries the same ITSOL workflow constraints in an isolated context.

In Codex, do not treat ITSOL skill names as `agent_type` values. Codex subagent roles are platform roles such as `default`, `explorer`, or `worker`. When forking conversation context, do not also set an explicit `agent_type`; spawn the subagent with forked context and provide the ITSOL skill name in the task instructions or structured skill item. If a Codex role such as `explorer` or `worker` is required, do not use forked context; pass only the minimal task context manually.

Use subagents when the task can be split into independent workstreams, such as UI/API/database/infra changes, multi-area code review, several debugging hypotheses, security plus implementation review, or incident evidence gathering.

Only the main agent orchestrates subagents. A delegated subagent must not spawn another subagent, invoke external agent CLIs such as `codex exec` or `claude`, or try to perform second-level delegation. If the delegated work is still too broad, it must return the recommended split to the main agent.

For code review, subagents are mandatory for large or multi-area PRs. Assign separate review subagents by pragmatic risk area, such as security, infrastructure, frontend, backend, database, generated clients/API contracts, migration/rewrite, QA/release, performance, or test strategy. Inline-only review is acceptable only for tiny single-surface diffs, and the reviewer must state why subagents were unnecessary.

For planning or review that depends on current framework, SDK, runtime, package, or API behavior, delegate a current-tech pass to `itsolpowers:itsol-current-tech-context` when possible. Feed its version findings into the Technical Plan or final review verdict.

For frontend UI/UX work, delegate focused review passes by area when useful: `ui-design-system`, `ui-component-architecture`, `ui-view-states-forms`, `ui-responsive-media`, `ui-tailwind-tokens`, `ui-accessibility-motion`, `ui-performance-stability`, `ui-frontend-testing-qa`, and `ui-code-review`.

For subagent-driven implementation, use `itsol-subagent-workflow`: split work into task slices, agree the concurrency limit, delegate implementation, run a separate review subagent after each implementation result, repeat fixes until review is clean, commit reviewed task slices with Angular commit convention when allowed, then validate the integrated result.

Assign each subagent a narrow scope, owned files or system area, constraints, and expected output. Keep the main agent responsible for the immediate blocker, cross-surface decisions, integrating results, avoiding conflicting edits, and final verification.

## Commit Convention

When creating commits for ITSOL work, use Angular commit convention. Keep commits focused and scoped to the completed slice:

- `feat(scope): add customer export filter`
- `fix(scope): handle missing tenant permission`
- `test(scope): cover stale query invalidation`
- `refactor(scope): isolate webhook validation`
- `docs(scope): update planning workflow`

Do not mix unrelated changes in one commit. If the worktree contains unrelated user changes, stage only the intended files or stop and ask before committing.

## Skill Families

- Core workflow: `itsol-task-intake`, `itsol-repo-memory`, `itsol-current-tech-context`, `application-technology-migration`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-requirements-review`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, `itsol-qa-handoff`.
- Security: threat modeling, auth/session, authz/tenant, API/input, frontend/browser, files/integrations, secrets/config, supply chain, QA scenarios, vulnerability response.
- Infrastructure: deployment design, container build/runtime, Nomad, routing/proxy/TLS, edge protection, secrets/config, observability, backup/DR, capacity, incident debugging, production readiness.
- UI/UX frontend: `ui-ux-workflow`, `ui-design-system`, `ui-component-architecture`, `ui-view-states-forms`, `ui-responsive-media`, `ui-tailwind-tokens`, `ui-accessibility-motion`, `ui-performance-stability`, `ui-frontend-testing-qa`, `ui-code-review`.
- Frontend: `svelte-*`, `tanstack-query-svelte-*`, `hey-api-openapi-*`.
- Backend and typed TypeScript: `dotnet-web-api-*`, `effect-typescript-*`.
- Rust: `rust-*`, plus `rust-ml-llm-*` for Rig, Candle, RAG, local inference, and LLM systems.
- Databases: `postgres-*`, `mongodb-*`, and `mssql-*` for schema/data modeling, .NET data access, review, and operations debugging.

## Output Standard

For implementation work, state the selected skills, matched `.itsol.md` project policy when present, approved plan file paths, execution mode, concrete risk areas, Current Tech Context when relevant, and RED/GREEN verification or a documented TDD exception with replacement verification. For review work, lead with findings by severity and include repo policy plus version/documentation context for findings that depend on framework, SDK, runtime, package, or API behavior. For debugging, gather evidence, state the Technical Fix Plan path and approval status, then propose or implement fixes.
