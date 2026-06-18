# Native Modules, Lifecycle, And Notifications

## Expo Modules API

- Create a custom Expo module when no maintained Expo/RN library fits, an internal native SDK is required, a native view is needed, device/protocol access is specific, or performance/lifecycle requirements cannot be met in JavaScript.
- Do not create a native module when a maintained Expo library already solves the problem.
- Use a local module for one app and a standalone/private package or monorepo package when multiple apps share it.
- Version the JavaScript API and native API together.

## Native API Design

- Keep methods small, typed, and explicit.
- Use async APIs for I/O and long work; do not block the main thread.
- Avoid sending huge payloads as one JS object; use files, SQLite, native buffers, batching, or events when appropriate.
- Validate arguments on the native side too.
- Return stable error codes and diagnostic messages; map platform exceptions instead of leaking internals.
- Document Android/iOS differences in the adapter.
- Support cancellation for long operations where possible.
- Release listeners, sensors, file handles, callbacks, Activity/ViewController references, and other resources according to lifecycle.
- Add tests for TypeScript wrapper behavior, invalid arguments, missing permissions, lifecycle, background/resume, multiple listeners, cancellation, and real-device smoke behavior.

## Config Plugins And Permissions

- Native modules that need build-time changes should ship or use config plugins for permissions, usage descriptions, AndroidManifest, Info.plist, Gradle, Pods, entitlements, or app extensions.
- Plugins must be deterministic, idempotent, validated, and explicit about rebuild requirements.
- Request permissions only in feature context and handle `denied`, `blocked`, `limited`, and settings changes.
- Do not add permissions the app does not use. Use Android blocked permissions when dependencies add unnecessary permissions.
- iOS usage descriptions must match the real feature.
- Permission, Info.plist, AndroidManifest, entitlement, and app extension changes require a new binary build.

## Deep Links And Navigation Inputs

- Validate route, params, expected origin, and auth state before acting on deep links, universal links, OAuth redirects, or notification payloads.
- Do not perform destructive actions immediately when opening a link.
- Do not allow arbitrary URLs into WebView or browser flows.
- Test cold start, warm start, background resume, logged-out handling, and protected screen redirects.

## App Lifecycle

- Design for cold start, background resume, system process kill, state restoration, deep link launch, notification launch, and no-network launch.
- Do not rely on `useEffect` cleanup running before process death.
- Save important drafts before app shutdown.
- On foreground, check session validity, network state, and necessary resync without refetching everything after every short switch.
- Cancel sensors, listeners, subscriptions, uploads, and native callbacks when screens stop needing them.
- Test rapid background/foreground switching and returning after hours.

## Background Tasks

- Background execution is constrained and not guaranteed. Do not base critical integrity, logout, payment, or data consistency solely on a background task.
- Make tasks idempotent, checkpointed, bounded in CPU/network/battery, and safe to interrupt.
- Confirm critical operations on the server.
- Test low-power mode, Android manufacturer restrictions, offline behavior, and interrupted execution.
- Surface sync state to users when background work affects their data.

## Push Notifications

- Ask for notification permission in context and register token with user ID, app variant, platform, and diagnostic device metadata as needed.
- Update token changes and remove or deactivate token associations after logout when product policy requires it.
- Do not put sensitive data in notification payloads.
- Validate payloads before navigation and deduplicate actions by event ID.
- Handle foreground, background, and cold-start delivery.
- Do not assume push delivery order or reliability.
- Backend should process receipts, deactivate invalid tokens, retry transient failures with backoff, and avoid retrying invalid payloads.
- Test production-like push in development/preview builds with correct credentials; Expo Go is not a production push test environment.

## Platform Differences

- Test Android back navigation, safe areas, dynamic island, keyboard avoidance, status bar, gestures, permissions, file pickers, share sheets, notifications, biometrics, background execution, app links/universal links, tablets, font scaling, dark mode, locale, and date formatting.
- Keep platform-specific code small and explicit with `.ios.ts`, `.android.ts`, or `Platform.select` rather than scattered conditionals.
