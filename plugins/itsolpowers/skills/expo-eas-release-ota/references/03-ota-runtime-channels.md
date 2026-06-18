# OTA Runtime And Channels

## OTA Eligibility

OTA can ship JavaScript, TypeScript, copy, styling, UI, and assets that are compatible with the native runtime already installed.

OTA cannot ship:

- Expo SDK or React Native changes.
- New or changed native dependencies.
- Custom Swift/Kotlin changes.
- New permissions, entitlements, Info.plist, AndroidManifest, app extensions, URL schemes, package names, or bundle IDs.
- Update code-signing model changes.
- Any code that requires native runtime not present in the target binary.

## Runtime Version

- Runtime version describes compatibility between the JavaScript bundle and the installed native runtime.
- A simple default for many apps is a policy tied to user-facing app version, but verify current official guidance and repo needs.
- Hotfixes must target the runtime used by affected binaries.
- Users can have multiple production binaries with different runtimes.
- Keep a staging build with the same runtime as production before promoting updates.
- Fingerprint-based policies require current-doc and repo maturity review before adoption.

## Channels And Branches

- Typical channels are development, preview, staging, and production.
- A binary is assigned to a channel; updates are published to channels/branches according to current EAS semantics.
- Branch names do not need to mirror every Git branch.
- Do not publish production OTA from dirty local state.
- Record commit SHA, channel, branch/update group, runtime, environment, and update ID.
- Stable production should never point to preview or staging updates by accident.

## OTA Publish Flow

1. Change passes lint, typecheck, tests, generated-code checks, and review.
2. Publish preview update for QA on a compatible development/preview build.
3. Publish staging update using the same runtime and release-like environment as production.
4. Test on built artifact, not only Metro development server.
5. Republish or promote the tested update to production according to current EAS behavior; avoid rebundling from a different source state.
6. Start with a small rollout when risk is meaningful.
7. Monitor crash-free sessions, startup, API/auth errors, support, and update adoption.

## Code Signing And Update UX

- Evaluate EAS Update code signing for higher-risk apps; keep private keys out of repo and restrict production signing.
- Plan certificate/key rotation before expiration or compromise.
- Check for updates at safe moments such as cold start, foreground after a meaningful interval, or explicit support action.
- Do not reload during forms, payments, uploads, or critical workflows without a product decision.
- Distinguish update checked, downloaded, applied, and launched in telemetry.
- Handle offline, timeout, no update, failed download, failed launch, and recovery paths.

## Blockers

- OTA includes native or native-config changes.
- Runtime mismatch is unknown.
- Staging and production use different environments for the same tested artifact.
- Monitoring cannot identify update ID or rollout cohort.
- Local migration cannot tolerate rollback or forward-fix.
