# API, Storage, UI, And Platform Behavior

## API And Server State

- API access should use one client layer with typed request/response models and consistent auth/error handling.
- Generated API clients should be regenerated from the contract and committed with a clean, reviewable diff.
- TanStack Query or equivalent server-state cache should use stable keys that include user, tenant, locale, and environment where relevant.
- Mutations should invalidate or update the right queries, handle retries deliberately, and avoid duplicate submission on fast taps.
- Logout or account switch must clear account-scoped cache, live subscriptions, queued mutations, and sensitive local data.
- Offline behavior needs explicit rules: what is readable offline, what can be queued, conflict handling, retry, cancellation, and user-visible status.

## Local Storage

- Separate UI state, server cache, durable local domain data, files, logs, and secrets.
- Use SecureStore or an equivalent native-backed secure adapter for small sensitive values such as refresh tokens; do not use AsyncStorage for secrets.
- SQLite, file caches, offline queues, and migrations need schema versioning, idempotent migrations, corruption handling, and upgrade tests.
- Define what survives logout, account switch, reinstall, iOS Keychain retention, and OTA rollback.
- Do not log token values, full payload bodies, or sensitive local paths.

## UI And Accessibility

- Check loading, empty, error, offline, retry, disabled, permission denied, and partial-data states.
- Touchable controls should have proper labels, hit targets, disabled states, and duplicate-submit protection.
- Test standard and large text, screen reader basics, light/dark mode, slow devices, slow network, and orientation assumptions where relevant.
- Lists, images, animations, and heavy renders should be profiled on target devices, not only simulators.
- Avoid startup-blocking work in root components, global providers, and navigation layouts.

## Platform Matrix

- Test on Android and iOS, including at least one real device when permissions, push, deep links, camera, files, biometrics, background tasks, or performance are involved.
- Cover current supported OS versions and the oldest supported versions when available.
- Include fresh install, upgrade from previous store version, existing OTA update, offline start, background/resume, process restore, and low-storage cases for release-risk changes.
- Do not assume simulator behavior matches device behavior for push, biometrics, camera, deep links, keychain/keystore, or background execution.

## Review Risk Flags

- API or cache behavior is correct only for one account/tenant.
- Storage migration is untested against previous app data.
- UI state hides a failed operation or keeps stale sensitive data after logout.
- Platform-specific code has no target-platform QA evidence.
- Performance-sensitive code was checked only in Metro development mode.
