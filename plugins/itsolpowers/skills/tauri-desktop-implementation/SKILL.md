---
name: tauri-desktop-implementation
description: "Tauri implementation: architecture, frontend/Rust boundaries, commands, events, state, storage, sidecars, tests, release."
---

# Tauri Desktop Implementation

Implement Tauri desktop apps by treating the WebView as UI, Rust as the trusted system boundary, and Tauri IPC as a local API contract.

## Process

1. Inspect repo-pinned Tauri, Rust, npm/package-manager, frontend framework, plugin, bundler, test, and CI versions. For new projects, use latest stable choices only after checking official docs through `itsol-current-tech-context`.
2. Read [references/guide.md](references/guide.md), then load only the focused reference files needed for the feature.
3. Define the boundary: UI state in frontend, privileged/system work in Rust, stable DTOs across commands/events/channels, and explicit ownership for durable state.
4. Design Tauri v2 capabilities and permissions before wiring privileged features. Keep permissions per window/webview and review command scopes as part of the feature.
5. Implement thin `#[tauri::command]` handlers over testable Rust services, register commands explicitly, and expose a single frontend adapter instead of scattered raw `invoke` calls.
6. Add validation, typed errors, lifecycle handling, cancellation/progress for long work, and storage choices appropriate to data sensitivity.
7. Verify with frontend tests, Rust tests, command/service tests, and packaged-app smoke tests when the feature touches files, sidecars, updater, permissions, or platform behavior.

## Coordination

Use with `itsol-current-tech-context`, `itsol-tdd-workflow`, `security-files-integrations-review`, `security-auth-session-review`, `ui-frontend-testing-qa`, `ui-performance-stability`, the relevant frontend framework skill, and release/distribution skills when packaging, signing, updater, or CI artifacts are in scope.
