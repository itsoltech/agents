# Observability And Maintenance

## Required Release Metadata

Crash reports and diagnostic logs should include:

- App version and Android versionCode or iOS build number.
- Runtime version.
- EAS update ID and channel.
- Commit SHA or build source reference.
- Platform, OS version, device model, and app variant.
- Last screen/route.
- Network connectivity state.
- Pseudonymous user/tenant identifier when safe and useful.
- Request IDs and breadcrumbs for critical actions.

## What To Monitor

- Crash-free users and sessions.
- Startup time, native hangs, and Android ANRs.
- API error rate and latency.
- Auth refresh failures.
- Local migration failures.
- Offline queue size and sync success.
- Push delivery receipts.
- Adoption of new binaries and update IDs.
- Errors grouped by app variant, platform, runtime, channel, and update ID.

## Data Hygiene

- Do not log tokens, passwords, full auth headers, private keys, full response bodies with user data, photos, medical data, or raw sensitive payloads.
- Redact or hash identifiers when product requirements do not need direct identity.
- Keep source maps out of public assets. Upload them to crash reporting from controlled CI.
- Verify source map upload matches build/update metadata; wrong source maps can make stack traces misleading.

## Performance Regression Triage

- Profile release-like builds, not only development mode.
- Compare startup, memory, list performance, native module calls, bundle size, asset size, and local migrations before and after the suspected change.
- Check heavy root layout work, global context rerenders, large lists in `ScrollView`, full-resolution images, large generated clients, broad package imports, duplicate dependencies, and analytics SDK startup cost.
- Use platform tools for native hangs, memory, and CPU: Android Studio profiler, Xcode Instruments, and release crash/ANR data.

## Maintenance Signals

- Regularly review crashes, dependency health, `expo-doctor`, build health, Expo SDK currency, permissions/privacy, app size, startup time, credentials recovery, store access, and OTA channels.
- Refactor when screens directly own API/storage/native details, auth refresh exists in multiple places, app config changes require manual native edits, SDK upgrades are slow due to undocumented patches, state boundaries are unclear, dependency cycles cause bugs, or release depends on one person's knowledge.
- Avoid large architecture rewrites without staged migration and working builds throughout.

## Debugging Report Contract

Return:

1. Boundary classified and evidence inspected.
2. Reproduction mode and whether Android/iOS differ.
3. Root cause or strongest hypothesis with confidence.
4. Files/configs/logs implicated and affected behavior.
5. Fix applied or recommended.
6. Verification performed, including build/update/platform mode.
7. Residual risks, missing diagnostics, and follow-up tests.
