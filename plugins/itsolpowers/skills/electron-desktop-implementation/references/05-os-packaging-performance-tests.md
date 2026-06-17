# OS, Packaging, Performance, And Tests

## OS Integrations

Keep each integration minimal and product-justified:

- tray/background mode
- global shortcuts
- clipboard
- screen/camera/microphone
- notifications
- auto launch
- protocol handlers and file associations
- printing
- USB/HID/Serial/Bluetooth
- local network discovery
- powerSaveBlocker

Require user-visible consent where privacy or background behavior is involved. Validate protocol/file-association inputs like untrusted user input.

## Packaging, Signing, And Update

- Bundle main, preload, and renderer separately.
- Do not package test fixtures, dev-only files, public source maps with internal code, or unused assets.
- Rebuild native modules in CI per platform and architecture.
- Treat ASAR as packaging, not secrecy.
- Use ASAR integrity and Electron fuses when supported by the repo tooling.
- Sign production Windows/macOS builds; notarize macOS builds.
- Keep signing certs in CI secrets, never in repo.
- Use separate app names, bundle IDs, and update channels for internal/beta/stable.
- Publish update metadata atomically with artifacts and checksums.
- Test upgrade from several previous versions and migration after update.

## Performance

- Do not block main process.
- Lazy-load heavy renderer routes and modules.
- Virtualize long lists and tables.
- Avoid high-volume IPC loops and large cloned payloads.
- Batch event streams and add backpressure where needed.
- Close unused hidden windows and remove references/listeners on window close.
- Measure memory per window/process and profile CPU before optimizing.
- Use utility process, worker threads, sidecars, or native modules for CPU-heavy work.

## Test Strategy

Unit tests:

- schemas, validators, path validation, DTO mapping
- storage migrations
- retry/backoff and update-channel resolvers
- permission decision functions
- service logic with Electron APIs behind adapters

Integration tests:

- IPC handler + service + storage
- custom protocol and deep link parsing
- permission handlers
- file import/export
- multi-window event routing
- logout cleanup and storage migration

E2E/manual:

- first launch, login/logout, main workflows
- open/close windows, tray/menu/shortcuts
- offline/online
- packaged app smoke
- installer and update flow
- OS permissions
- crash recovery

Prefer WebdriverIO for a stable Electron automation workflow when starting fresh. Use Playwright Electron when the repo already depends on it and accepts its limitations.
