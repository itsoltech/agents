# State, Offline, Windows, And Sidecars

## Rust State

Use Rust `State` for durable resources: database pools, HTTP clients, schedulers, sync workers, caches, channels, and service registries.

Rules:

- avoid `Arc<Mutex<T>>` as the default design
- avoid holding locks during long I/O
- use actors/tasks and channels when one owner should serialize work
- define shutdown behavior for tasks, logs, database flushes, and sidecars
- keep command handlers thin over stateful services

## Offline And API Modes

Choose deliberately:

- online only: frontend or Rust calls remote API directly
- offline read-only: local cache with clear stale/error UX
- offline write with sync: durable operation queue and idempotency keys
- local-first: local DB is source of truth and sync resolves conflicts

Use Rust for API access when secrets, client certs, durable sync, local cache, retries, or token hiding are required. Do not create a local HTTP server only to communicate with Rust if commands are sufficient.

Sync workers need persistent queues, retry with backoff and limits, transient/permanent error handling, logout cleanup, and conflict strategy.

## Windows, Tray, Menu, And Deep Links

Each window should have a responsibility and minimal capabilities. Menu and tray actions should call the same domain commands/services as UI actions.

Handle edge cases:

- second app instance
- deep link before UI initialization
- saved window position outside visible screens
- settings window with narrower permissions than main
- app running only in tray with visible error/reporting path

Treat deep links as public untrusted input. Validate `state` for OAuth/PKCE and validate custom protocol payloads before triggering local actions.

## Sidecars And Processes

Use sidecars when an existing binary is justified, isolated lifecycle is useful, or rewriting in Rust is not practical.

Require:

- allowlisted binary and arguments
- no arbitrary shell strings from frontend
- Rust-side validation, timeout, stdout/stderr handling, and exit-code handling
- packaged-build path tests
- shutdown/kill policy
- signing or verification strategy for sidecar artifacts
- update compatibility plan

Prefer a Rust crate over a sidecar when the behavior is small, security-sensitive, or easier to test in-process.
