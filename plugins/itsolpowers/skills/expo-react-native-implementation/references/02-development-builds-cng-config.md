# Development Builds, CNG, And Config

## Development Builds

- Use development builds as the default for production-grade Expo apps.
- Expo Go is acceptable for learning, prototypes, and purely JavaScript experiments, but it does not represent app-specific native runtime behavior.
- Create a new development build after native dependency changes, config plugin changes, native app config changes, permissions, URL schemes, universal links, associated domains, icons, splash screen, bundle ID/package name, Expo SDK/React Native changes, or custom Swift/Kotlin module changes.
- Test push notifications, permissions, deep links, native modules, and app-specific identifiers in a development or preview build, not Expo Go.

## Continuous Native Generation

- With CNG, treat `android/` and `ios/` as generated from app config, config plugins, and dependencies unless the repo explicitly owns native projects.
- Do not hand-edit generated native files without representing the change in app config or a config plugin; `prebuild --clean` can remove manual changes.
- Config plugins should be deterministic, idempotent, parameterized, validated, and explicit about what requires a rebuild.
- Review generated native diffs when native directories are committed. If they are not committed, run prebuild in CI or a validation job for native-affecting changes.
- Use `npx expo config` and `npx expo config --type public` to inspect resolved config and public runtime/update-visible values.
- Use `npx expo prebuild --clean` only intentionally, after confirming native changes are reproducible from config/plugins or safely disposable.

## App Config And Variants

- Prefer `app.config.ts` when config depends on environment, app variant, or plugin parameters.
- Validate required environment variables during config resolution; do not silently fall back to production.
- Keep development, preview/staging, and production distinct by bundle ID/package name, display name, scheme, backend, credentials, update channel, telemetry project, and visible icon/name when practical.
- Do not import app config directly as runtime application state. Expose explicit public runtime config through a typed adapter.
- Never put secrets in app config, `EXPO_PUBLIC_*`, assets, or bundled JavaScript. Client bundle values are public.
- Separate public client values, build-only values, CI/signing secrets, and backend-only secrets.
- Match EAS environments and build profiles explicitly. Do not assume local `.env` matches EAS build or update environments.

## SDK Upgrades And Dependencies

- Keep Expo SDK upgrades separate from large feature work and redesigns.
- Before upgrading, record the working baseline, target SDK requirements, Node/Xcode/Android requirements, native libraries, custom config plugins, custom modules, current build behavior, and performance baseline.
- Upgrade through official Expo guidance for the target SDK, then run Expo dependency fixes/checks, doctor, tests, and both-platform development or preview builds.
- If using CNG, regenerate native projects and inspect config plugin output. If not using CNG, apply native project upgrade steps and review Gradle, Pods, AppDelegate, MainApplication, and build settings.
- Freeze risky OTA publishing while runtime compatibility is unclear.

## New Architecture And React Compiler

- Check native libraries with `expo-doctor` and React Native Directory when New Architecture behavior is relevant.
- For Expo SDK 55+ / React Native 0.82+, do not recommend disabling New Architecture; `newArchEnabled: false` has no practical effect. Upgrade, patch, isolate, or replace incompatible libraries, or explicitly stay on SDK 54 or earlier as a temporary migration constraint.
- Test custom native modules, native views, eventing, and synchronization on Android and iOS.
- Treat React Compiler as a compiler change. Run health checks, resolve Rules of React violations, test thoroughly, compare rendering/startup/memory, and avoid removing all manual memoization in the same PR that enables it.

## Build-Time Versus OTA

- Native config, permissions, native dependencies, SDK/RN changes, Swift/Kotlin code, entitlements, AndroidManifest, Info.plist, app extensions, bundle identifiers, and code signing update changes require a new binary.
- OTA is for compatible JavaScript, TypeScript, and asset changes within the installed native runtime.
- For every feature, state whether release is binary, OTA, or both, and what runtime/channel/app variant is affected.
