# Auto-Update And Channels

## Updater Choices

- Electron `autoUpdater`, Electron Forge publishers/update services, `electron-updater`, app stores, Snap/Flatpak, or a custom update service can all be valid depending on distribution.
- Do not hand-roll "download an executable and run it" update flows.
- Verify macOS signing requirements and updater behavior against official docs for the pinned tool versions.

## Channels

- Use explicit channels such as internal, beta, and stable.
- Separate app identity and update feed for internal/test builds where practical.
- Prevent downgrade or cross-channel update unless it is an intentional rollback flow.
- Release notes should show version, channel, platform, and meaningful user impact.

## Metadata And Publishing

- Publish update metadata atomically with artifacts.
- Serve feeds over HTTPS.
- Ensure metadata references correct artifact names, channels, checksums/signatures, and minimum versions.
- Do not let renderer or user input set update feed URLs.
- Keep previous stable artifacts available until rollback risk is closed.

## Update UX And Data

- Do not restart without user consent when work may be lost.
- Show update status and failure recovery where product expectations require it.
- Test migrations after update from N-1, N-2, and older supported versions.
- Migrations must be idempotent and resilient to interrupted update/restart.
- If rollback is supported, define storage compatibility and downgrade behavior.

## Update QA

- interrupted download
- metadata published without artifact
- expired or rotated signing certificate
- no admin rights
- antivirus interference
- proxy/VPN/captive portal
- update during active work
- beta to stable transition
- failed migration after update
