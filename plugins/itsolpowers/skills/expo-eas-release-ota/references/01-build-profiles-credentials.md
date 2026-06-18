# Build Profiles And Credentials

## Inputs To Inspect

- `eas.json`
- `app.config.*` or `app.json`
- package manager lockfile and Node/toolchain pins
- Expo SDK, React Native, `expo-updates`, `expo-dev-client`, and native dependency versions
- EAS CLI version policy
- app variants, bundle IDs, package names, schemes, icons/names, update channels, and environments
- credentials ownership, signing config, CI secrets, and build logs

## Profile Model

- Maintain distinct profiles for development, simulator/emulator when needed, preview/internal QA, release-candidate, and production.
- Development builds contain dev tooling and are not final evidence for store startup, signing, splash, push credentials, or update behavior.
- Preview builds should be close to production while remaining easy to distribute internally.
- Release-candidate store builds should use the same runtime and release-like configuration as production when validating the same OTA artifact.
- Production builds should require clean source state, protected release context, and traceable artifacts.

## App Variants And Environments

- Development, preview/staging, and production should be separate apps at least by bundle ID/package name when parallel install, data separation, push, or update isolation matters.
- Each variant should have deliberate app name/icon, scheme, associated domains, backend URL, update channel, credentials, push config, and monitoring environment.
- Do not assume local `.env` matches EAS environment values.
- EAS secret values can be protected during the job but become public if embedded into the app.

## Credentials And Signing

- Restrict Apple Developer, App Store Connect, Google Play, EAS, Android keystore, service account JSON, and update-signing key access.
- Prefer individual accounts, API keys, short-lived credentials, and protected release jobs over shared passwords.
- Keep private keys and service account JSON out of repo and logs.
- Document credential owner, backup, rotation, expiration, revocation, and recovery.
- Require extra review for credentials rotation, app transfer, package/bundle ID changes, and production signing changes.

## Build Diagnostics

- Keep build ID, artifact URL or identifier, commit SHA, profile, environment, channel, runtime version, SDK version, Node version, and platform target in release records.
- Use local EAS builds when cloud-only failures need isolation, but verify final release behavior with the intended release path.
- Pin tools that affect reproducibility, such as Node, package manager, EAS CLI, and Xcode image where supported.

## Blockers

- Production profile can build from dirty or unreviewed source.
- Preview and production share identifiers or channels unintentionally.
- Release secrets are exposed to untrusted PRs.
- Native-affecting change has no new binary build.
- Credentials owner or recovery path is unknown.
