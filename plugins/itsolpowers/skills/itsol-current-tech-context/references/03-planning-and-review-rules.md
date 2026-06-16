# Planning And Review Rules

## Planning Rules

In Business Plans, mention technology freshness only when it affects user-visible scope, risk, rollout, support, licensing, or compatibility.

In Technical Plans, always include:

- detected repo versions or selected new-project versions;
- source links or source names checked;
- whether the plan uses existing versions, upgrades, or defers upgrades;
- compatibility implications for code, tests, generated clients, migrations, deployment, and rollback;
- exact ITSOL skills that rely on this context.

If current docs introduce a different recommended pattern than the repo uses, do not rewrite architecture automatically. Decide whether the change belongs to this task or a follow-up plan.

## Review Rules

During code review:

- check whether the PR follows the documentation for the repo's actual version;
- flag use of deprecated APIs, unsupported SDKs, insecure packages, stale generated clients, or incompatible major-version patterns;
- distinguish blockers from follow-up modernization;
- for large PRs, delegate current-doc checks to the relevant technology review subagents when possible.

If a finding depends on external docs, include the source and the version context in the finding.
