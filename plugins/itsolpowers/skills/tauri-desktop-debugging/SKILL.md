---
name: tauri-desktop-debugging
description: "Tauri debugging: WebView, Rust commands, IPC, capabilities, filesystem/shell, sidecars, updater, bundling, logs."
---

# Tauri Desktop Debugging

For bugfix authorization and plan prerequisites, defer to `itsol-workflow-mode`; retain evidence, root-cause analysis, TDD/replacement verification, and final review in every mode.

Debug Tauri by locating the failing boundary first: WebView UI, frontend adapter, IPC contract, Rust command/service, capability/permission, storage/filesystem, sidecar/process, updater, bundle, or platform integration.

## Process

1. State expected behavior, actual behavior, impact, OS, architecture, app version/channel, dev/debug/release mode, Tauri/Rust/frontend versions, and the smallest reproducible symptom.
2. Inspect repo-pinned Tauri, Rust, npm/package-manager, frontend framework, plugins, bundler, test runner, and CI versions. For new-project or upgrade-sensitive advice, use latest stable only after checking official docs through `itsol-current-tech-context`.
3. Gather evidence before changing code: WebView console, Rust logs/stdout/stderr, command name and payload, event/channel listeners, capability files, `tauri.conf.*`, sidecar paths/output, updater metadata, packaged build logs, and platform logs.
4. Read [references/guide.md](references/guide.md), then load the focused debugging reference for the suspected boundary.
5. Reproduce in the mode that fails. If a packaged app fails, do not rely on `tauri dev`; build or run a packaged-like artifact with isolated app data.
6. Fix one boundary at a time. Add a regression test when the repo supports it; otherwise document the narrowest reliable manual verification.
7. Use `itsol-bug-debugging` for user-facing defects and follow its Technical Fix Plan gate when required by the resolved workflow mode.

## Coordination

Use with `itsol-current-tech-context`, `itsol-bug-debugging`, `itsol-tdd-workflow`, `security-files-integrations-review`, `security-frontend-browser-review`, `infra-observability`, `ui-performance-stability`, and the frontend framework debugging skill used by the WebView.
