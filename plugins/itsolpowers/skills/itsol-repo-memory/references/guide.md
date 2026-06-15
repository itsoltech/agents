# ITSOL Repo Memory Reference

`.itsol.md` is a committed repository policy file for agents and humans. It captures stable operational facts about how to work safely in this repo.

## When To Read

Read root `.itsol.md` before:

- task intake or routing
- writing Business, Technical, or Technical Fix Plans
- deciding whether TDD is possible
- adding tests or test frameworks
- choosing verification commands
- running subagent-driven implementation
- code review, QA handoff, release, or incident work

If the file does not exist, continue with normal discovery. Do not create it unless the user asks, an approved plan includes it, or you discover a stable repo-level fact that should be proposed for team memory.

## Init Workflow

Use this workflow when the user asks to initialize, create, prepare, bootstrap, or generate `.itsol.md`.

### 1. Discover Candidate Projects

Inspect repo structure with lightweight reads only. Look for:

- workspace files: `package.json`, `pnpm-workspace.yaml`, `bun.lock`, `turbo.json`, `nx.json`
- .NET files: `*.sln`, `*.csproj`, `Directory.Build.props`
- Rust files: `Cargo.toml`, workspace members
- frontend apps: `svelte.config.*`, `vite.config.*`, `next.config.*`, route/app directories
- generated clients: OpenAPI configs, Hey API configs, generated folders
- database and infra: migrations, `docker-compose*`, `nomad`, `terraform`, deployment folders
- test configs: `vitest`, `jest`, `playwright`, `xunit`, `cargo test`, CI workflows

Do not perform expensive builds or full test runs during init unless the user asks.

### 2. Present Candidate Map

Before writing `.itsol.md`, show a concise candidate map:

```markdown
I found these candidate projects:

| Path | Type | Detected stack | Detected test/config hints | Proposed TDD mode |
|---|---|---|---|---|
| `apps/web` | frontend app | SvelteKit | `npm run check`, no e2e config found | limited |
| `apps/api` | backend service | .NET Web API | `*.Tests.csproj` found | full |
| `infra` | infrastructure | Nomad/Docker | no test harness | not-applicable |
```

Then ask the user to confirm or correct:

- which paths are real projects
- owner/maintainer if known
- TDD mode for each project
- supported verification commands
- unsupported or wasteful actions
- manual QA expectations
- generated-code or deployment constraints

### 3. Write After Confirmation

Only write `.itsol.md` after the user confirms the map and policies. If the user wants a draft, write uncertain values as `unknown` and include explicit follow-up questions in the file.

### 4. Monorepo Defaults

For monorepos, prefer one root `.itsol.md` with:

- `Monorepo Map`
- `Default Policy`
- one `Project: <path>` section per confirmed project
- shared `Verification Commands`
- shared `Agent Workflow Notes`
- shared `Known Constraints`

Local override files are optional and should not be introduced during first init unless the user asks.

## Priority

Use this order when instructions conflict:

1. Direct user instruction in the current conversation
2. Approved task plan
3. Most specific `.itsol.md` project policy for touched paths
4. Root `.itsol.md` default policy
5. ITSOL skill defaults
6. General model knowledge

If a conflict affects scope, tests, deployment, data, security, or delivery risk, stop and ask.

## Root File Template

```markdown
# ITSOL Repository Notes

Last reviewed: YYYY-MM-DD
Maintainers: <team/person or "unknown">
Repository type: single-project | monorepo | legacy | migration | library | service | frontend | full-stack

## Monorepo Map

| Path | Type | Stack | TDD mode | Verification |
|---|---|---|---|---|
| `apps/web` | frontend | SvelteKit | limited | typecheck, build, manual QA |
| `apps/api` | backend | .NET Web API | full | unit, integration |
| `packages/client` | generated client | Hey API | not-applicable | codegen diff, typecheck |
| `infra` | infrastructure | Nomad/Docker | not-supported | config validation, review |

## Default Policy

If a touched path is not listed:

- inspect local package/project config first
- do not assume root test commands apply
- do not add a new test framework without user approval
- document discovered stable facts by proposing an update to this file

## Project: <path>

- Owners: unknown
- Stack:
- TDD mode: full | limited | not-supported | not-applicable | unknown
- Reason:
- Supported automated tests:
  - `<command or "none known">`
- Unsupported automated tests:
  - `<command/type or "none known">`
- Do not spend time on:
  - `<known wasteful action or "none">`
- Required replacement verification:
  - `<manual QA, build, typecheck, smoke test, diagnostic, screenshot, log check>`

## Verification Commands

- Fast check:
- Build:
- Lint:
- Typecheck:
- Test:
- Manual QA:

## Agent Workflow Notes

- Before implementation:
- During implementation:
- Before completion:
- Use subagents for:
- Avoid:

## Known Constraints

- Constraint:
  - Why it matters:
  - What agents should do:

## Update Rules

- Update this file only with stable repo-level facts.
- Do not add temporary task notes.
- If a fact is uncertain, mark it as `unknown` and verify first.
```

## Monorepo Matching

For monorepos, use prefix matching:

1. Root `.itsol.md` is always read.
2. The most specific `Project: <path>` section wins for files under that path.
3. If a task touches multiple projects, the plan must list each project policy separately.
4. If a touched path is absent from `Monorepo Map`, inspect local configs and use `unknown` rather than guessing.

Start with one root `.itsol.md`. Add local override files such as `apps/web/.itsol.md` only if the root file becomes too large or the team explicitly wants distributed ownership. If local overrides exist, read root first, then the nearest override for each touched path.

## TDD Modes

- `full`: TDD is expected. Add or update a failing automated test before production code.
- `limited`: Prefer TDD where existing test harnesses support it; otherwise use the listed replacement verification.
- `not-supported`: Do not scaffold or introduce a new test framework during normal work. Record a TDD exception and use replacement verification.
- `not-applicable`: The area is generated code, docs, infra config, or another surface where TDD does not apply.
- `unknown`: Inspect configs and ask or propose a small discovery step before deciding.

`not-supported` is not permission to skip verification. It means "do not waste time building a test harness for this task." The agent must still document:

- why RED/GREEN TDD was skipped
- which supported checks were run
- which manual or diagnostic verification replaced the RED test
- residual risk from missing automated coverage

## Good Update Candidates

Propose `.itsol.md` updates for stable facts:

- no working automated test harness
- project-specific test commands
- test commands that are known to be flaky or obsolete
- generated-code commands and files that must not be edited manually
- deployment or migration order
- required env vars, local services, or seed data for verification
- manual QA smoke paths for legacy projects
- monorepo package ownership and command boundaries

Avoid adding:

- temporary findings from one task
- personal notes
- secrets
- ticket-specific TODOs
- speculative assumptions

## Example Legacy Testing Policy

```markdown
## Project: legacy/admin

- Stack: unknown legacy frontend
- TDD mode: not-supported
- Reason: repository has no maintained automated test harness for this app.
- Supported automated tests:
  - none known
- Unsupported automated tests:
  - do not introduce Vitest, Jest, or Playwright during normal feature/bugfix work
- Do not spend time on:
  - scaffolding a new test framework only to satisfy TDD workflow
- Required replacement verification:
  - run available build/typecheck if present
  - manually reproduce the changed flow
  - capture screenshots for visible UI changes
  - document the TDD exception and residual risk
```
