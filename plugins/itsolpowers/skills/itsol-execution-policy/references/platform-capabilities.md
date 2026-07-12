# Platform Capabilities

Verify current official documentation before changing these mappings.

## Claude Code

- Plugin agents support `model`, `effort`, `tools`, and `disallowedTools`.
- ITSOL workers use overrideable `model: sonnet` and `effort: medium` defaults. Environment and per-invocation model choices can win, so report them as advisory unless runtime evidence confirms the effective value.
- Remove `Agent` from worker allowlists and deny it so a specialist launched through `claude --agent` cannot orchestrate.
- Use the plugin-level deterministic `SubagentStop` envelope hook. Do not use `maxTurns`.

## Codex

- The plugin packages skills and hooks, not the Claude Markdown agents or a named TOML agent catalog.
- Validate child responses in the parent. Do not register the Claude ITSOL-agent hook as a catch-all Codex hook.
- Optional custom TOML agents may set `model`, `model_reasoning_effort`, `sandbox_mode`, and `[agents] max_depth = 1`; omission inherits parent values. Treat this as user/project configuration, not installed plugin behavior.

## OpenCode

- The current adapter registers skills and bootstrap context, not native named agents.
- Native agents can set provider-qualified models and `permission.task: deny`; no portable generic reasoning-effort field or stop-veto continuation contract is established.
- Keep model/reasoning and stop enforcement advisory. Validate child results in the parent and re-invoke only for one bounded missing item.
- Do not use `steps` as completion; it is an iteration cap.
