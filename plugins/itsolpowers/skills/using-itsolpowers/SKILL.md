---
name: using-itsolpowers
description: Use when starting ITSOL work, choosing which ITSOL skill applies, or routing tasks across functional planning, subagent workflow, requirements review, TDD, feature implementation, bug debugging, technical planning, code review, QA handoff, security, infrastructure, database, frontend, and backend workflows.
---

# Using Itsolpowers

Use this skill as the router for ITSOL engineering work. The goal is to load the smallest useful set of skills, not every checklist.

## Routing Rule

Before refining requirements, implementing, debugging, reviewing, planning, or handing off an ITSOL task:

1. Identify the task mode: intake, requirements review, feature implementation, bug debugging, technical planning, code review, self-review, QA handoff, security review, infrastructure work, database work, frontend work, or backend work.
2. Load one process skill first, usually `itsol-task-intake`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-requirements-review`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, or `itsol-qa-handoff`.
3. Load focused domain skills only for touched areas. Prefer `security-authz-tenant-review` over a broad security sweep when the change is only authorization.
4. Read the selected skill's guide index before making claims based on ITSOL standards. Within each selected skill, follow its [references/guide.md](references/guide.md) link; if it is a routing index, load only the sector files relevant to the task.
5. If several skills apply, use the most risk-shaping skill first: security, data integrity, deployment safety, then implementation style.
6. For functional tasks, feature work, endpoints, UI flows, integrations, or behavior changes, load `itsol-functional-planning` and require approved Business and Technical Plans before implementation.
7. For feature work, bugfixes, behavior changes, or refactors, load `itsol-tdd-workflow` before writing production code.
8. If the user chooses subagent-driven execution, load `itsol-subagent-workflow` before starting implementation.
9. If the work has independent surfaces, route them through subagents before implementation or review.

## Subagent Routing

In Claude Code, this plugin provides one subagent for every ITSOL skill under the same scoped name, for example `itsolpowers:dotnet-web-api-review` or `itsolpowers:security-api-input-review`. Prefer the matching plugin subagent when delegating work for a selected skill, because the subagent preloads that skill and carries the same ITSOL workflow constraints in an isolated context.

Use subagents when the task can be split into independent workstreams, such as UI/API/database/infra changes, multi-area code review, several debugging hypotheses, security plus implementation review, or incident evidence gathering.

For subagent-driven implementation, use `itsol-subagent-workflow`: split work into task slices, agree the concurrency limit, delegate implementation, run a separate review subagent after each implementation result, repeat fixes until review is clean, commit reviewed task slices with Angular commit convention when allowed, then validate the integrated result.

Assign each subagent a narrow scope, owned files or system area, constraints, and expected output. Keep the main agent responsible for the immediate blocker, cross-surface decisions, integrating results, avoiding conflicting edits, and final verification.

## Skill Families

- Core workflow: `itsol-task-intake`, `itsol-functional-planning`, `itsol-subagent-workflow`, `itsol-requirements-review`, `itsol-feature-implementation`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `itsol-technical-planning`, `itsol-code-review-workflow`, `itsol-self-review`, `itsol-qa-handoff`.
- Security: threat modeling, auth/session, authz/tenant, API/input, frontend/browser, files/integrations, secrets/config, supply chain, QA scenarios, vulnerability response.
- Infrastructure: deployment design, container build/runtime, Nomad, routing/proxy/TLS, edge protection, secrets/config, observability, backup/DR, capacity, incident debugging, production readiness.
- Frontend: `svelte-*`, `tanstack-query-svelte-*`, `hey-api-openapi-*`.
- Backend and typed TypeScript: `dotnet-web-api-*`, `effect-typescript-*`.
- Rust: `rust-*`, plus `rust-ml-llm-*` for Rig, Candle, RAG, local inference, and LLM systems.
- Databases: `postgres-*` and `mongodb-*` for schema/data modeling, review, and operations debugging.

## Output Standard

For implementation work, state the selected skills, approved plan status, execution mode, concrete risk areas, and RED/GREEN verification. For review work, lead with findings by severity. For debugging, gather evidence before proposing fixes.
