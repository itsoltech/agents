# Updater Signatures And Channels

## Tauri Updater Integrity

- Tauri updater artifacts require signatures; do not design a release process that bypasses artifact signature verification.
- Review `tauri.conf.*` updater public-key config and endpoint configuration.
- Keep the updater private key in restricted CI or release infrastructure only.
- Publish artifacts before metadata points users to them.
- Metadata publication should be atomic enough that clients do not see partial releases.

## Channel Design

- Common channels: internal, beta, stable.
- Channels can use separate app identity/storage or separate update endpoints if parallel installs are needed.
- Stable should never point to internal or beta artifacts.
- Staged rollout requires dynamic update metadata or a server that can target cohorts.
- Static JSON can be acceptable for simple releases, but rollback is cruder.

## Update UX

- The app should handle no update, update available, download progress, install failure, restart required, and endpoint unavailable.
- Updates should not interrupt user work without product approval.
- Release notes should be short and user-relevant.
- Diagnostics should log update checks, download failures, signature mismatches, and install results without leaking secrets.

## Migration And Rollback

- Test upgrade from every supported previous version, not only the immediately previous build when local data matters.
- Local data migrations must be idempotent and compatible with rollback or forward-fix strategy.
- Define whether downgrade is supported or blocked.
- Keep previous stable artifacts available until rollback risk expires.

## Update QA Cases

- No internet.
- Endpoint returns no update.
- Malformed metadata.
- Signature mismatch.
- Artifact 404.
- Interrupted download.
- Low disk space.
- App closed during update.
- Upgrade from old version.
- Local database migration after update.
- Rollback or channel freeze.
