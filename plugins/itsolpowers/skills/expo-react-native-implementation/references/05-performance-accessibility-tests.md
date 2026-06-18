# Performance, Accessibility, And Tests

## Performance Baseline

- Profile release or preview builds. Development mode, debugger, Fast Refresh, and Metro can hide or create performance issues.
- Measure Android and iOS separately for startup, memory, list scrolling, navigation, animations, API latency, local migrations, and native module calls.
- Record baseline metrics before SDK upgrades, large dependency additions, analytics SDK changes, maps, editors, charts, or broad UI rewrites.

## Rendering And Lists

- Do not memoize everything by default. Stabilize props and selectors after identifying a real render problem.
- Keep global contexts narrow so they do not rerender the whole app tree.
- Avoid heavy computation during render and avoid creating large style/data objects on every animation frame.
- Use virtualized lists for long data, stable keys, light item renderers, pagination, and image thumbnails.
- Do not nest large lists inside `ScrollView`.
- Test fast scrolling on lower-end Android devices.

## Assets, Startup, And Bundle

- Provide known image dimensions to avoid layout jumps.
- Use appropriate formats/resolutions, generate thumbnails, and avoid unused large assets in the binary.
- Limit root layout work; avoid blocking first render with many requests or migrations.
- Initialize analytics and non-critical SDKs after first render when safe.
- Keep splash screen duration intentional and measured.
- Analyze bundle size after adding heavy dependencies. Look for duplicate packages, whole-package imports, unused locales/assets, web-only libraries in native bundle, and oversized generated clients.
- Do not publish source maps as public assets; upload them through controlled crash-reporting CI.

## JavaScript And Native Boundary

- Avoid thousands of native calls in loops. Batch data or move suitable work native-side.
- For large data, prefer files, SQLite, native buffers, or paged APIs over huge JSON payloads across the bridge.
- Use native modules only when they provide real value.
- Ensure animations respect reduced motion and do not rely on JS thread availability for critical smoothness.

## Accessibility

- Give interactive elements correct roles and accessible names.
- Do not communicate state only by color.
- Test large font, system text scaling, VoiceOver, TalkBack, keyboard/external keyboard where supported, and logical reading order.
- Manage focus after modals and screen changes.
- Keep touch targets usable and error messages available to screen readers.
- Respect reduced motion and avoid locking orientation without product justification.

## Test Strategy

- Unit test domain logic, validation, DTO mapping, retry/error mapping, auth state machines, offline queues, local migrations, native module wrappers, and hooks with isolated dependencies.
- Component tests should assert user-visible behavior through text, role, label, and interactions; avoid testing implementation details.
- Integration tests should cover API client plus auth interceptor, TanStack Query cache behavior, storage repository plus migrations, navigation plus auth, deep link parsing, notification payload routing, and TypeScript wrapper plus mocked native boundary.
- E2E tests should run on built artifacts when possible, not only Metro. Cover cold start, login/logout, token refresh, main business flow, API error, offline, permission denied, deep link, notification open, background/resume, upgrade, local migration, staging OTA, and restart after update download.
- For custom Expo modules, add Swift/Kotlin tests, TypeScript wrapper tests, permission tests, event tests, real-device smoke tests, and SDK-upgrade smoke tests.

## Release Matrix And QA

- Minimal release matrix: current iOS, oldest supported iOS if available, current Android, older supported Android, lower-end Android, real devices plus simulator/emulator, Wi-Fi/slow/offline, light/dark mode, normal/large font, fresh install, upgrade from previous store build, and user with existing OTA update.
- QA scenarios should include reinstall with iOS Keychain persistence, upgrade with draft data, no disk space, interrupted update, OTA rollback after migration, network loss mid-request, out-of-order responses, token expiry, permission denial/settings changes, corrupt storage, orientation changes, keyboard covering CTA, process kill, and notification/deep link requiring login.
- For every completed feature, state Android/iOS coverage, accessibility status, permissions impact, API cancellation/retry behavior, storage migration/cleanup, analytics privacy, test coverage, `expo-doctor` status, whether a preview build is needed, QA scenarios, and release mode: binary, OTA, or both.
