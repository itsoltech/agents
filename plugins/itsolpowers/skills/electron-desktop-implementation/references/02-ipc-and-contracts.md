# IPC And Contracts

Treat IPC as the desktop app API.

## Preload Bridge

- Use `contextBridge.exposeInMainWorld`.
- Expose named domain methods, not raw `ipcRenderer`, `send`, `invoke`, or `on`.
- Keep the API small and typed.
- Return cleanup functions for subscriptions.
- Do not expose Node globals, broad file handles, path helpers, or generic command execution.
- Keep renderer code able to run in browser-like tests when possible.

## IPC Contract Standard

For each channel define:

- stable channel name
- owner module
- request schema
- response schema
- error code shape
- sender/window authorization rule
- timeout or cancellation behavior
- logging fields without sensitive payloads
- tests for success, validation failure, forbidden sender, and service failure

Prefer runtime schemas such as Zod, Valibot, Effect Schema, or the repo's existing validator. Validate payloads in main before calling services. Validate or type-check responses at critical boundaries.

## Channel Design

Prefer domain operations:

```txt
project:open
project:read-config
updates:check
files:export-report
```

Avoid generic capabilities:

```txt
fs:read
http:request
execute-command
invoke-any
```

Renderer input must never directly become a filesystem path, shell command, arbitrary URL, or update endpoint.

## Events And Streams

- Events need typed payloads, unsubscribe, filtering per window/user/project, and cleanup on window close/logout.
- High-frequency events need throttling, batching, or snapshots after reconnect.
- Large data should use MessagePort, streams, temp files, chunking, backpressure, progress, and cancellation instead of huge `invoke` payloads.
- Errors should map to safe codes and user-meaningful states; do not leak tokens, full internal paths, or raw stack traces to renderer UI.
