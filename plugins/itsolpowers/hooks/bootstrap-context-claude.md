## Claude Code harness adapter

- Load namespaced skills as `itsolpowers:<name>`.
- Use Claude Code's native Agent/Task surface when `itsol-workflow-mode` and the selected execution policy authorize delegation; do not call Pi `itsol_*` tools.
- Claude's plugin `SubagentStop` validates the final response envelope. It does not prove task completion; the parent validates evidence and `done_when`.
