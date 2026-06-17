# Rust Commands, State, And Logs

## Command Registration

When `invoke` says a command is missing or silently fails, check:

- command function has `#[tauri::command]`
- command is included in `tauri::generate_handler![...]`
- function name matches frontend command string or explicit rename behavior
- module is compiled for the current target and not excluded by `cfg(...)`
- plugin setup order and builder setup do not skip registration on a platform

Tauri v2 command exposure can also be affected by capabilities and permissions, so check both registration and access policy.

## Handler And Service Failures

Commands should be thin. If a command fails:

- reproduce by testing the underlying service directly where possible
- validate DTO deserialization and validation errors
- map internal errors to stable serializable UI errors
- avoid panics; return typed errors
- inspect file paths after canonicalization
- verify account/session context is supplied by trusted Rust state, not only UI state

## State And Async

Common Rust-side bugs:

- `Mutex` held while awaiting or doing blocking I/O
- long CPU work blocks async runtime or command path
- background task outlives app/window without shutdown policy
- database pool/keychain/HTTP client not initialized before command
- migration runs concurrently in multiple windows/processes
- cancellation drops UI listener but Rust job keeps running

Use `spawn_blocking`, task actors, channels, or service queues based on workload. Do not mask lock contention by adding wider locks.

## Logs

Collect Rust stdout/stderr, app log files, and platform logs. Add correlation IDs for command calls and operation IDs for long work.

Useful log classes:

- app lifecycle and config load
- command start/end/error
- IPC payload size, not full payload
- database migration
- sync status and network errors
- updater check/download/install
- sidecar spawn/exit
- filesystem and permission denials

Redact tokens, personal data, file contents, and full request/response bodies.
