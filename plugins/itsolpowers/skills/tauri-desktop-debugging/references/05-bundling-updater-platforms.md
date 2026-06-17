# Bundling, Updater, And Platform Failures

## Packaged-Only Bugs

If `tauri dev` works but packaged app fails, check:

- `tauri.conf.*` product name, identifier, resources, external binaries, CSP, windows
- asset paths and frontend base path under Tauri protocol
- included resources and sidecars in final bundle
- app data, cache, config, log, and temp directories
- production feature flags and debug-only code
- source maps and minification side effects
- code signing, quarantine, notarization, SmartScreen, installer permissions

Always inspect the actual built artifact or installed app layout, not only config intent.

## Updater

Updater failures need release evidence:

- app version and channel
- update endpoint response and metadata
- artifact URL, status code, checksum/signature
- public/private key lifecycle and signing step
- migration from previous supported version
- rollback/downgrade behavior
- offline/no-update/error response handling

Test no internet, no update, malformed metadata, signature mismatch, artifact 404, interrupted download, low disk, restart, and old-version upgrade.

## Platform-Specific Failures

Windows:

- WebView2 runtime, long paths, locked files, installer elevation, SmartScreen, antivirus, corporate proxy

macOS:

- signing/notarization, quarantine, entitlements, keychain prompts, Apple Silicon vs Intel, WKWebView behavior

Linux:

- WebKitGTK version, distro dependencies, AppImage/RPM/Deb differences, executable bits, desktop integration, sandbox assumptions

Do not claim platform parity from one OS. Use target-OS smoke tests for features touching files, process, updater, tray/menu, deep links, or packaging.

## Diagnostic Handoff

Report:

- boundary suspected and evidence
- exact artifact/mode tested
- logs collected and redaction status
- version pins found
- official docs checked through `itsol-current-tech-context` when version-sensitive
- fix and regression test or manual verification
