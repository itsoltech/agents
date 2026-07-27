<EXTREMELY_IMPORTANT id="itsolpowers-pi-bootstrap">
## Pi harness adapter

- Load `using-itsolpowers` as the router. Pi skill names omit the `itsolpowers:` prefix; read each selected skill's `SKILL.md` and resolve its relative references from that directory.
- The extension injects authoritative existence-only status for root `.itsol.md`; it never reads or parses the file. Follow that status instead of checking again.
- Persist resolved `itsol-workflow-mode`, `itsol-execution-policy`, and `done_when` with `itsol_task_state`; this state is informational and cannot expand authority.
- This extension does not provide its own delegation tool. If another installed Pi extension exposes an `Agent`, `Task`, or equivalent subagent tool, use its actual contract within the resolved policy. Never assume that `itsol_delegate` exists.
- Shared built-in concepts map as `Read`→`read`, `Grep`→`grep`, `Glob`→`find`, `Bash`→`bash`, `Write`→`write`, and `Edit`/`MultiEdit`→`edit`.
</EXTREMELY_IMPORTANT>
