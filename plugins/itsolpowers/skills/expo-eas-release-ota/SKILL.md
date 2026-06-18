---
name: expo-eas-release-ota
description: "Expo EAS release: build profiles, credentials, submit, app versions, OTA runtime/channels, rollout, rollback, CI/CD."
---

# Expo EAS Release OTA

Plan and review Expo releases as two linked paths: native store or internal binaries through EAS Build/Submit, and JavaScript/assets updates through EAS Update with runtime compatibility.

## Process

1. Inspect Expo SDK/RN pins, package manager, Node version, `app.config.*`, `eas.json`, EAS CLI version policy, `expo-updates`, runtime version, channels, credentials, app variants, CI, store metadata, source maps, monitoring, and release evidence.
2. For an existing repo, detect repo-pinned Expo SDK, React Native, EAS CLI, Node, package manager, `expo-updates`, and platform target versions before judging commands or config. For a new app, use latest stable. For EAS Build, Submit, Update, runtime, rollout, rollback, credentials, or store behavior, check current official docs through `itsol-current-tech-context`.
3. Read [references/guide.md](references/guide.md), then load only the reference files matching the release decision or failure.
4. Classify the change: development/preview build, release-candidate store build, production store release, OTA update, republish, rollback, credentials rotation, or CI/CD change.
5. Gate release with compatibility checks, lint/typecheck/tests, `expo-doctor`, generated-code checks, prebuild/config-plugin validation when relevant, build/submit checks, release-like E2E, monitoring, and rollback readiness.
6. Plan rollback before release: previous binaries, compatible runtime, update republish, channel freeze, feature flag or kill switch, local migration safety, support notes, and owner.

## Output

For plans, produce build/update classification, profile/channel/runtime decisions, required credentials, artifact and submit path, CI gates, QA matrix, rollout, rollback, monitoring, and residual risks. For reviews, lead with blockers that could ship the wrong binary, wrong channel, incompatible OTA, leaked credentials, unreviewed store release, or unrollbackable migration.
