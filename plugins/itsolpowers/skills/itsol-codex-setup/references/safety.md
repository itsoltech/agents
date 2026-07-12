# Setup Safety

- Setup owns only `itsol_*.toml` files recorded in `.itsolpowers-managed.json` and the specific `[agents]` keys it installs.
- An existing role without matching managed state is user-owned. Never overwrite it, including with `--force`.
- Preserve a managed role modified after setup unless force is explicit.
- Preserve existing `max_threads` and `max_depth` values that are at least as restrictive as the selected targets.
- Reject duplicate `[agents]` tables or duplicate managed keys instead of guessing.
- Back up an existing config before first installation. Validate the full plan before writes, atomically replace individual files, write state last, and attempt rollback after failure.
- On uninstall, restore the original config only when the installed config hash still matches. Preserve changed config even with force. Force may remove modified managed roles and managed state, but it leaves the backup and reports the preserved config as `partial`.
- Static `sandbox_mode` is configured intent. Parent/session permissions can take precedence.
- Model entitlement and reload behavior are not proven by static inspection. Report them as unverified/product-dependent.
- Never set `maxTurns`, and never accept agent termination as task completion.
