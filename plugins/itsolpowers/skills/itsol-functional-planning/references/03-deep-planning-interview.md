# Deep Planning Interview

## Embedded Deep-Planning Interview

Use the interview pattern embedded directly in this skill. Do not assume any other plugin, slash command, or external planning command is installed. The pattern is: review the current codebase first, then interview the user in depth before writing planning artifacts.

### Discovery Gate

Run the Discovery Gate before writing the Business Plan when the user gives only a short request, a desired outcome without acceptance criteria, a broad goal, or a request with multiple possible product/technical interpretations.

Treat the agent as a project manager and the user as the client. Load `itsol-requirements-review` for this phase and use its client-interview and Definition-of-Ready guidance. The goal is not to impress the user with an assumed solution; the goal is to uncover the real business problem, decision owner, constraints, success criteria, and first safe scope.

The Discovery Gate output must be a chat response, not a plan file. It must contain:

1. **Known context:** what the user asked for and what the repo/code inspection confirms.
2. **Major unknowns:** missing decisions that affect scope, behavior, architecture, testing, risk, rollout, or user experience.
3. **Scenario options:** several plausible ways to solve the request, with concise tradeoffs. Include options such as backend-only, frontend-only, full-stack, MVP slice, migration-first, compatibility-preserving, or operationally safer rollout when relevant.
4. **Scope boundary question:** ask whether the first plan should cover backend, frontend, both, data migration, permissions, integrations, documentation, deployment, and QA.
5. **Edge-case prompts:** ask about negative paths, old data, permissions, tenant isolation, error states, concurrency, idempotency, audit, notifications, reports, exports, and rollback where relevant.
6. **Decision request:** ask the user to choose a scenario or combine scenarios before the Business Plan is written.

Use this client-interview question bank to choose relevant questions. Do not ask all questions mechanically; select questions that materially affect the Business Plan:

- **Business problem:** What problem are we solving, who has it, what fails today, what happens if we do nothing, and what is the success measure?
- **Current process:** How does the process work today step by step, who participates, where are manual workarounds, and what examples/screens/documents show the expected behavior?
- **Target users and roles:** Who will use it, who can view/create/edit/delete/approve, which roles or tenants are excluded, and who decides exceptions?
- **Scope:** Is the first release backend-only, frontend-only, full-stack, API contract only, migration-only, admin-only, selected tenants only, or a full production rollout?
- **Out of scope:** Which related workflows, roles, reports, notifications, exports, mobile behavior, integrations, or legacy data cases must not be included in this first plan?
- **Data:** What fields are required or optional, what examples are valid/invalid, what old data exists, what must be migrated, retained, archived, audited, imported, or exported?
- **Process states:** What statuses exist, what transitions are allowed, who can trigger them, can actions be repeated or reverted, and what happens during concurrent changes or interrupted flows?
- **UX and API behavior:** What should the user or API client see on success, empty state, validation error, permission denial, external failure, timeout, loading, retry, and long-running operations?
- **Integrations:** Which system is source of truth, is the integration sync/async/batch/event-based, what are timeouts/rate limits/retries, and are sandbox credentials/examples available?
- **Nonfunctional needs:** What response time, scale, idempotency, consistency, observability, audit, security, compliance, and cost constraints matter?
- **Rollout and support:** Feature flag, rollout per role/tenant/environment, rollback path, support instructions, customer communication, post-release metrics, and monitoring.
- **Acceptance and QA:** What scenarios prove the work is complete, including happy path, negative path, permission path, legacy data, integration failure, and regression checks?
- **Decision ownership:** Who approves ambiguous business rules, technical tradeoffs, rollout risk, and scope changes?

Do not continue to the Business Plan until the user answers the scenario and scope questions, or explicitly authorizes a specific default. If the user says "use your recommendation", state the recommended scenario and ask for confirmation before writing the plan when the choice changes product behavior, architecture, rollout, data, permissions, or UX.

Use internet research and current documentation only to improve the quality of scenario options and risk notes. Do not let a documentation result silently pick the implementation path. Present the relevant option and ask whether it matches the user's intent.

Good Discovery Gate shape:

```markdown
Before I write the Business Plan, I need to choose the right scope with you.

Known:
- <confirmed request/repo facts>

Possible scenarios:
1. <Scenario A> - <when it fits / tradeoff>
2. <Scenario B> - <when it fits / tradeoff>
3. <Scenario C> - <when it fits / tradeoff>

Questions:
1. Which scenario should be the first implementation scope?
2. Should this include backend, frontend, generated client/API contract, data migration, permissions, and QA?
3. What edge cases or negative paths must be covered?
```

Bad behavior:

- writing a Business Plan from a one-sentence request
- choosing a library, integration model, UX flow, auth rule, or rollout path only because internet search found a common approach
- hiding uncertainty in vague assumptions instead of asking the user
- asking generic checklist questions that do not affect the plan
- moving a blocking unknown into `Open Questions` and still asking for plan approval

### Technical Decision Gate

Run the Technical Decision Gate after the Business Plan is approved and before writing the Technical Plan. This gate is mandatory even when the agent believes there is only one sensible implementation path.

The Technical Decision Gate output must be a chat response, not a plan file. It must contain:

