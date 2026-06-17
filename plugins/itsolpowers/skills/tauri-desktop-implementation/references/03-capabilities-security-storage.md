# Capabilities, Security, And Storage

## Tauri V2 Capabilities

Design capabilities per window/webview. Avoid `windows: ["*"]` unless every window truly needs the permission.

For every new permission or scope, record:

- feature requiring it
- window/webview receiving it
- narrowest allowed scope
- whether dev and prod differ
- how denied permission is tested
- why a narrower Rust command cannot handle it

Remember that multiple capabilities can combine permissions for the same window. Review capability changes like code changes.

## Command Scopes And Permissions

Capabilities are not a substitute for Rust validation. Commands still need to check:

- path ownership and canonicalization
- user/account/tenant context
- allowed operations and argument allowlists
- deep-link payload validity
- file type, size, and content
- shell/sidecar command names and arguments

Use deny scopes to constrain broad allows where the plugin supports it.

## CSP And Remote Content

Keep production CSP restrictive:

- no remote scripts/CDN unless explicitly justified
- avoid `unsafe-eval` and `unsafe-inline` unless required and documented
- narrow `connect-src` to known API/update endpoints
- separate dev HMR/WebSocket allowances from production

Do not load remote UI into a privileged main window. If remote content is required, isolate it in a separate window/webview with minimal capabilities.

## Storage Choices

Choose storage by data class:

| Data | Preferred Location |
|---|---|
| UI preferences | Tauri store, config JSON, or local DB |
| domain data | SQLite/redb/sled/domain files |
| API cache | local DB or cache directory |
| secrets/tokens | OS keychain, Stronghold, or approved secure storage |
| large user files | user-selected location or app data dir |
| logs | app log directory with rotation |
| temporary data | temp/cache dir |

Use atomic writes for important config files. Do not write beside the binary or assume current working directory is writable.

Never store long-term secrets in `localStorage`, `sessionStorage`, IndexedDB, ordinary frontend stores, plaintext config, or logs.
