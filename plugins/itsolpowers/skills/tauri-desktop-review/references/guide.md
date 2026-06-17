# Tauri Desktop Review Reference Index

This file routes review work to focused references. Do not load every reference unless the pull request spans the full Tauri surface.

## How To Use

1. Identify changed surfaces: architecture, commands, capabilities, storage, secrets, updater, packaging, tests, or QA.
2. Open only the reference files that match those surfaces.
3. For repo work, detect pinned Tauri, Rust, package manager, frontend framework, and plugin versions first. For new projects, use latest stable. For security, updater, signing, and platform behavior claims, verify official docs through `itsol-current-tech-context`.

## Reference Files

- `01-architecture-boundaries.md` - frontend, WebView, Rust core, state ownership, windows, sidecars, and performance boundaries.
- `02-commands-ipc-contracts.md` - command API shape, DTOs, validation, typed errors, events, progress, and cancellation.
- `03-capabilities-storage-security.md` - capabilities review, filesystem/shell scope, secrets, local data, CSP, auth, and logs.
- `04-updater-platform-tests-qa.md` - updater, platform behavior, packaged-app tests, CI gates, QA matrix, and review risk.
