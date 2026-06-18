# Permissions, Privacy, And Storage

## Permissions

- Request permissions only in feature context, with a clear pre-prompt when the product needs explanation.
- Handle granted, denied, blocked, limited, unavailable, and changed-in-settings states.
- Do not add permissions that the app does not use.
- Review permissions added automatically by native dependencies and config plugins.
- Use Android blocked permissions when a dependency adds a permission that is not required.
- iOS usage descriptions must describe the real feature reason; vague strings can fail review and confuse users.
- Permission, entitlement, Info.plist, AndroidManifest, associated domain, URL scheme, app extension, or background mode changes require a new binary build.

## Privacy

- Maintain an inventory of data collected by the app and by SDKs.
- Review analytics, crash reporting, attribution, ads, push, and monitoring SDKs for data collection, retention, sharing, and opt-out needs.
- Keep App Store privacy labels, iOS privacy manifests, Google Play Data Safety, and product privacy policy aligned with actual behavior.
- Avoid collecting stable identifiers unless the product needs them; anonymize or pseudonymize where possible.
- Provide deletion/export behavior when the product or regulation requires it.

## Storage

- Separate secrets, server cache, durable domain data, offline queue, files, temp data, logs, and diagnostics.
- SecureStore is for small sensitive values; do not use it as a general database.
- SQLite and file storage need schema versions, migrations, corruption handling, and cleanup behavior.
- iOS Keychain can persist across reinstall in some cases; account for that in logout, reinstall, and QA.
- Diagnostic bundles must redact tokens, personal data, payload bodies, sensitive URLs, and local paths where required.

## Tests And QA

- Permission denied, blocked, limited, and settings-changed states.
- Fresh install, upgrade, reinstall, logout, account switch, and offline start.
- Storage migration from previous versions and rollback-sensitive OTA.
- Dependency-added permission review on both Android and iOS generated native config.
- Store/privacy declaration review before release.

## Red Flags

- Permission requested on first launch with no feature context.
- Permission exists only because a dependency added it by default.
- Store privacy declarations are treated as release paperwork instead of implementation truth.
- Sensitive data is stored in AsyncStorage, normal SQLite, files, logs, or screenshots without a product decision.
