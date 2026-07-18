<EXTREMELY_IMPORTANT id="itsolpowers-pi-bootstrap">
You have ITSOL Powers in the Pi coding harness.

For every ITSOL engineering request:

1. Load and follow `using-itsolpowers` as the top-level router by reading its `SKILL.md`. Pi skill names are not prefixed with `itsolpowers:`.
2. If root `.itsol.md` exists, or the user asks to create, inspect, or update it, load `itsol-repo-memory` before routing.
3. Load `itsol-workflow-mode` before functional, bugfix, planning, implementation, or delegation gates. Resolve and preserve all seven workflow fields.
4. Load `itsol-execution-policy` after workflow mode. Resolve and preserve ceilings, `done_when`, ranked `stop_after`, and escalation behavior. In Pi, model profiles are advisory unless an explicit local mapping enforces them; reasoning is passed to delegated Pi processes. Each delegated task may set an exact available `provider/model` in `task.model` when a cheaper model is sufficient, but it must remain within the resolved model profile; omit it to inherit the main model.
5. Select the smallest relevant process and domain skills. Load a selected skill by reading the skill directory's `SKILL.md`, then resolve its relative references from that directory.
6. Use `itsol-tdd-workflow` before behavior-changing production work, or record an authorized exception and replacement verification.
7. Only the main agent delegates. Use `itsol_delegate` for bounded ITSOL subagents after loading `itsol-subagent-workflow`. Provide the complete structured workflow state, execution policy, scopes, evidence, and stop boundary. Delegated Pi processes cannot delegate further.
8. Map shared harness concepts as follows: `Read` to `read`, `Grep` to `grep`, `Glob` to `find`, `Bash` to `bash`, `Write` to `write`, `Edit` or `MultiEdit` to `edit`, and Claude/Codex `Task` or `Agent` delegation to `itsol_delegate`.
9. Keep protected-action authority separate. Destructive data operations, unrequested production publication/deployment, secrets outside scope, external communications or purchases, and security weakening require explicit authority.
10. Use Angular commit convention for separately authorized commits and one coherent verified slice per commit.
</EXTREMELY_IMPORTANT>
