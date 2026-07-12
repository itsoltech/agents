# Stops And Delegation

Apply these limits only after `itsol-workflow-mode` has authorized the relevant planning, implementation, or delegation stage.

## Stop Stages

Use ordered stages:

| Stage | Rank |
| --- | ---: |
| `analysis` | 10 |
| `business-plan` | 20 |
| `technical-plan` | 30 |
| `implementation` | 40 |
| `implementation-reviewed` | 50 |
| `integration-validated` | 60 |
| `pr-created` | 70 |
| `first-review-batch` | 80 |
| `qa-handoff` | 90 |
| `deployment-ready` | 100 |

Resolve `requested-result` to one ranked stage before delegation. A child may stop at the same or an earlier rank than its parent. Reaching a stop never means `done_when` passed.

Compaction, retry, continuation, and resume preserve ceilings, resolved stop, remaining review cycles, and unmet completion criteria. A new packet may tighten them but cannot reset or expand them.

## Completion

Every top-level engineering task and child packet needs observable `done_when`. The main agent accepts `completed` only after verifying every criterion and evidence item.

Claude plugin agents end with exactly one envelope:

```text
Status: completed|partial|blocked|failed
Verification: <non-empty evidence, or "not run: <reason>" for non-completed status>
Unverified: <non-empty gaps or "none">
```

Labels start at column one, occur once, and remain ordered. `completed` cannot use `not run`. Malformed output may receive one continuation when `stop_hook_active` is false. When it is already true, allow stop and let the parent record the incomplete state. Never use `maxTurns`.

## Delegation And Review

`max_subagents` counts distinct child identities for the whole run. Continuing the same identity does not increment it; a replacement does. `max_parallel` limits simultaneous children.

Only the main agent delegates. Children must not expose delegation tools, spawn agents, or invoke external agent CLIs. Use one writer per file and semantic contract.

One review cycle contains one full independent report plus one targeted same-reviewer verification of fixes from that report. The continuation cannot reopen a full review or expand scope. Remaining or new material findings end `partial` or `blocked`; another cycle needs remaining capacity or escalation handling.
