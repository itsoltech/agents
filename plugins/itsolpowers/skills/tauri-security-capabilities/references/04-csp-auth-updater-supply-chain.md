# CSP, Auth, Updater, And Supply Chain

## CSP And Remote Content

- Configure a restrictive production CSP and test it in a packaged build.
- Avoid `unsafe-eval`, `unsafe-inline`, remote scripts, and CDN assets unless there is a documented reason.
- Keep production `connect-src` narrow.
- Separate dev server and HMR allowances from production CSP.
- If remote content is required, isolate it in a separate window/webview with minimal capabilities.
- Do not load remote UI in a privileged window that has filesystem, shell, updater, or secret-related powers.

## Auth And Session

- Use PKCE for OAuth public-client flows unless a stronger repo-specific design exists.
- Validate deep-link and local redirect callbacks, especially `state`.
- Give local OAuth callback servers a random port, short lifecycle, and strict callback validation.
- Include account/tenant in caches and clear them on logout or account switch.
- Rust commands should check user/account context for privileged local operations.
- Deep links are untrusted input and should never execute sensitive actions without validation and user intent.

## Updater Integrity

- Tauri updater artifacts require signatures; review public-key configuration and private-key lifecycle.
- Keep updater private keys out of repo and logs; restrict signing jobs to release contexts.
- Serve update metadata and artifacts over HTTPS.
- Reject user-controlled update URLs or channels.
- Test signature mismatch, malformed metadata, missing artifact, interrupted download, no update, downgrade/rollback, and old-version upgrade.

## Supply Chain Gates

- Pin Rust toolchain or document the toolchain policy.
- Use lockfiles for npm/pnpm/yarn/Bun and Cargo.
- Run Rust formatting, clippy, tests, dependency audit, and deny/license checks where available.
- Run frontend lint, typecheck, tests, and package audit appropriate to the repo.
- Review Tauri plugins for permissions, platform support, maintenance, compatibility with the pinned Tauri major version, and whether a small Rust command would be safer.
- Do not ship debug-only features, dev endpoints, source secrets, test fixtures, or internal docs in production artifacts.
