# Architecture Boundaries

## Review Targets

- Frontend owns UI rendering, view state, forms, routing, component lifecycle, and user interaction.
- Rust owns privileged system access, commands, local persistence, sidecars, long-running workers, updater, secure storage adapters, logging, and OS integration.
- The Tauri IPC boundary is a local API boundary. Treat commands like endpoints, not private function calls.
- `src/lib/tauri` or an equivalent frontend adapter should be the only broad place importing `@tauri-apps/api`.
- `src-tauri/src/commands` should be thin over testable services, not the home for all domain logic.
- Platform-specific behavior should be isolated behind `cfg(...)`, typed service abstractions, or explicit feature flags.

## Findings To Look For

- UI components call raw `invoke` directly across the app.
- Rust commands contain untested business logic, blocking I/O, panics, or broad mutable global state.
- Frontend keeps durable system state, tokens, or local-backend truth in a UI store.
- Rust stores transient UI state that should stay in the framework.
- A feature assumes one window even though settings, auth, updater, tray, logs, or remote-content windows exist.
- Sidecars or background tasks have no lifecycle, timeout, shutdown, or packaged-build path test.

## State Questions

- Is UI state, app data, system state, and durable local data stored in the correct layer?
- Does local persistence distinguish config, cache, domain data, logs, temp data, and secrets?
- Are migrations idempotent and tested against previous app versions?
- Does logout clear user-specific secrets, cache, active workers, and account-scoped query cache?
- Are long-running resources closed on app shutdown and window close?

## Performance Questions

- Are large payloads streamed, chunked, batched, stored in files, or moved through local persistence instead of one huge IPC JSON payload?
- Are CPU-heavy tasks moved off the UI path with appropriate Rust async, `spawn_blocking`, or worker design?
- Are event streams throttled or batched when they can produce high volume?
- Is performance checked in packaged builds and on target WebView platforms, not only in dev?
