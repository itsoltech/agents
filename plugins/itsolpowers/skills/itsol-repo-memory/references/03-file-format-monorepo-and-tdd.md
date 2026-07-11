# File Format Monorepo And TDD

Use `itsol-workflow-mode` for the exact schema and resolution semantics below.

## Root File Template

```markdown
# ITSOL Repository Notes

Last reviewed: YYYY-MM-DD
Maintainers: <team/person or "unknown">
Repository type: single-project | monorepo | legacy | migration | library | service | frontend | full-stack

## Workflow

```yaml
workflow:
  default_mode: governed
  allowed_modes: [governed, autonomous-planned, direct]
  restrictions:
    - match:
        path: infra/production
      allowed_modes: [governed]
    - match:
        operation: production-deploy
      allowed_modes: [governed]
```

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
2. The most specific `Project: <path>` section supplies project defaults, but workflow `allowed_modes` are intersected with root policy rather than replacing it.
3. If a task touches multiple projects, the plan must list each project policy separately.
4. If a touched path is absent from `Monorepo Map`, inspect local configs and use `unknown` rather than guessing.
5. Intersect every workflow restriction matching a touched path or operation. A task-level mode overrides a default but not base or matching restrictions; if excluded, report the matched rules and ask from remaining modes without silently downgrading.

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
