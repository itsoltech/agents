---
name: using-itsolpowers
description: Use when starting ITSOL work, choosing which ITSOL skill applies, or routing tasks across application technology migration, functional planning, subagent workflow, requirements review, TDD, feature implementation, bug debugging, technical planning, code review, QA handoff, security, infrastructure, database, frontend, and backend workflows.
---

# Using Itsolpowers

Use this skill as the router for ITSOL engineering work. The goal is to load the smallest useful set of skills, not every checklist.

## Routing Rule

Before refining requirements, implementing, debugging, reviewing, planning, or handing off an ITSOL task:

1. Identify the task mode: intake, requirements review, feature implementation, bug debugging, technical planning, code review, self-review, QA handoff, security review, infrastructure work, database work, frontend work, or backend work.
2. Load one process skill first, usually `itsol-task-intake`, `application-technology-migration`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-requirements-review`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, or `itsol-qa-handoff`.
3. Load focused domain skills only for touched areas. Prefer `security-authz-tenant-review` over a broad security sweep when the change is only authorization.
4. Read the selected skill's guide index before making claims based on ITSOL standards. Within each selected skill, follow its [references/guide.md](references/guide.md) link; if it is a routing index, load only the sector files relevant to the task.
5. If several skills apply, use the most risk-shaping skill first: security, data integrity, deployment safety, then implementation style.
6. For rewrite, technology migration, modernization, strangler, branch-by-abstraction, parallel run, data cutover, compatibility contract, or legacy decommissioning work, load `application-technology-migration` before normal feature or bug workflows.
7. For functional tasks, feature work, endpoints, UI flows, integrations, or behavior changes, load `itsol-functional-planning` and require approved Business and Technical Plan markdown files before implementation.
8. For bugs, regressions, failing tests, production symptoms, or broken behavior, load `itsol-bug-debugging`; require evidence and an approved Technical Fix Plan before implementation.
9. For feature work, bugfixes, behavior changes, refactors, or migration slices, load `itsol-tdd-workflow` before writing production code.
10. If the user chooses subagent-driven execution, load `itsol-subagent-workflow` before starting implementation.
11. For every code review, build a coverage map of relevant review areas. If the PR is large, multi-surface, security/data/infra sensitive, migration-related, generated-contract related, or hard to review in one context, route review through focused subagents before producing the verdict.
12. If the work has independent surfaces, route them through subagents before implementation or review.

## Subagent Routing

In Claude Code, this plugin provides one subagent for every ITSOL skill under the same scoped name, for example `itsolpowers:dotnet-web-api-review` or `itsolpowers:security-api-input-review`. Prefer the matching plugin subagent when delegating work for a selected skill, because the subagent preloads that skill and carries the same ITSOL workflow constraints in an isolated context.

Use subagents when the task can be split into independent workstreams, such as UI/API/database/infra changes, multi-area code review, several debugging hypotheses, security plus implementation review, or incident evidence gathering.

For code review, subagents are mandatory for large or multi-area PRs. Assign separate review subagents by pragmatic risk area, such as security, infrastructure, frontend, backend, database, generated clients/API contracts, migration/rewrite, QA/release, performance, or test strategy. Inline-only review is acceptable only for tiny single-surface diffs, and the reviewer must state why subagents were unnecessary.

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

- Core workflow: `itsol-task-intake`, `application-technology-migration`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-requirements-review`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, `itsol-qa-handoff`.
- Security: threat modeling, auth/session, authz/tenant, API/input, frontend/browser, files/integrations, secrets/config, supply chain, QA scenarios, vulnerability response.
- Infrastructure: deployment design, container build/runtime, Nomad, routing/proxy/TLS, edge protection, secrets/config, observability, backup/DR, capacity, incident debugging, production readiness.
- Frontend: `svelte-*`, `tanstack-query-svelte-*`, `hey-api-openapi-*`.
- Backend and typed TypeScript: `dotnet-web-api-*`, `effect-typescript-*`.
- Rust: `rust-*`, plus `rust-ml-llm-*` for Rig, Candle, RAG, local inference, and LLM systems.
- Databases: `postgres-*` and `mongodb-*` for schema/data modeling, review, and operations debugging.

## Output Standard

For implementation work, state the selected skills, approved plan file paths, execution mode, concrete risk areas, and RED/GREEN verification. For review work, lead with findings by severity. For debugging, gather evidence, state the Technical Fix Plan path and approval status, then propose or implement fixes.
