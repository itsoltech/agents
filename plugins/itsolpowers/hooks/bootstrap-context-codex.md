## Codex harness adapter

- Load namespaced skills as `itsolpowers:<name>`.
- Use Codex's native subagent capability when `itsol-workflow-mode` and the selected execution policy authorize delegation; do not use an ITSOL skill name as `agent_type` and do not call Pi `itsol_*` tools.
- Validate child response evidence in the parent; Codex does not install Claude's `SubagentStop` hook.
