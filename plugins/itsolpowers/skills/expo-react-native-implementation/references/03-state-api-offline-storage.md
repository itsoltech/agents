# State, API, Offline, And Storage

## State Boundaries

- Keep UI state local to screens/components or small feature stores: active tab, modal state, draft form state, filters, and animation state.
- Treat server data as server state. Use TanStack Query or the repo's chosen cache instead of copying query data into a global store.
- Treat durable local data separately: offline databases, pending sync queues, settings, downloaded files, and document caches need schema/versioning and cleanup.
- Treat secrets separately. Use SecureStore or a native Keychain/Keystore-backed module for small sensitive values.

## API Layer

- Prefer generated API clients and types when an OpenAPI contract exists; keep generated code separate from handwritten adapters.
- Build a typed client adapter for base URL by variant, auth, timeout, cancellation, error mapping, request ID, diagnostics headers, and safe retry policy.
- Include app version, build number/versionCode, runtime version, update ID, platform, and request ID in diagnostics when useful and safe.
- Pass `AbortSignal` where supported and cancel work when a screen or operation is no longer relevant.
- Avoid retrying 4xx failures and non-idempotent mutations. Use idempotency keys for mutations that can be repeated.
- Protect token refresh from parallel refresh storms.
- On logout, clear query cache, user-specific durable data, live connections, pending sensitive work, and protected navigation history according to product policy.

## TanStack Query On Mobile

- Query keys must include every parameter that affects the result, including tenant/user/environment when relevant.
- Invalidate precisely after mutations; avoid global invalidation as a default.
- Consider one QueryClient per session or strict tenant-aware keys for multi-tenant apps.
- Tune refetch-on-focus/reconnect for mobile foreground and network changes; do not refetch everything on every short foreground event.
- Map live events to precise `setQueryData` or targeted invalidation.
- Limit retries on mobile networks and expose user-facing retry states.

## Offline Sync

- Offline-first behavior requires its own design. Query cache alone is not a durable offline database.
- Define exactly which operations work offline and which require online confirmation.
- Give local records stable local IDs before upload.
- Persist the queue of pending changes and track `pending`, `syncing`, `failed`, and `synced` states.
- Make sync operations idempotent, bounded, retryable with backoff, and explicit about conflict resolution.
- Store server timestamps/version fields when conflict handling needs them.
- Show failed sync states; do not hide permanently failed operations.
- On foreground and network recovery, run controlled resync rather than a full unbounded refresh.
- Test clock changes, time zones, offline for long periods, process kill, and rollback/OTA compatibility for local schema changes.

## Storage Choices

- SecureStore: small secrets such as refresh tokens, device keys, or protected credentials. Handle native storage errors, biometric changes, unavailable hardware, invalidated keys, and iOS Keychain persistence after reinstall.
- AsyncStorage or key-value store: non-sensitive preferences, feature flag cache, small UI persistence, and last selected view. Do not store tokens, large datasets, relational offline data, or transactional data.
- SQLite: offline datasets, sync queues, local indexing/search, migrations, and transactional data. Keep migrations, constraints, indexes, cache limits, and upgrade tests.
- Filesystem: downloaded files, images, documents, exports, and large blobs. Separate cache from durable documents, write atomically where needed, validate extension/MIME/magic bytes, control disk usage, and never compose paths from untrusted input without validation.

## Failure Cases To Design For

- Offline before app start, offline during request, network switches, captive portal, high latency, timeout, and responses after leaving a screen.
- Two requests completing out of order.
- Token expiry during mutation and multiple simultaneous 401 responses.
- SecureStore errors, corrupt JSON, legacy schema, partial migration, no disk space, file removed by OS, and data retained after iOS reinstall.
- API schema drift or backend responses that do not match generated types; add runtime validation where the backend contract is not reliable.
