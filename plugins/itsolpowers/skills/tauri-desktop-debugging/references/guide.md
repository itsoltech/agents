# Tauri Desktop Debugging Reference Index

Use this routing index after reading `SKILL.md`. Load only the files matching the failure mode.

## Reference Routing

- Evidence matrix, repro isolation, version detection, and dev-vs-packaged triage: read [01-evidence-and-triage.md](01-evidence-and-triage.md).
- Frontend/WebView, CSP, adapter, `invoke`, events/channels, listeners, and cross-window symptoms: read [02-frontend-webview-ipc.md](02-frontend-webview-ipc.md).
- Rust command registration, command handlers, state, async locks, panics, serialization, logs, and service-layer failures: read [03-rust-commands-state-logs.md](03-rust-commands-state-logs.md).
- Capabilities/permissions, filesystem, shell/process, deep links, storage, and sidecar failures: read [04-permissions-fs-shell-sidecars.md](04-permissions-fs-shell-sidecars.md).
- Packaged-only failures, updater, signing/notarization, bundle assets, installers, and platform-specific failures: read [05-bundling-updater-platforms.md](05-bundling-updater-platforms.md).

## Version Policy

- Existing repo: debug against pinned `tauri`, Tauri plugins, Rust toolchain, package manager, frontend framework, bundler, test runner, and CI/release configuration.
- New or upgrade-sensitive advice: use latest stable only after checking official docs through `itsol-current-tech-context`.
- Symptoms involving Tauri v2 capabilities/permissions, command registration, updater, WebDriver, sidecars, signing, or plugin APIs require current official docs before recommending version-specific fixes.
