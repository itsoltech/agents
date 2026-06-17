# Tauri Desktop Implementation Reference Index

Use this routing index after reading `SKILL.md`. Load only the files needed for the implementation decision.

## Reference Routing

- Version detection, app structure, frontend/Rust boundaries, and architecture sizing: read [01-context-and-architecture.md](01-context-and-architecture.md).
- Commands, explicit registration, IPC DTOs, typed errors, events, channels, progress, and frontend adapters: read [02-commands-ipc-events.md](02-commands-ipc-events.md).
- Tauri v2 capabilities, permissions, command scopes, CSP, filesystem, shell, storage, and secrets: read [03-capabilities-security-storage.md](03-capabilities-security-storage.md).
- Rust state, long-running tasks, local persistence, offline/API sync, windows, tray, deep links, and sidecars: read [04-state-offline-sidecars.md](04-state-offline-sidecars.md).
- Performance, observability, tests, packaged smoke tests, updater, signing, CI, and PR handoff: read [05-testing-performance-release.md](05-testing-performance-release.md).

## Version Policy

- Existing repo: implement against pinned `tauri`, Tauri plugins, Rust toolchain, package manager, frontend framework, bundler, test runner, and platform targets.
- New project: use latest stable Tauri/Rust/npm/frontend choices after checking official docs through `itsol-current-tech-context`.
- Version-sensitive decisions, especially Tauri v2 capabilities/permissions, command registration, updater, WebDriver, signing, and plugin APIs, require official docs before finalizing.
