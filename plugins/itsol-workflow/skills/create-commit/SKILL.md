---
name: create-commit
description: Create a Git commit using Angular commit message conventions.
---

# Create Commit

Use this skill when the user asks to create a commit for the current worktree.

## Workflow

1. Inspect `git status --short` and the relevant diff.
2. Identify whether the change is a fix, feature, refactor, chore, docs, test, style, build, or CI change.
3. Do not classify small supporting changes as `feat` unless they introduce user-visible behavior or a meaningful new capability.
4. Stage only files that belong to the requested change.
5. Create one commit using the Angular convention:

```text
type(scope): concise summary
```

Use a body when it clarifies non-obvious context, lists important changed files, or explains a tradeoff. Do not push unless the user explicitly asks.

## Commit Types

- `feat`: new user-facing behavior or meaningful capability
- `fix`: bug fix or regression fix
- `refactor`: internal restructuring without behavior change
- `chore`: maintenance, tooling, dependency, or metadata update
- `docs`: documentation-only change
- `test`: test-only change
- `style`: formatting-only change
- `build`: build system or packaging change
- `ci`: CI configuration change
