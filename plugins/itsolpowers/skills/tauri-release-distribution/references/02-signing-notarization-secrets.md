# Signing, Notarization, Secrets, And Integrity

## Signing Rules

- Production releases should be signed for platforms where users or OS trust flows expect it.
- macOS direct distribution requires code signing and notarization for a normal Gatekeeper experience.
- Windows unsigned builds can trigger SmartScreen and enterprise trust issues.
- Linux signing expectations depend on package format and distribution channel; publish checksums at minimum.

## Secret Handling

- Keep certificates, Apple credentials, Windows signing credentials, updater private keys, and passwords out of repo and logs.
- Restrict signing jobs to release branches, protected tags, or controlled manual approvals.
- Limit who can read or rotate signing secrets.
- Prefer short-lived credentials or hardware/cloud signing where the organization supports it.
- Document rotation and revocation for compromised signing or updater keys.

## Updater Key Separation

- Code signing and updater artifact signing are separate integrity controls.
- The updater public key can be shipped in app config; the updater private key signs update artifacts and must remain secret.
- Losing the updater private key can block future updates for already installed apps.
- Key changes need a migration strategy before the old key is unavailable.

## Artifact Integrity

- Publish checksums for release artifacts.
- Record commit SHA, version, channel, target OS/arch, signing status, and build provenance.
- Keep artifacts immutable after publishing. Publish a new version or metadata change instead of replacing bytes silently.
- Consider SBOM/license output when the org or customer requires it.

## Release Blockers

- Production artifact unsigned where signing is required by distribution path.
- macOS artifact not notarized for direct download.
- Signing secrets exposed to untrusted pull requests.
- Updater private key printed in logs or available to non-release jobs.
- Checksums or metadata do not match artifacts.
