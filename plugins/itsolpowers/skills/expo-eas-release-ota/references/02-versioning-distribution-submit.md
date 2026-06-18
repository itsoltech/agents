# Versioning, Distribution, And Submit

## Version Fields

- `version` is the user-facing app version.
- `android.versionCode` and `ios.buildNumber` identify platform build uploads.
- `runtimeVersion` identifies native runtime compatibility for OTA updates.
- EAS Update ID identifies a JavaScript/assets update.
- Commit SHA links source to build/update artifacts.

## Versioning Rules

- Increase user-facing version for a new release cycle according to product policy.
- Auto-increment build numbers/version codes when the release process supports it.
- Use remote app version source when the team wants EAS to own platform build numbers and the process allows it.
- Do not use build number as runtime version.
- Create a new runtime after native changes: SDK/RN changes, native dependencies, custom modules, permissions, Info.plist/AndroidManifest, entitlements, app extensions, package/bundle identity, or update-signing model.
- Show version and build number in diagnostics and include version, build number, runtime, channel, and update ID in crash reports.

## Distribution Paths

- Development: team-only builds for native development and dev-client testing.
- Preview/internal: QA and stakeholder builds, controlled access, clear environment labeling, test data, and monitoring.
- Staging/release candidate: TestFlight or Google Play internal/beta track with release-like config and production-compatible runtime where needed.
- Production: store release with store review, rollout controls, monitoring, release notes, support readiness, and rollback plan.

## EAS Submit

- EAS Submit uploads artifacts into store pipelines; it does not replace App Store Connect or Google Play review, rollout, privacy, pricing, content, or manual release decisions.
- First Android upload and some store metadata can require manual setup.
- Use App Store Connect API keys or equivalent automation credentials where appropriate.
- Submit jobs need protected release context and restricted credentials.
- Store release should record artifact ID, platform, track, version/build number, submit job, store status, and approver.

## Store Release Checklist

- Production environment and production channel are correct.
- Runtime version is verified.
- Credentials and certificates are valid.
- Privacy manifests, Data Safety, permissions, and store declarations match behavior.
- Push, deep links, OAuth redirects, source maps, crash monitoring, and release notes are ready.
- Upgrade from previous version and local migrations were tested.
- Release-like E2E or manual smoke passed on built artifacts.

## Blockers

- Production artifact points to preview backend, preview channel, or wrong app identity.
- Build number/version code cannot be uploaded.
- Store privacy declarations do not match SDKs or permissions.
- Submit automation can publish broadly without approval when product policy requires a gate.
