# Update Integrity And Supply Chain

## OTA Integrity

- EAS Update changes JavaScript, TypeScript, and assets only when compatible with the installed native runtime.
- Do not use OTA to ship new native dependencies, SDK upgrades, permissions, entitlements, URL schemes, Info.plist/AndroidManifest changes, or update-signing changes.
- Runtime version, channel, environment, update ID, and commit SHA should be traceable in telemetry and release metadata.
- Production updates should be staged on a build with the same runtime and release-like configuration.
- High-risk apps should evaluate EAS Update code signing and key rotation support.

## Update Signing And Credentials

- Keep update-signing private keys, Apple credentials, Android keystores, service account JSON, EAS tokens, and store credentials out of repo and logs.
- Restrict production signing and publish jobs to protected branches, protected tags, manual approvals, or controlled release workflows.
- Public certificates or public keys can be part of the app when the official update-signing model requires it.
- Plan key rotation before expiration or compromise.
- Do not grant release secrets to untrusted pull requests.

## Dependency And Native Package Review

- Check Expo SDK compatibility, New Architecture support, platform support, maintenance status, license, and transitive native code.
- Review permissions, background modes, URL schemes, associated domains, entitlements, analytics collection, and config plugin side effects added by packages.
- Prefer maintained Expo modules or well-supported React Native packages over unmaintained native bridges.
- Use the repo's pinned package manager and lockfile; do not mix lockfiles.
- Run dependency audit/license checks appropriate to the repo.

## CI Gates

- `expo install --check`, `expo-doctor`, lint, typecheck, tests, and generated-code checks.
- Config plugin tests or prebuild validation when native config is generated.
- Preview binary after native/security-sensitive changes.
- Release-like E2E for auth, permissions, deep links, storage cleanup, and OTA staging when relevant.
- Artifact/source-map handling that avoids public secret or source exposure.

## Red Flags

- OTA publish job can run from any branch or local uncommitted state.
- Production update is unsigned or signed by a broadly accessible key when risk requires signing.
- Dependency adds permissions or native code without review.
- Release credentials are available to fork PRs or ordinary CI test jobs.
- Source maps are published as public assets.
