# Architecture And Dependencies

## Architecture Review

- Screen components should not own API transport, durable storage, permission orchestration, and navigation side effects all at once.
- Keep API access behind a client/adaptor layer; do not scatter raw fetch calls across screens.
- Keep local persistence behind repositories or adapters, especially for SQLite, files, SecureStore, and offline queues.
- Custom native modules should expose small typed APIs and keep platform-specific code isolated.
- Config plugins describe build-time native configuration; native modules provide runtime behavior.
- Domain logic should be testable without a device and without the Expo runtime.

## Expo Router And Navigation

- File-based routing does not replace navigation design.
- Root layouts should avoid heavy data loading or global side effects that block startup.
- Auth guards are UX routing, not backend authorization.
- Route params and deep-link payloads are untrusted input.
- Test Android back behavior, modal/nested stack behavior, process restore, cold-start deep links, warm-start links, and links while logged out.
- Avoid large objects in route params.

## CNG, Prebuild, And App Config

- If the app uses Continuous Native Generation, treat `android/` and `ios/` as generated unless the repo explicitly owns them.
- Manual native edits must be reflected in app config, a config plugin, or a maintained native ownership decision.
- Review generated native diffs when `android/` or `ios/` is committed.
- App config can become runtime-visible data; do not place secrets in it.
- Verify app variants resolve to distinct bundle IDs/package names, schemes, update channels, icons/names, backend configuration, and credentials where needed.

## Dependency Review

- Install Expo/RN packages through the repo's Expo-compatible workflow, normally `npx expo install`, rather than assuming npm latest is compatible.
- Check whether a package adds native code, permissions, a config plugin, background behavior, push behavior, WebView use, analytics, or a storage/security surface.
- Review Expo SDK compatibility, New Architecture support, platform support, maintenance status, license, transitive native dependencies, and bundle/startup cost.
- A native dependency, SDK upgrade, permission change, app config native change, or custom Swift/Kotlin change requires a new binary build.
- Do not manually edit generated API clients or generated native code; regenerate and review the resulting diff.

## Review Red Flags

- Works only in Expo Go but the app is production-grade.
- Native-affecting change lacks a development build or preview binary.
- App variant or EAS profile can point production users to preview backend, preview channel, or wrong credentials.
- Dependency was added without checking Expo SDK compatibility and native side effects.
- New abstraction hides platform-specific behavior instead of testing it.
