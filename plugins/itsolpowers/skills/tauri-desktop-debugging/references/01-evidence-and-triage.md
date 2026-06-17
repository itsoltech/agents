# Evidence And Triage

## First Facts

Capture:

- OS/version, architecture, app version, channel, install type
- dev/debug/release/packaged mode
- Tauri, plugin, Rust, frontend framework, bundler, package manager, and test runner versions
- exact command/event/flow that fails
- expected behavior, actual behavior, first bad version, regression window
- whether clearing app data changes the result

Use repo pins first. Use official docs through `itsol-current-tech-context` before making version-sensitive claims.

## Evidence Matrix

Collect evidence by boundary:

| Boundary | Evidence |
|---|---|
| WebView | console errors, network/CSP failures, UI state, route, listener lifecycle |
| IPC | command name, payload shape, return/error shape, event/channel name and payload |
| Rust | logs, stdout/stderr, panic/backtrace, command registration, service error |
| permissions | capability files, command scopes, denied permission logs |
| storage | app data path, DB migration status, config/cache files, keychain errors |
| files/process | path chosen, canonical path, permission denied, sidecar stdout/stderr/exit |
| packaged app | bundle contents, asset paths, updater metadata, signing/notarization/installer logs |

## Repro Isolation

Separate these cases:

- `tauri dev` only
- debug build only
- release packaged app only
- one OS only
- one user data directory only
- after update only
- fresh install only

If production fails, reproduce with a packaged-like artifact and isolated app data. Do not assume browser-only tests or dev server behavior prove Tauri behavior.

## Safe Debugging

- Do not log secrets or full IPC payloads.
- Redact local paths and personal data in shared diagnostics.
- Add temporary logs behind debug flags and remove or gate them before handoff.
- Keep fixes scoped to the failing boundary until evidence points elsewhere.
