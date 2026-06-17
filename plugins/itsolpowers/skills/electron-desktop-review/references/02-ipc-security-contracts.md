# IPC And Security Contracts

Treat IPC as a desktop API exposed to potentially compromised renderer code.

## Contract Review

- Each channel has an owner, stable name, request schema, response schema, and safe error shape.
- Payload validation happens in main, not only in renderer.
- Responses are typed or validated when they affect security, storage, migrations, or money/data movement.
- Handler authorization checks the sender window/frame, current user, tenant/project, and feature permission.
- Errors avoid leaking local paths, tokens, credentials, cookies, or backend internals.

## Preload Review

- Preload exposes intent-specific methods such as `projects.open()` or `updates.check()`.
- Listener APIs return cleanup functions.
- Subscriptions are limited to explicit events.
- No raw `ipcRenderer`, generic `invoke`, generic `send`, Node globals, or unrestricted file/path helpers are exposed.

## Sender And Context Checks

- Use window/frame identity and known trusted origins, not only channel names.
- Reject calls from destroyed, hidden, unauthenticated, logged-out, or wrong-tenant windows.
- Re-check authorization inside every handler; do not trust that the UI hid the button.
- Prevent renderer from reaching administrative or support-only channels.

## Event And Stream Review

- Events include type/version and are scoped per user, tenant, project, and window.
- High-frequency updates are throttled or batched.
- Reconnect paths fetch a snapshot instead of assuming no events were missed.
- Large data uses MessagePort, stream, chunks, or a temporary file with cleanup, backpressure, cancellation, and progress.

## Common Blockers

- `ipcMain.handle('fs:read', ...)` or any arbitrary path/URL command.
- Generic command bus controlled by renderer payload.
- IPC allowed after logout or user/tenant switch.
- Event broadcast sends another window's data.
- Tests cover happy paths only and miss malformed payloads, forbidden sender, and stale session.
