# Init Workflow

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
