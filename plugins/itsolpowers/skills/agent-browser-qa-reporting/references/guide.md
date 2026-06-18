# Agent Browser QA Reporting Reference Index

Use this routing index after reading `SKILL.md`. Load only the reference files needed for the active reporting task.

## Reference Routing

- Coverage matrix, finding classification, severity, priority, confidence, and minimum finding fields: read [01-coverage-findings-taxonomy.md](01-coverage-findings-taxonomy.md).
- Report structure, QA handoff, evidence index, verdict language, and sensitive-data rules: read [02-report-template-handoff.md](02-report-template-handoff.md).
- Regression retest scope, fixed-versus-new classification, closure proof, and reopen criteria: read [03-regression-follow-up.md](03-regression-follow-up.md).

## Command Version Policy

- Before command-sensitive `agent-browser` work, run `agent-browser --version` and `agent-browser --help` to identify the installed command surface.
- If that CLI version supports versioned or local guidance such as `agent-browser skills get core` or `agent-browser skills get dogfood`, load it and treat it as the source of truth for exact syntax, flags, output paths, and behavior.
- Older CLI versions may not provide `skills get`; do not require those commands as always available.
- Treat command snippets as patterns. Installed local guidance wins when syntax, flags, output paths, or behavior differ.
- Record the `agent-browser` version and report source artifacts when available, but do not depend on memorized command syntax.

## Reporting Rules

- Report user-visible behavior and evidence first, then hypotheses.
- Keep raw artifacts separate from report text. Reference safe artifact paths and summarize only redacted content.
- Do not include secrets, PII, tokens, cookies, auth state, authorization headers, or sensitive business payloads.
- Do not turn blocked setup, stale snapshots, missing test data, CLI failures, or environment outages into product defects unless the app behavior is independently reproduced.
