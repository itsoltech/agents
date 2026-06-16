# Output And Existing Repository

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
