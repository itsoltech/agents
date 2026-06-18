# Evidence And Triage

## Problem Report

Capture:

- Expected behavior, actual behavior, impact, first known bad version, and smallest reproducible steps.
- Platform, OS version, device model, simulator/emulator versus real device, app variant, network state, foreground/background state, and whether the app was upgraded or freshly installed.
- App version, Android versionCode or iOS build number, runtime version, EAS update ID, channel, commit SHA if available, and release environment.
- Expo SDK, React Native, React, Expo Router, EAS CLI, Node, package manager, lockfile state, native dependencies, and whether `android/` or `ios/` are generated or committed.

## Classify The Boundary

Classify before changing code:

- JavaScript/React rendering or state.
- Expo Router/navigation/deep link.
- Metro/bundling/asset resolution.
- Development build versus Expo Go.
- Native Android or native iOS.
- CNG/prebuild/config plugin/app config.
- Dependency/New Architecture/native module.
- EAS Build/signing/credentials/environment.
- OTA/runtime/channel/branch/update asset.
- API/network/auth/TanStack Query.
- Storage/migration/filesystem/SecureStore.
- Device lifecycle/background/push/permission.
- Observability/source maps/missing metadata.

## Evidence Sources

- Metro logs and terminal output.
- React Native DevTools and Expo development menu.
- `npx expo-doctor`, dependency checks, and resolved app config.
- `npx expo config` and public config when config leakage or variant mismatch is suspected.
- Android `adb logcat`, Android Studio profiler, Gradle output, and crash traces.
- Xcode console, device logs, Instruments, Pods output, and native crash traces.
- EAS build logs, build profile, environment, credentials, `.easignore`, and artifact metadata.
- EAS Update deployment/debug info: update ID, channel, branch, runtime version, platform, environment, and asset status.
- Crash reporting, breadcrumbs, request IDs, API logs, storage migration logs, and source map upload status.

## Repro Isolation

- Reproduce in the mode that fails: Expo Go, development build, preview build, store-like release build, local native run, EAS cloud build, EAS local build, embedded update, or remote OTA.
- If production fails, compare remote OTA disabled or embedded update behavior before assuming the latest JS bundle is running.
- Compare Android and iOS rather than assuming parity.
- Test fresh install and upgrade path separately.
- Preserve failing storage state when storage or migration is suspected.
- Avoid clearing all caches at the start; cache resets can hide upgrade, migration, and stale-artifact bugs.

## Fix Discipline

- Change one boundary at a time and keep evidence before/after.
- Prefer a minimal reproduction or failing test when practical.
- Add regression coverage for the bug's boundary: unit, integration, E2E, config plugin test, native module test, or documented manual smoke.
- For user-facing defects, use `itsol-bug-debugging` and follow any required Technical Fix Plan gate.
