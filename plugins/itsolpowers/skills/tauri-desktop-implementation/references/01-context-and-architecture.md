# Context And Architecture

## Detect First

Inspect repo pins before designing:

- `src-tauri/Cargo.toml`, `Cargo.lock`, `rust-toolchain.toml`, `.cargo/config*`
- `package.json`, lockfile, package manager files, `vite.config.*` or framework config
- `src-tauri/tauri.conf.*`, `src-tauri/capabilities/*.json`, `src-tauri/src/lib.rs`, `main.rs`
- CI workflows, release scripts, signing/updater config, platform target notes

Record Tauri major version, official plugins, Rust edition/MSRV, frontend framework, bundler, package manager, test tools, and target OS matrix.

## Boundary Model

Use this split unless the repo has a stronger established pattern:

- Frontend: rendering, forms, view state, UX validation, routing, local UI interactions.
- Rust: system access, trusted validation, filesystem/process/network work that needs privileges, durable resources, local database, secrets, sidecars, updater, diagnostics.
- IPC: narrow local API with DTOs, typed errors, progress/events, cancellation, and clear command names.

Do not port Electron assumptions directly. Tauri uses system WebView plus a Rust binary, so platform WebView differences, permissions/capabilities, native packaging, updater signing, and command contracts matter more than Node/Chromium patterns.

## Structure

Small app:

```text
src-tauri/src/
  commands/
  services/
  state.rs
  error.rs
```

Medium app:

```text
src-tauri/src/features/
  settings/{commands.rs,service.rs,dto.rs,errors.rs}
  files/{commands.rs,service.rs,dto.rs,errors.rs}
```

Large app only when justified:

```text
src-tauri/
  crates/app-core
  crates/app-domain
  crates/app-persistence
  crates/app-tauri
```

Avoid workspaces, DDD layers, or plugin abstractions unless they remove real complexity or share logic outside Tauri.

## Frontend Adapter

Keep Tauri imports in one adapter area, for example `src/lib/tauri/*`. Components should call adapter functions, hooks, stores, or query functions, not raw `invoke` scattered through UI files.

Treat Tauri commands like API endpoints:

- stable function names
- DTO arguments and return values
- frontend error mapping
- query/cache integration when applicable
- testable mocks for frontend tests
