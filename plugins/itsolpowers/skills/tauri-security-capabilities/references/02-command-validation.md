# Command Validation

## Trusted Boundary

- The WebView frontend is not a trusted backend. A user or compromised UI can call commands with payloads the normal UI would not produce.
- Rust commands must validate, authorize, and normalize inputs before touching OS APIs, local data, network clients, or secrets.
- Renderer-only validation is UX help, not security.

## Command Design

- Prefer explicit commands with typed DTOs over generic dispatchers.
- Validate lengths, enums, ranges, IDs, paths, URLs, file types, and operation ownership.
- Include account, tenant, project, or workspace context in trusted Rust-side checks where relevant.
- Return stable typed errors and avoid exposing stack traces, internal paths, raw SQL, secret-bearing API errors, or dependency internals.
- Avoid logging full command payloads; log operation IDs and safe metadata.

## Command Scopes

- If a permission provides a scope, ensure the command implementation actually enforces it.
- Do not treat configured scopes as documentation only.
- For custom commands, design the equivalent of scope checks where operations touch files, processes, network endpoints, devices, or user data.
- Test both allowed and denied scope behavior.

## Event Safety

- Events must not carry secrets, refresh tokens, private paths, or unredacted personal data.
- Multi-window events should target the correct window and respect the receiving window's role.
- Use `operation_id` for progress and cancellation so one window cannot confuse another operation.
- Throttle high-volume events to avoid UI denial of service.

## Negative Cases

- Malformed JSON or missing field.
- Unknown enum variant.
- Overlong string or huge payload.
- Cross-account or cross-tenant ID.
- Path traversal or symlink escape.
- Command called from a window without a need for the operation.
- Long task canceled, app shutdown, or logout while command runs.
