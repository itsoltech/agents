# Electron Desktop Implementation Guide

Use this routing index after reading `SKILL.md`. Load only the files that match the task.

## Reference Routing

- Architecture, project layout, process ownership, TypeScript config, and cross-window state: read [01-architecture-and-processes.md](01-architecture-and-processes.md).
- Preload APIs, IPC contracts, validation, event subscriptions, streaming, cancellation, and error mapping: read [02-ipc-and-contracts.md](02-ipc-and-contracts.md).
- BrowserWindow hardening, sessions, permissions, navigation, external links, CSP, custom protocol, and threat model checks: read [03-windows-sessions-security.md](03-windows-sessions-security.md).
- Local storage, secrets, API-from-renderer vs API-through-main, offline queues, sync, logout, tenant separation, and migrations: read [04-storage-api-offline.md](04-storage-api-offline.md).
- OS integrations, packaging, auto-update, signing, performance, utility process, tests, QA, and release verification: read [05-os-packaging-performance-tests.md](05-os-packaging-performance-tests.md).

## Version Policy

- Existing repo: detect and respect pinned `electron`, builder, Forge, test runner, and frontend package versions from lockfiles and config.
- New project: use latest stable Electron and stable ecosystem tooling.
- Version-sensitive decisions: check current official docs through `itsol-current-tech-context` before recommending APIs, defaults, update tooling, signing flow, or test runners.

## Minimum Feature Definition

For any desktop feature, define:

- affected layers: renderer, preload, main, storage, API, OS integration
- IPC channels, request/response/error schemas, timeout/cancellation behavior
- security and privacy impact, including XSS-after-compromise behavior
- storage location, schema version, migrations, and cleanup on logout/user/tenant change
- offline behavior when network, VPN, proxy, TLS, or server schema changes
- verification: unit/integration/E2E/manual packaged smoke as appropriate
