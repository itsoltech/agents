# File Format Monorepo And Verification

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

## Execution

```yaml
execution:
  default_preset: standard
  restrictions:
    - match:
        path: infra/production
      max_subagents: 1
      max_parallel: 1
      reasoning_profile: medium
      reasoning_control: enforced
      stop_after: technical-plan
```

## QA

```yaml
qa:
  profile: automatic # off | evidence | automatic | strict
  max_cycles: 10
  application_types: [web-ui, api]
  commands: [npm run test:integration]
  targets: [http://localhost:3000]
  restrictions:
    - match:
        path: legacy/hard-to-run
      profile: off
    - match:
        path: packages/cli
      profile: evidence
      application_types: [cli]
      commands: [npm run test:cli]
```

Use `off` only as stable repository policy for a project that cannot be meaningfully run or tested; report the skip rather than PASS. `evidence` uses supported commands/manual evidence without automatic interactive QA agents. `automatic` routes by application type. `strict` adds the strongest coverage and treats low-severity findings as blocking.

## Monorepo Map

| Path | Type | Stack | Test support | Verification |
|---|---|---|---|---|
| `apps/web` | frontend | SvelteKit | limited | relevant existing checks, permitted UI QA |
| `apps/api` | backend | .NET Web API | available | relevant unit/contract checks |
| `packages/client` | generated client | Hey API | not-applicable | codegen diff, typecheck |
| `infra` | infrastructure | Nomad/Docker | unavailable | config validation, review |

## Default Policy

If a touched path is not listed:

- inspect local package/project config first
- do not assume root test commands apply
- do not add a new test framework without user approval
- document discovered stable facts by proposing an update to this file

## Project: <path>

- Owners: unknown
- Stack:
- Test support: available | limited | unavailable | not-applicable | unknown
- Reason:
- Supported automated tests:
  - `<command or "none known">`
- Unsupported automated tests:
  - `<command/type or "none known">`
- Do not spend time on:
  - `<known wasteful action or "none">`
- Verification appropriate to changed behavior:
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
6. Resolve execution defaults through `itsol-execution-policy`. Intersect every matching resource restriction, preserve base plus constraint sources, and never expand a repository ceiling automatically.

Start with one root `.itsol.md`. Add local override files such as `apps/web/.itsol.md` only if the root file becomes too large or the team explicitly wants distributed ownership. If local overrides exist, read root first, then the nearest override for each touched path.

## Verification And Legacy TDD Metadata

Describe supported checks and constraints instead of prescribing test-first order. Apply the router's risk-proportionate verification contract: use relevant existing checks, add lasting tests only for meaningful behavior or regressions, and do not create a framework or coverage quota without agreed scope. Do not turn every helper or internal detail into a test contract.

Existing `TDD mode` values (`full`, `limited`, `not-supported`, `not-applicable`, `unknown`) remain readable as historical testing-capability hints. They do not automatically activate TDD, require RED/GREEN, or require an exception before implementation. Use `itsol-tdd-workflow` only when the user explicitly requests test-first development for the task.

Report checks performed, meaningful evidence, unavailable required verification, and residual risk. A project without supported automated tests still receives verification appropriate to the change and current permissions.

## Example Legacy Testing Policy

```markdown
## Project: legacy/admin

- Stack: unknown legacy frontend
- Test support: unavailable
- Reason: repository has no maintained automated test harness for this app.
- Supported automated tests:
  - none known
- Unsupported automated tests:
  - do not introduce Vitest, Jest, or Playwright during normal feature/bugfix work
- Do not spend time on:
  - scaffolding a new test framework during unrelated feature/bugfix work
- Verification appropriate to changed behavior:
  - run available build/typecheck if present
  - manually reproduce the changed flow
  - capture screenshots for visible UI changes
  - document observed evidence, unverified behavior, and residual risk
```
