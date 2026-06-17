# CI Gates, Smoke Tests, And Rollback

## CI Release Gates

- install with locked dependencies
- typecheck
- lint
- unit tests
- integration tests for IPC, storage migrations, updater state machine, protocol handlers, and file operations
- build main/preload/renderer
- package per platform/architecture
- rebuild native modules per target
- sign/notarize where required
- verify fuses, ASAR integrity, checksums, and artifact metadata
- run packaged-app smoke tests before publishing stable

## Platform Smoke Tests

- install or unpack artifact
- launch packaged app without dev server
- verify app version, channel, commit, and update feed
- open main window and complete primary flow
- exercise preload/IPC critical path
- verify file dialogs or import/export if release changed file behavior
- verify login/logout and cache cleanup if auth exists
- check logs for security warnings, CSP violations, missing preload, dev endpoints, and updater errors
- quit and relaunch

## Rollout Plan

- Publish internal first, then beta/canary, then stable.
- Track crash rate, startup failures, updater failures, API errors, migration failures, and support tickets.
- Keep update channel promotion manual when release risk is high.
- Record exact artifact set and metadata changes for every promotion.

## Rollback Plan

- Freeze the affected channel.
- Restore previous update metadata or publish a fixed forward version.
- Keep previous artifacts accessible.
- Define how to handle partially migrated local data.
- Provide user-facing recovery steps if local data or install state is affected.
- Revoke or rotate compromised signing/update secrets if integrity is in question.

## Release Checklist

- Pinned versions recorded.
- Official docs checked for version-sensitive release/security behavior.
- Signing/notarization passed.
- Checksums and release notes published.
- Stable metadata points to stable artifacts only.
- Platform smoke tests passed.
- Rollback owner and steps are documented.