1. **Approved business target:** the Business Plan path and the product scenario/scope the user approved.
2. **Repo constraints:** relevant architecture, existing patterns, framework/package versions, data model, deployment constraints, tests, and integration contracts found in the repo.
3. **Repo memory context:** if `.itsol.md` exists, summarize matched project policy, TDD mode, supported verification, and constraints.
4. **Current technology context:** when framework, SDK, runtime, package, generated client, external API, language edition, database driver, or infrastructure tooling behavior matters, use `itsol-current-tech-context` to verify repo-pinned or current official documentation before proposing choices.
5. **Technical options:** two to four feasible approaches with tradeoffs, or one forced approach with the reason it is forced. Compare implementation size, risk, compatibility, migration, testability, rollback, performance, security, data impact, and operational complexity.
6. **Recommendation:** one recommended approach with reasoning tied to the approved Business Plan, repo conventions, risk, and delivery size.
7. **Decision request:** ask the user to choose an option or approve the recommendation before writing the Technical Plan.

Ask technical-decision questions that materially affect implementation:

- Should we implement this as a vertical slice, backend-first, frontend-first, API-contract-first, feature-flagged rollout, migration-first, or compatibility-preserving adapter?
- Should the change reuse existing modules/components/contracts or introduce a new abstraction?
- Should existing data be migrated eagerly, lazily, backfilled by job, dual-written, or left read-compatible?
- Should API changes be breaking, additive, versioned, hidden behind feature flags, or exposed only to generated clients?
- Should validation live on backend only, frontend plus backend, schema/contracts, database constraints, or all relevant layers?
- Should permissions be centralized, checked per endpoint/action, modeled in policy objects, or inherited from existing ownership rules?
- Should long-running work be sync, async job, queue/event, scheduled task, streaming, or external integration callback?
- Should cache invalidation be targeted, broad, event-driven, time-based, or avoided by changing query shape?
- Should rollout be global, per environment, per tenant, per role, per user, or dark-launched?
- What rollback is acceptable: config flag, revert, data rollback, compatibility mode, or manual remediation?
- How strict should tests be: unit, contract, integration, e2e, snapshot/visual, migration test, load test, security test?
- Should implementation be delegated through subagents by UI/API/database/security/infra or done inline?

If the user asks for a recommendation, provide it, but still ask for approval before writing the Technical Plan. If only one approach is viable, state why and ask the user to confirm that approach before planning.

Good Technical Decision Gate shape:

```markdown
Before I write the Technical Plan, we need to choose the implementation approach.

Approved business target:
- <Business Plan path and scope>

Technical options:
1. <Option A> - <tradeoffs>
2. <Option B> - <tradeoffs>
3. <Option C> - <tradeoffs>

Recommendation:
- <recommended option and why>

Questions:
1. Which technical option should the Technical Plan use?
2. Are there constraints on rollout, migration, compatibility, or testing that change this choice?
```

Bad behavior:

- writing the Technical Plan immediately after Business Plan approval without a Technical Decision Gate
- choosing the newest library, common pattern, or internet-found implementation without asking whether that path fits the user's constraints
- hiding a major technical choice as an implementation detail
- asking for Technical Plan approval while the selected architecture, migration path, API contract, or rollout strategy is still undecided

Before writing either plan:

1. Inspect relevant code, routes, API contracts, schemas, tests, configs, existing UI, and recent local conventions.
2. Ask follow-up questions only after that inspection, so questions are specific and not obvious.
3. For vague or short briefs, run the Discovery Gate first and get scenario/scope answers before drafting any plan file.
4. Continue interviewing until the Business Plan and Technical Plan can be written without placeholders, guesses, or vague requirements.
5. Prefer one focused question at a time after the initial scenario/scope discovery. If the runtime provides a dedicated user-question tool, use it; otherwise ask directly in chat.
6. Group related alternatives into clear choices when that helps the user answer, but ask open-ended questions when the domain requires nuance.
7. Stop asking only when remaining unknowns can be safely written as explicit assumptions or open questions in the plan file.

Ask about business and product depth:

- who the change is for
- what behavior changes from the user's perspective
- what is explicitly out of scope
- permissions, roles, tenant boundaries, and data ownership
- edge cases and negative paths
- states, statuses, workflows, notifications, copy, audit needs, reporting, and support implications
- rollout, migration, compatibility, and customer communication constraints
- success criteria, acceptance criteria, and QA scenarios

Ask about technical depth:

- exact UI surfaces, routes, components, API endpoints, background jobs, integrations, generated clients, schemas, migrations, cache, events, queues, and observability touched
- framework, SDK, runtime, package manager, dependency, generated-client, API, Rust edition, .NET SDK, Node/Bun/npm, database driver, and infrastructure-tool versions that must be verified against current documentation
- important tradeoffs, rejected approaches, backwards compatibility, performance, security, tenant isolation, error handling, retries, idempotency, concurrency, and data consistency
- test strategy, TDD entry point, expected RED failure, verification commands, manual smoke checks, and rollback
- which ITSOL skills should be used during implementation and review

Ask about UX depth when the change is visible:

- primary user path and alternate paths
- empty, loading, error, disabled, permission-denied, and success states
- validation messages, labels, copy, navigation, accessibility, responsiveness, browser behavior, and analytics if relevant

Ask about delivery depth:

- task slicing, subagent suitability, concurrency limit, code review coverage, commit boundaries, release order, and post-release checks
- rollout, migration, and compatibility constraints

If a detail can be inferred safely from existing code or established patterns, state it as an assumption in the plan instead of asking.

Do not ask checklist questions mechanically. Each question should close a real gap that affects scope, behavior, architecture, testing, or risk.
