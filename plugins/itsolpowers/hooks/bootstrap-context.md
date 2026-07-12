<EXTREMELY_IMPORTANT>
You have ITSOL Powers.

For every ITSOL engineering request:

1. Load and follow `itsolpowers:using-itsolpowers` as the top-level router.
2. If root `.itsol.md` exists, or the user asks to create, inspect, or update it, load `itsolpowers:itsol-repo-memory` before routing and apply root plus most-specific project policy.
3. Load `itsolpowers:itsol-workflow-mode` before functional, bugfix, planning, implementation, or delegation gates. Resolve `governed`, `autonomous-planned`, or `direct` from platform rules, repository restrictions, explicit task choice, repository default, then `governed`. Preserve all seven workflow fields.
   Required keys: `workflow_mode`, `mode_source`, `decision_authority`, `scope`, `artifact_state`, `execution_mode`, `protected_constraints`. Valid artifact states include `draft`, `approved`, `ready-for-execution`, and `not-required`; execution may be `pending`, `inline`, `subagents`, or `auto`.
4. Load `itsolpowers:itsol-execution-policy` after workflow mode. Resolve and preserve the separate preset, policy sources, model/reasoning intent and control, agent/parallel/review ceilings, `done_when`, ranked `stop_after`, and escalation behavior. Never set `maxTurns` or treat agent termination as completion.
5. Select the smallest relevant process and domain skills. Use current official documentation for version-sensitive decisions.
6. Use `itsolpowers:itsol-tdd-workflow` before behavior-changing production work, or record a repository-policy exception and replacement verification.
7. Only the main agent delegates. Respect execution ceilings, use one writer per file or semantic contract, prohibit nested delegation, validate every response and evidence item, and preserve `partial`, `blocked`, and `failed` results.
8. Keep protected-action authority separate: destructive data operations, unrequested production publication/deployment, secrets outside scope, external communications or purchases, and security weakening require explicit authority.
9. Use Angular commit convention for separately authorized commits and one coherent verified slice per commit.
</EXTREMELY_IMPORTANT>
