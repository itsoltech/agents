# ITSOL Current Tech Context Guide

Use this guide whenever a plan, review, implementation, migration, or new project depends on technology versions. The goal is to avoid outdated assumptions and to make version decisions explicit.

## Current Tech Context Output

Every planning or review artifact that uses this skill should include:

```markdown
## Current Tech Context

| Area | Detected Or Selected Version | Source Checked | Decision | Risk |
| --- | --- | --- | --- | --- |
| <framework/runtime/package> | <version or latest stable> | <official docs/package registry/release notes> | <use/pin/upgrade/defer> | <compatibility/security/support risk or None> |

**Version Policy:** <repo-pinned | latest stable | user-pinned | LTS | compatibility target>
**Internet Check:** <performed with date | unavailable; state limitation>
```

For PR review, this can be shorter, but it must still state the docs or registry context used for material findings.

## Existing Repository

Inspect local evidence before searching the internet:

- JavaScript/TypeScript: `package.json`, lockfile, `.nvmrc`, `.node-version`, `bun.lock`, `pnpm-lock.yaml`, `yarn.lock`, `vite.config.*`, framework config, generated clients.
- Rust: `Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`, `rustfmt.toml`, CI toolchain, edition fields, feature flags.
- .NET: `global.json`, `*.csproj`, `Directory.Build.props`, `Directory.Packages.props`, `NuGet.config`, Dockerfiles, CI SDK setup.
- OpenAPI/codegen: OpenAPI specs, generator config, generated client package versions, CI contract checks.
- Database drivers and ORMs: package manifests, migration tooling, connection libraries, generated models.
- Infrastructure: Dockerfiles, compose files, Nomad jobs, Terraform/OpenTofu, Helm, GitHub Actions, reverse proxy config, runtime images.

Use the detected version for review and implementation unless:

- the user asks to upgrade or start fresh;
- the version is unsupported, insecure, or incompatible with the requested change;
- the repo has no clear pin and current stable defaults are appropriate.

Do not silently apply latest-version advice to an older pinned repo. Call out the mismatch and decide whether it is in scope.

## New Project Defaults

When there is no existing repo constraint and the user did not pin versions:

- use latest stable packages, SDKs, runtimes, generators, and framework versions;
- choose package managers and tooling intentionally, not from memory;
- prefer stable releases over prerelease, nightly, beta, RC, or canary;
- record major versions and assumptions in the technical plan;
- prefer actively supported LTS versions when longevity matters more than newest features.

Language defaults:

- Rust: latest stable Rust and newest stable edition supported by the toolchain.
- .NET: latest stable SDK; choose LTS when production support window is a requirement.
- Node/Bun/npm: latest stable packages compatible with the chosen runtime and package manager.

## Source Selection

Use primary sources first:

- official framework/language/runtime documentation;
- official release notes and migration guides;
- package registries such as npm, NuGet, crates.io, Docker Hub, or official container registries;
- vendor docs for infrastructure and cloud tooling;
- GitHub releases only when the project treats GitHub as the release channel.

Avoid basing decisions on blog posts, old tutorials, generated snippets, or model memory when official docs or registries are available.

When internet access is unavailable, state that limitation and proceed from local manifests plus known constraints. Do not claim that a version is latest unless verified.

## Planning Rules

In Business Plans, mention technology freshness only when it affects user-visible scope, risk, rollout, support, licensing, or compatibility.

In Technical Plans, always include:

- detected repo versions or selected new-project versions;
- source links or source names checked;
- whether the plan uses existing versions, upgrades, or defers upgrades;
- compatibility implications for code, tests, generated clients, migrations, deployment, and rollback;
- exact ITSOL skills that rely on this context.

If current docs introduce a different recommended pattern than the repo uses, do not rewrite architecture automatically. Decide whether the change belongs to this task or a follow-up plan.

## Review Rules

During code review:

- check whether the PR follows the documentation for the repo's actual version;
- flag use of deprecated APIs, unsupported SDKs, insecure packages, stale generated clients, or incompatible major-version patterns;
- distinguish blockers from follow-up modernization;
- for large PRs, delegate current-doc checks to the relevant technology review subagents when possible.

If a finding depends on external docs, include the source and the version context in the finding.
