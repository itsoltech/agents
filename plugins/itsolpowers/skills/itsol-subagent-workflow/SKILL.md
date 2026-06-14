---
name: itsol-subagent-workflow
description: "Subagent execution: task split, concurrency, review loops, commits, validation."
---

# ITSOL Subagent Workflow

Use this skill after a Business Plan and Technical Plan are approved and the user chooses subagent-driven execution.

## Process

1. Split the approved Technical Plan into small, independent implementation tasks with clear file or module ownership.
2. Establish the maximum number of implementation tasks that may run concurrently before starting delegation.
3. Assign each task to the narrowest suitable subagent and give it scope, constraints, expected output, verification, and owned files.
4. When an implementation subagent finishes, start a separate review subagent for that task's changed area.
5. Repeat implementation and review until every actionable review finding is resolved or explicitly deferred by the user.
6. After a task slice is implemented, reviewed, and verified, commit only that slice using Angular commit convention.
7. Run final validation for the whole change, compare the result against the approved plans, inspect the diff, and summarize work for the user.

Read [references/guide.md](references/guide.md) before delegating work. If the work is not approved for subagent-driven execution, use the normal inline workflow instead.
