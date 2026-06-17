# Commands And IPC Contracts

## Command API Review

- Use explicit command names such as `settings_get`, `project_import`, or `file_pick_and_parse`.
- Prefer one small operation per command over a generic `execute(action, payload)` dispatcher.
- Deserialize arguments into typed DTOs and validate them in Rust.
- Authorize or scope privileged operations in Rust even if the frontend UI hides the control.
- Return typed success data and stable typed errors; do not make the UI parse human error text.
- Keep stack traces, internal paths, secrets, and raw dependency errors out of UI-facing errors.

## Frontend Adapter Review

- Centralize Tauri calls in a typed adapter layer.
- Map command errors into UI error variants near the adapter or feature boundary.
- If using TanStack Query, treat commands like API calls: stable query keys, account/tenant scoping, mutation invalidation, and cache clearing on logout.
- Register event listeners in component lifecycle and always clean them up.
- Avoid leaking `@tauri-apps/api` imports into arbitrary components.

## Events And Long Operations

- Use commands for request/response and events/channels for progress, notifications, background state, and multi-window communication.
- Include `operation_id` for progress so concurrent jobs do not collide.
- Provide cancellation for long operations when the user can reasonably stop them.
- Version event payloads or keep stable shapes when the event is consumed by multiple windows or releases.
- Avoid sending secrets or high-volume data through events.

## Abuse And Regression Cases

- Malformed DTO or missing required field.
- Path traversal, symlink escape, or file moved after selection.
- Very large file or payload.
- Command called from a window that should not have access.
- Listener registered twice after route changes.
- Operation continues after logout or window close.
- Error path returns inconsistent shape and breaks UI handling.
