# Rollout, Rollback, And CI

## CI Gates

- Install with the repo package manager and lockfile.
- Run repo-equivalent `expo install --check`, `expo-doctor`, lint, typecheck, unit tests, and integration tests.
- Regenerate API clients and fail on dirty generated-code diffs when applicable.
- Validate config plugins or run prebuild validation when native config is generated.
- Build preview binary after native changes.
- Run E2E on a release-like artifact for critical flows.
- Do not expose release secrets to fork PRs or untrusted jobs.
- Production store releases and production OTA should require protected context and manual approval when risk or policy requires it.

## Rollout

- Start risky production OTA or store rollout with a small cohort.
- Define stop conditions before rollout: crash rate, startup failure, ANR, API/auth failures, support volume, conversion errors, or data migration errors.
- Track build version, runtime, channel, update ID, rollout percentage, platform, OS, and app variant in telemetry.
- Do not increase rollout when signals are unclear.
- Avoid concurrent production OTA updates for the same runtime during active rollout unless the process explicitly handles it.

## Rollback And Recovery

- Freezing the affected channel can be safer than publishing another untested update.
- OTA rollback may not undo code already run on the device or local migrations already applied.
- Republish a known stable update or ship a forward fix depending on runtime compatibility and local data state.
- Feature flags or kill switches can be faster than OTA rollback for server-controlled behavior.
- Keep previous binaries, artifacts, update groups, and metadata reachable until risk expires.
- Define support steps for corrupted local state, stuck update, failed migration, or broken login.

## Post-Release Checks

- Crash-free sessions, startup failures, ANR, API/auth errors, push receipts, update adoption, store reviews, and support tickets.
- Source maps uploaded privately to approved monitoring; do not publish source maps as public assets.
- Confirm production channel and runtime are receiving expected updates.
- Confirm no dev endpoint, preview backend, or test credentials are present.
- Record incident notes and process changes after release issues.

## QA Matrix

- Fresh install and upgrade from previous store version.
- Existing OTA update before new binary.
- Offline start, slow network, interrupted download, low storage, app close during update, and resume after update.
- Android and iOS real devices for push, deep links, permissions, biometric/keychain, camera, files, and background behavior.
- Old supported OS version where available.
- Logout, account switch, local data cleanup, and migration rollback scenarios.

## Release Checklist

- Pinned versions recorded and official docs checked for version-sensitive behavior.
- Runtime/channel/environment/profile decisions are explicit.
- Build/submit/update artifacts include commit SHA and provenance.
- Credentials and update-signing keys are protected.
- Release-like tests passed.
- Monitoring and source maps are ready.
- Rollback owner and steps are documented.
