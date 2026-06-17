# Storage, API, And Offline

## Storage Choices

- Small settings: versioned JSON, key-value store, or SQLite under `app.getPath('userData')`.
- Larger local data: SQLite, DuckDB, LevelDB, or a repo-approved local database.
- HTTP cache: browser cache or the app's query-cache persister.
- Offline-first data: local database plus migrations and sync protocol.
- User files: user-selected directory, not hidden app data by default.
- Secrets: main process with `safeStorage`, keytar, OS keychain, or credential manager.
- Logs and crash dumps: separate location with rotation and redaction.

Every persistent storage area needs schema versioning, idempotent migrations, corrupt-data handling, and tests for old data when the feature changes stored shape.

## Secrets

- Keep refresh tokens, license keys, and private credentials out of renderer.
- Do not store secrets in `localStorage`, IndexedDB, plain JSON, query cache, Redux devtools, logs, or crash reports.
- Check whether OS-backed encryption is available and define a product-approved fallback.
- On logout, clear secrets from storage and memory.
- Do not treat local OS-backed encryption as protection from a user with full access to the OS account.

## API Boundary

Renderer API calls are reasonable when the app behaves like a normal web client and auth uses secure cookies or short-lived tokens. Use generated clients and query cache when the repo already has them.

Main-process API calls are better when tokens must remain outside renderer, networking needs mTLS/proxy/system certs, hosts need strict allowlists, requests target local services, or renderer compromise must not become SSRF.

For main API proxies:

- expose domain operations, not arbitrary URL fetches
- allowlist protocols and hosts
- validate payloads and map responses to DTOs
- use timeouts, retry limits, cancellation, and safe error mapping
- protect against localhost, RFC1918, and metadata-service SSRF when URLs are influenced by renderer data

## Offline And Sync

Do not add offline mode by writing random UI patches to local storage. Define:

- which reads and mutations work offline
- source of truth
- idempotency keys
- operation queue shape
- retry/backoff/dead-letter behavior
- conflict resolution UI
- sync status visible to users
- rollback behavior
- retention and security of local data

Test no internet, captive portal, proxy, VPN, DNS failure, TLS failure, API schema drift, app restart during sync, and system clock changes when the feature depends on offline behavior.
