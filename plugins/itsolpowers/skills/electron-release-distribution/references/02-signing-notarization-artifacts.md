# Signing, Notarization, And Artifacts

## Signing Requirements

- Sign production Windows and macOS artifacts.
- Use macOS hardened runtime and notarization when distributing outside development.
- Choose Windows EV/OV signing according to distribution expectations and SmartScreen risk.
- Linux signing/checksum expectations depend on target: AppImage, deb, rpm, Snap, Flatpak, or repository distribution.

## Secret Handling

- Store certificates, app-specific passwords, API keys, Apple credentials, and Windows signing credentials in CI secrets.
- Do not commit signing material, notarization credentials, provisioning profiles with secrets, or plaintext passwords.
- Restrict signing and publishing jobs to release branches, protected tags, or manually approved environments.
- Internal builds should use separate app name, bundle ID/app ID, and update channel.

## Artifact Integrity

- Publish checksums with release artifacts.
- Include version, commit SHA, platform, architecture, channel, and build time in release metadata.
- Keep release notes tied to the exact artifact set.
- Consider SBOM/provenance when customers or security process require it.
- Preserve enough build inputs to reproduce or investigate a release.

## Review Questions

- Can an unsigned artifact accidentally be promoted to stable?
- Can beta metadata point to stable artifacts or the reverse?
- Are notarization failures blocking release instead of being warnings?
- Are secrets available to pull request builds from forks?
- Are artifact names unambiguous across platform, architecture, and channel?
