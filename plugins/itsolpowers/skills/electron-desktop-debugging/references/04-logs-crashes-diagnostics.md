# Logs, Crashes, And Diagnostics

## Logging Baseline

Useful logs include:

- timestamp, level, process, app version, channel, platform, architecture
- startup paths and selected config without secrets
- BrowserWindow creation and lifecycle
- IPC channel name, duration, result code, and safe error code
- storage migration name and schema version
- updater state and feed URL with tokens removed
- network correlation IDs, not full sensitive payloads

Avoid logging tokens, cookies, passwords, authorization headers, license keys, full URLs with secrets, PII payloads, local file contents, and raw crash data with sensitive fields.

## Crash Reports

Capture:

- crash process: main, renderer, utility, GPU, or native module
- app version, Electron version, platform, arch, channel
- minidump/report ID, stack trace if available, last safe log lines
- whether crash happens on startup, window creation, IPC, update, storage migration, or heavy work

Crash reports need user/product-approved collection and redaction. Do not enable broad collection silently if the product policy does not allow it.

## Net Logs

Use net logs for controlled diagnostics of proxy, TLS, DNS, and network stack problems. Enable them only for support/debug mode and redact before sharing.

## Diagnostic Bundle

A support export should include:

- app metadata and platform info
- sanitized main/renderer/updater logs
- crash IDs or redacted reports
- storage schema version and migration history
- network/proxy summary when relevant
- reproduction timestamp and correlation IDs

It should not include secrets, cookies, raw tokens, private local file contents, full PII payloads, or signing material.
