# Frontend, WebView, And IPC

## WebView Symptoms

Check:

- system WebView differences: WebView2 on Windows, WKWebView on macOS, WebKitGTK on Linux
- APIs assumed by the frontend that are Chromium-specific
- CSP failures in packaged build
- route/base path issues under Tauri protocol
- fonts, drag/drop, file dialogs, high DPI, and focus behavior by OS
- dev-only HMR allowances leaking into production or production CSP being too strict

Verify the same flow in packaged mode when asset loading, CSP, protocol, or platform WebView behavior is involved.

## Frontend Adapter

Look for raw `invoke` imports outside the adapter layer, mismatched command names, stale generated types, and inconsistent error mapping.

Common failures:

- command renamed in Rust but not frontend
- payload uses camelCase while Rust DTO expects another shape
- frontend parses error strings instead of structured errors
- component unmounted before async result resolves
- query/cache key omits account, tenant, project, or local context
- logout does not clear frontend cache

## Events And Channels

Check:

- listener registered multiple times
- listener not disposed on unmount
- wrong window receives or misses event
- payload shape changed without UI update
- high-frequency progress events block UI
- event contains sensitive data and is redacted or dropped by logging

For long-running work, confirm the UI uses `operation_id` and can distinguish parallel operations.

## IPC Debug Steps

1. Confirm frontend calls the intended adapter method.
2. Confirm adapter invokes the exact registered command.
3. Log sanitized payload shape and command duration.
4. Confirm Rust command receives the DTO.
5. Confirm return/error shape matches frontend expectations.
6. For large payloads, measure size and switch to file/DB/chunk/resource strategy if IPC is the bottleneck.
