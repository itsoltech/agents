# EAS Build, Update, And Runtime

## EAS Build Failures

- Reproduce cloud-only failures with `eas build --local` when practical.
- Compare local and EAS Node, package manager, lockfile, environment, secrets, private registry access, EAS CLI version, build profile, and cache.
- Inspect `.easignore` for missing files such as generated clients, native modules, config plugins, patches, assets, credentials placeholders, or test fixtures used during build.
- Check resolved app config in the EAS environment, not only local config.
- Confirm profile fields: distribution, developmentClient, channel, environment, autoIncrement, Node version, image, credentials, and platform-specific settings.
- Do not add arbitrary sleep/retry hooks without evidence of the failing step.

## Signing And Credentials

- Verify iOS bundle identifier, provisioning profile, certificates, entitlements, Associated Domains, APNs, and App Store Connect access.
- Verify Android package name, keystore, service account, Play track, AAB/APK expectations, app signing ownership, and credentials source.
- Treat credentials changes as sensitive operational changes. Record owners and avoid manual overwrite without procedure.
- Production release should not depend on a single person's local machine or hidden credentials.

## EAS Environment And Variants

- Confirm the build profile's `environment`, app variant, bundle ID/package name, scheme, backend URL, channel, telemetry DSN, credentials, and visible app name/icon.
- Do not assume local `.env` equals EAS environment variables.
- Remember `EXPO_PUBLIC_*` values are bundled public values, not secrets.
- If a preview build hits production or production hits preview, inspect config resolution and EAS profile inheritance first.

## OTA Failure Triage

Capture:

- Installed binary app version and build number/versionCode.
- Runtime version.
- Channel and branch.
- Update ID, platform, commit SHA, and environment.
- Whether the failing JS is embedded or remote OTA.
- Whether the update was downloaded, applied, and launched.
- Asset download status and startup crash timing.

## Runtime And Channel Rules

- OTA can change compatible JavaScript, TypeScript, and assets only.
- New SDK, React Native, native dependency, custom Swift/Kotlin module, permission, Info.plist, AndroidManifest, entitlement, app extension, bundle ID/package name, or update code signing change needs a new binary.
- Do not publish an update to an old runtime if the JS expects a new native module.
- Users may have multiple binary runtimes in the field; hotfix the correct runtime.
- Staging should use the same runtime and environment as production when validating a production OTA.

## Rollout, Rollback, And Republish

- During diagnosis, avoid publishing random new updates to the same runtime/channel; it obscures device state.
- Rollback may not undo local migrations or code already executed on a device.
- Use a kill switch or feature flag when it is safer than relying on full update rollback.
- Check crash-free sessions, startup, API errors, support contacts, and update adoption by update ID before expanding rollout.
- Keep local schema changes backward compatible across rollback whenever OTA can affect them.

## Update Application Behavior

- Do not poll for updates in tight loops.
- Good check points are cold start, foreground after a meaningful interval, or explicit support/diagnostic action.
- Do not reload while users are filling forms, uploading data, or making payments.
- Log check, download, reload, launch, failure, timeout, and offline handling.
- Test update behavior on a release-like build; development mode does not represent the full `expo-updates` path.
