# Platform Capabilities

Verify current official documentation before changing these mappings.

## Claude Code

- Plugin agents support `model`, `effort`, `tools`, and `disallowedTools`.
- ITSOL workers use overrideable `model: sonnet` and `effort: medium` defaults. Per-invocation selection and forced harness overrides can win, so report them as advisory unless runtime evidence confirms the effective value. Ordinary `CLAUDE_CODE_SUBAGENT_MODEL` is a fallback and does not override the definition.
- Prefer short family aliases such as `sonnet`, `opus`, and `fable` so agent definitions do not require edits for every model release. Use a full model ID only when the user or deployment explicitly requires a version pin. Alias resolution depends on the harness, provider, and configuration; verify the effective model before making version-specific capability claims. For Bedrock, Agent Platform, or Foundry, use verified provider mappings instead of inventing an ARN, deployment, or silent fallback. See [model configuration](https://code.claude.com/docs/en/model-config) and [subagent model selection](https://code.claude.com/docs/en/sub-agents#choose-a-model).
- Remove `Agent` from worker allowlists and deny it so a specialist launched through `claude --agent` cannot orchestrate.
- Use the plugin-level deterministic `SubagentStop` envelope hook. Do not use `maxTurns`.

### Model-specific effort calibration

Effort labels are not comparable across models. When the harness exposes verified model/effort selection and no explicit user or repository setting overrides it, use these starting points:

| Effective model | Starting effort | Adjustment |
| --- | --- | --- |
| Claude Opus 5.5 | `medium` | Compare lower/higher levels on representative tasks. |
| Claude Sonnet 5.5 | `medium` for well-specified agentic work | Try `high` for harder or longer tasks; verify changes even at low effort. |
| Claude Fable 5.1 | `high`, its default | Run a fresh effort sweep; do not carry over another model's calibration. |

Use `xhigh` or `max` only where measured quality gains justify the extra time and cost. Preserve explicit model/effort choices and enforced ceilings; never infer the effective model from the provider name or alias alone. The packaged `sonnet`/`medium` default remains advisory and does not claim a universal Claude configuration.

Sources: [Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5#calibrate-effort), [Sonnet 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5#calibrate-effort), [Fable 5.1](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1#consider-all-effort-levels).

## Codex

- The plugin packages skills and hooks, not the Claude Markdown agents or a named TOML agent catalog.
- Validate child responses in the parent. Do not register the Claude ITSOL-agent hook as a catch-all Codex hook.
- Optional custom TOML agents may set `model`, `model_reasoning_effort`, `sandbox_mode`, and `[agents] max_depth = 1`; omission inherits parent values. Treat this as user/project configuration, not installed plugin behavior.
- Use `itsol-codex-setup` for an explicit, managed user/project installation of cost-aware role defaults and `itsol-codex-doctor` for read-only diagnosis. Model IDs and reasoning values are configurable advisory intent; runtime selection and account-specific entitlement remain unverified without normal runtime evidence. Static sandbox values are also configured intent, and effective parent or session permissions may take precedence.

## OpenCode

- The current adapter registers skills and bootstrap context, not native named agents.
- Native agents can set provider-qualified models and `permission.task: deny`; no portable generic reasoning-effort field or stop-veto continuation contract is established.
- Keep model/reasoning and stop enforcement advisory. Validate child results in the parent and re-invoke only for one bounded missing item.
- Do not use `steps` as completion; it is an iteration cap.
