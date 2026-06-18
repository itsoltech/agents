# Metro, Development Build, And Native Build

## Metro And JavaScript

- Start with Metro logs, runtime errors, source map line mapping, bundling warnings, asset resolution, environment values, and package-manager lockfile drift.
- Use `npx expo start --clear` only when stale Metro cache is a plausible cause or after evidence points to bundler cache.
- Check whether the failure depends on dev mode, Fast Refresh, debugger, release mode, Hermes, or minification.
- For Expo Router failures, inspect route files, layouts, route params, deep link handling, auth guard loops, Android back behavior, protected navigation history after logout, and SDK 56+ imports from external `@react-navigation/*` packages in app code.
- For asset failures, verify asset inclusion, dynamic import patterns, platform-specific filenames, bundle output, and whether OTA downloaded the asset.

## Development Build Versus Expo Go

- If a feature uses native dependencies, permissions, app config, push, deep links, custom schemes, native modules, or app-specific identifiers, reproduce in a development build.
- Expo Go success does not prove development, preview, or production build success.
- If a feature works in development build but not production-like build, compare dev tools, environment variables, bundle mode, update runtime, credentials, and native configuration.

## CNG, Prebuild, And Config Plugins

- Inspect app config resolution for every app variant involved.
- Validate public config when leakage, variant mismatch, channel mismatch, or wrong runtime values are suspected.
- If native generated output is wrong, inspect config plugins and generated AndroidManifest, Info.plist, entitlements, Gradle, Pods, and app extensions.
- Use `npx expo prebuild --clean` only after confirming no manual native change is the only copy of important behavior.
- For committed native directories, review generated diffs as source artifacts. For CNG-only repos, reproduce generation in a clean working tree or CI-like environment.
- Check whether environment variables exist locally but not in EAS or CI.

## Native Android

- Use `adb logcat`, Gradle output, Android Studio profiler, and crash stack traces.
- Check package name, manifest entries, permissions, intent filters, app links, notification channels, keystore/signing, ProGuard/R8, Play services, and manufacturer background restrictions.
- Validate behavior on a real lower-end device for performance, memory, list scrolling, push, background, and storage bugs.
- For Android back issues, inspect navigation stack, modal state, nested routers, and custom back handlers.

## Native iOS

- Use Xcode console, device logs, Instruments, Pods output, and native crash reports.
- Check bundle identifier, provisioning, entitlements, Associated Domains, URL schemes, Info.plist usage descriptions, Keychain access groups, APNs credentials, and privacy manifests.
- Test reinstall behavior when Keychain/SecureStore persistence is relevant.
- Validate safe areas, keyboard behavior, dynamic island/status bar, background modes, push, universal links, and store-like release behavior.

## Dependencies And New Architecture

- Run `expo-doctor` and dependency compatibility checks before patching symptoms.
- Check React Native Directory, library release notes, config plugin support, New Architecture compatibility, and whether a newly added package includes native code.
- Rebuild the development binary after native dependency changes.
- For Expo SDK 55+ / React Native 0.82+, do not treat disabling New Architecture as a fix; `newArchEnabled: false` has no practical effect. Identify the incompatible library or behavior and upgrade, patch, isolate, replace, or intentionally remain on SDK 54 or earlier while migrating.
- For custom modules, test Android/iOS separately, especially event emitters, native views, threading, lifecycle, cancellation, and large payloads.
