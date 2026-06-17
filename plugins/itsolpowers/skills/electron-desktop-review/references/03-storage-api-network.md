# Storage, API, Network, And Offline Review

## Storage

- Small settings can live in versioned local config, key-value storage, or SQLite.
- Valuable local data needs migrations, corruption handling, export/backup, and recovery.
- Cache must be removable without losing business data.
- Large user files should stay in user-selected locations, not hidden in `userData` by default.
- Local storage that is not multi-process safe needs single-instance handling or file locks.

## Secrets

- Keep refresh tokens, license secrets, and private API credentials in main plus OS-backed storage such as `safeStorage`, keychain, credential manager, or another approved secret store.
- Renderer should not store secrets in `localStorage`, IndexedDB, query cache, Redux/devtools state, logs, crash reports, or plain JSON.
- Logout clears secrets from memory, persistent storage, cookies, sessions, query cache, and subscriptions.
- Validate fallback behavior when OS encryption is unavailable; do not silently downgrade security.

## API Placement

- Renderer API calls fit web-like apps with cookies or short-lived tokens and normal CORS.
- Main-process API calls fit private tokens, mTLS, system proxy/cert store, local services, controlled host allowlists, or SSRF-sensitive operations.
- If main proxies requests, renderer asks for domain operations, not arbitrary URLs.
- Main network allowlists check protocol, hostname, and port with URL parsing.

## Offline And Sync

- Offline-first requires a data model, queue, conflict handling, retry/backoff, dead-letter behavior, and idempotency.
- Local mutations should be durable operations, not random UI patches.
- Users need visible sync status and conflict resolution.
- Test no network, captive portal, VPN, proxy, DNS failure, TLS error, clock drift, restart during sync, and stale API schemas.

## Logging And Diagnostics

- Logs include version, channel, platform, process, and correlation IDs.
- Logs and crash reports redact tokens, cookies, full secret-bearing URLs, PII payloads, local sensitive paths, and storage contents.
- Diagnostic bundle export must redact secrets before packaging.
