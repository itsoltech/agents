# Execution Policy

## Presets

| Preset | Model | Reasoning | Max agents | Max parallel | Review cycles | Default stop | Escalation |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| `economy` | `economy` | `low` | 0 | 0 | 1 | `requested-result` | `ask` |
| `standard` | `balanced` | `medium` | 2 | 2 | 2 | `implementation-reviewed` | `ask` |
| `deep` | `frontier` | `high` | 1 | 1 | 2 | `integration-validated` | `ask` |

`custom` requires every field. Preset values are ceilings, not quotas. `max_review_rounds` bounds implementation/code-review loops. Planned Business, Technical, and Technical Fix artifacts use the separate `review.plan_max_rounds` repository setting (default 10 per artifact), so increasing plan quality does not force ten code-review rounds. Under `itsol-workflow-mode`, planned modes also require at least one available read-only reviewer identity and one parallel slot; `economy` is therefore intended for `direct` work unless explicitly expanded.

## Resolution

Choose the base in this order:

1. explicit task policy;
2. allowed repository default;
3. agent-selected `standard`.

Then apply platform safety/capability and every matching repository or task restriction. Record the base and every tightening rule in `policy_sources`. Report field-level sources when effective values differ from the base.

Order model profiles `economy < balanced < frontier` and reasoning profiles `low < medium < high`; lower is the tighter cost ceiling. `enforced` means runtime evidence confirms the effective ceiling. Use `advisory` for instructions, overrideable defaults, or unsupported controls.

If a hard user/repository model or reasoning ceiling cannot be enforced, disable child delegation. Inline work may continue only in the user-selected current session and must be reported as not cost-enforced.

Automatically tighten when useful. Never increase model intent, reasoning, distinct children, parallelism, review cycles, or stop stage after resolution.

Choose inline execution for trivial tasks, strongly sequential work, overlapping write or semantic-contract ownership, or any platform/policy combination that cannot safely support delegation. Use children only for genuinely independent work or required independent review within every ceiling.

`budget_escalation: ask` returns `partial` or `blocked`, names the limiting field, and requests a new instruction. `forbidden` returns the incomplete status and recommendation without requesting expansion. Neither expands automatically.

Preserve terminal statuses exactly: `completed`, `partial`, `blocked`, or `failed`. A stopped agent is not implicitly completed.

## Repository Policy

Optional `.itsol.md` policy may define a default and restrictions:

```yaml
execution:
  default_preset: standard
  restrictions:
    - match:
        path: infra/production
      max_subagents: 1
      max_parallel: 1
      stop_after: technical-plan
```

Intersect every matching restriction. A task instruction may override a default but not a harder repository ceiling.
