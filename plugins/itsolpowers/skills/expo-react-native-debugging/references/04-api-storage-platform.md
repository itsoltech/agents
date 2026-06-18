# API, Storage, And Platform Failures

## API And Network

- Capture request ID, endpoint, method, app version, build number/versionCode, runtime version, update ID, app variant, platform, network state, and whether the request was cancelled or retried.
- Distinguish offline, DNS, TLS, timeout, 4xx, 5xx, backend validation, auth refresh, and client parsing failures.
- Check base URL by app variant and EAS environment; wrong backend is often a config issue.
- For generated clients, confirm generated code matches the OpenAPI contract and was not manually edited.
- For TanStack Query, inspect query keys, enabled flags, retry settings, stale time, invalidation, focus/reconnect behavior, optimistic updates, and cache clearing on logout.
- For duplicated mutations, check double taps, disabled states, idempotency keys, retry settings, and navigation race conditions.
- For stale data, check tenant/user keys, session-scoped QueryClient, foreground refetch behavior, and live-event cache updates.

## Auth And Session

- Check token refresh locking when many requests receive 401.
- Confirm refresh token storage uses SecureStore or equivalent protected storage, not AsyncStorage.
- Verify logout clears protected navigation history, query cache, user-specific durable data, live connections, push token association if required, and pending sensitive work.
- Do not assume hidden UI enforces authorization; validate backend authorization separately.
- Investigate clock skew and background resume after long inactivity for token expiry symptoms.

## Offline And Sync

- Preserve the failing local database/queue when possible.
- Inspect local IDs, pending queue state, retry count, backoff, conflict status, server timestamps, and idempotency behavior.
- Check whether background task assumptions are invalid; mobile OS may delay or skip work.
- Test no network at app start, network loss mid-request, Wi-Fi to cellular switch, captive portal, high latency, and responses returning after screen exit.
- For OTA-related sync bugs, verify schema compatibility and rollback behavior.

## Local Storage

- SecureStore failures: check native errors, biometric changes, unavailable hardware, invalidated keys, reinstall behavior on iOS, size of stored values, and logout cleanup.
- AsyncStorage/key-value failures: check corrupt JSON, missing values, schema changes, multi-user contamination, and accidental storage of secrets.
- SQLite failures: inspect migrations, partial migration, constraints, indexes, transaction boundaries, legacy schema, no disk space, and upgrade from every supported previous app version.
- Filesystem failures: check cache versus durable document location, OS cleanup, free space, atomic writes, MIME/magic-byte validation, path traversal, and stale file references.

## Permissions, Deep Links, And Push

- For permission bugs, test denied, blocked, limited, revoked in settings, no hardware, and permission changes while the app is running.
- Check AndroidManifest, Info.plist usage descriptions, config plugins, blocked permissions, and whether a new binary was built after permission changes.
- For deep links/universal links, test cold start, warm start, background, logged out, malformed params, unexpected route, OAuth redirect, and protected screens.
- For push, verify credentials, token registration/update/delete, app variant, user association, receipts, notification payload validation, foreground/background/cold-start handling, deduplication, and Android notification channels.

## Platform-Specific Symptoms

- Android: back button, keyboard resize, notification channels, app links, background restrictions, file picker, biometrics, permissions, low-end memory, and manufacturer behavior.
- iOS: safe area, dynamic island/status bar, Keychain persistence, associated domains, APNs, privacy manifests, background modes, universal links, and TestFlight/store behavior.
- Keep platform differences explicit. Do not hide divergent behavior behind broad abstractions until the root cause is known.
