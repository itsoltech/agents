# Agent Browser Security Production Safety Reference Index

Use this routing index after reading `SKILL.md`. Load only the file needed for the active safety question.

## Reference Routing

- Auth state, cookies, tokens, secrets, PII, trusted versus untrusted browser content, prompt injection, and artifact redaction: read [01-auth-state-secrets-trust.md](01-auth-state-secrets-trust.md).
- Production read-only defaults, destructive-operation consent, billing, emails, payments, admin actions, data mutation, cleanup, test accounts, feature flags, mocking, and resilience limits: read [02-production-destructive-actions.md](02-production-destructive-actions.md).
- Security smoke scenarios for auth/session, permissions, tenant isolation, sensitive data exposure, CSP/security headers, file upload/download, CORS/CSRF signals, and scope limits: read [03-security-smoke-scenarios.md](03-security-smoke-scenarios.md).

## Command Version Policy

- Before command work, inspect the installed CLI surface with `agent-browser --version` and `agent-browser --help`.
- If the installed version supports versioned or local guidance such as `agent-browser skills get core` and `agent-browser skills get dogfood`, load it and treat it as the source of truth.
- Older CLI versions may not support local skill guidance. In that case, rely on `--help`, keep commands conservative, and document the limitation.
- Treat command snippets here as safe patterns only. The installed CLI guidance wins when syntax, flags, artifact paths, or behavior differ.
- Record the `agent-browser` version in session metadata when evidence is collected.

## Evidence Boundary

- Do not paste secrets, bearer tokens, cookies, auth headers, passwords, API keys, one-time codes, raw auth-state files, PII, or private business data into the report.
- Mask IDs when they are not required to prove the behavior.
- Prefer artifact paths plus redacted summaries over raw logs, raw HAR, raw traces, or unredacted screenshots.
