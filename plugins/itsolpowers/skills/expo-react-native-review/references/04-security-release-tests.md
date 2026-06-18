# Security, Release, Tests, And QA

## Security Review

- No bundled value is a secret: JavaScript bundle, assets, app config, `EXPO_PUBLIC_*`, and public SDK keys are inspectable.
- Backend authorization must enforce user, account, tenant, and object ownership independent of the mobile UI.
- Refresh tokens belong in SecureStore or equivalent native secure storage; access tokens should be short-lived and kept in memory when possible.
- Logout must clear secrets, account cache, local data that should not persist, live connections, and background work.
- Deep links, universal links, notification payloads, and route params are untrusted input.
- WebView should not receive tokens for external pages; restrict origins, navigation, JavaScript bridge, and message validation.

## Permissions And Privacy

- Request permissions in feature context and handle denied, blocked, limited, and changed-in-settings states.
- Review Info.plist usage descriptions, Android manifest permissions, blocked Android permissions, entitlement changes, and automatically added permissions from dependencies.
- Permission, entitlement, manifest, scheme, associated domain, and app extension changes require a new binary build.
- Store privacy forms, Data Safety, iOS privacy manifests, analytics SDK data collection, retention, and deletion behavior must match the implementation.

## Release And OTA Review

- Decide whether the change is a store/preview binary change or an OTA-safe JavaScript/assets change.
- OTA is only safe when the update is compatible with the installed native runtime and existing assets.
- Runtime version, channel, branch/update ID, commit SHA, environment, and rollout percentage should be traceable in logs or release metadata.
- Stage OTA on a build with the same runtime and release-like configuration before production.
- Local migrations, offline queues, feature flags, and API compatibility must tolerate rollback or forward-fix.
- High-risk releases need stop conditions, monitoring, owner, rollback path, and support notes.

## Tests And QA

- Unit tests: domain logic, DTO mapping, validation, auth state machine, storage adapters, native module wrappers, and offline queue logic.
- Integration tests: API client plus auth, query cache behavior, storage migrations, navigation plus auth state, deep link validation, notification open, and mocked native boundary.
- E2E/manual tests: built artifact cold start, login/logout, token refresh, primary flow, API error, offline, permission denial, deep link, notification open, background/resume, upgrade, local migration, and staging OTA.
- CI should include repo-equivalent `expo install --check`, `expo-doctor`, lint, typecheck, tests, generated-code check, config-plugin/prebuild validation when relevant, and release-like E2E for critical flows.

## Blockers

- Production OTA without runtime/channel/staging evidence.
- Native change hidden inside an OTA-only plan.
- Permission/privacy change without store declaration or user-facing rationale.
- Security-sensitive flow reviewed only through happy-path UI tests.
- No rollback plan for a release that can migrate durable local data.
