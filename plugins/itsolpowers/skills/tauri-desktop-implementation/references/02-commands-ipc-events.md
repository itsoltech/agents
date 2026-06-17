# Commands, IPC, Events, And Channels

## Command Design

Name commands by domain operation: `settings_get`, `settings_save`, `project_import`, `file_pick_and_parse`. Avoid catch-all commands like `execute(action, payload)`.

Each command should:

- deserialize typed DTOs
- validate untrusted input in Rust
- call a service instead of holding domain logic inside the macro function
- return a stable typed result or typed serializable error
- avoid leaking stack traces, token values, raw paths, or internal error text
- support cancellation/progress for long-running operations
- be testable through underlying services without a WebView

Register commands explicitly in the Tauri builder. When adding a command, update both the Rust `generate_handler!` registration and the frontend adapter contract.

## Error Contract

Prefer tagged errors that the frontend can match without parsing strings:

```rust
#[derive(Debug, serde::Serialize)]
#[serde(tag = "type", content = "data")]
enum AppError {
    Validation { field: String, message: String },
    NotFound { resource: String },
    PermissionDenied { action: String },
    Io { message: String },
    Unexpected { request_id: String },
}
```

In UI code, map these errors to UX states. Do not key behavior off localized or free-form Rust messages.

## Payload Rules

- Do not send large files as base64 JSON through IPC.
- Use temporary files, local database rows, streaming/resource handles, chunking, or sidecar pipes for large data.
- Log command start/end and payload sizes, not full sensitive payloads.
- Include `request_id` or `operation_id` for long work and diagnostics.

## Events And Channels

Use request/response commands for normal data fetches. Use events/channels for progress, background status, cross-window notifications, and long-running tasks.

Event rules:

- domain names such as `sync:progress`, `project:updated`
- typed, versioned payloads where contracts may evolve
- no secrets in payloads
- `operation_id` for concurrent operations
- throttling or batching for high-frequency updates
- frontend listeners registered and disposed in component lifecycle

For multiple windows, decide whether an event is global or window-specific. Do not assume every webview should receive every event.
