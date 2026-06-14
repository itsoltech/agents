---
name: fix-pr-review
description: Fix unresolved GitHub PR review comments, reply to reviewers, and resolve threads.
---

# Fix PR Review

Use this skill when the user asks to address unresolved review comments on a GitHub pull request.

## Prerequisites

- The GitHub CLI `gh` is installed and authenticated.
- The current directory is inside the target repository.
- If a PR number is provided, use that PR. Otherwise, use the PR associated with the current branch.

## Workflow

1. Identify the repository owner and name:

```bash
gh repo view --json owner,name -q '"\(.owner.login)/\(.name)"'
```

2. Identify the PR:

```bash
gh pr view --json number,url -q '.number'
```

If the user provided a PR number, fetch that PR head branch and switch to it when needed:

```bash
PR_BRANCH=$(gh pr view PR_NUMBER --json headRefName -q '.headRefName')
CURRENT_BRANCH=$(git branch --show-current)
```

If `PR_BRANCH` differs from `CURRENT_BRANCH`, run `gh pr checkout PR_NUMBER` or check out the existing local branch.

3. Fetch unresolved review threads with GraphQL:

```bash
gh api graphql -f query='
query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(last: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          startLine
          comments(first: 10) {
            nodes {
              id
              databaseId
              body
              author { login }
              path
              line
              startLine
              originalLine
              diffHunk
            }
          }
        }
      }
    }
  }
}'
```

4. Filter to threads where `isResolved == false`. Skip `isOutdated == true` threads and list them separately.
5. For each unresolved, non-outdated thread:

- Read the full thread, including follow-up comments.
- Inspect the referenced file and surrounding code.
- Apply the smallest correct fix.
- If the request is ambiguous, architectural, or questionable, skip it and record why it needs manual attention.
- Draft a short, specific reply describing the actual change.

6. Reply to each fixed thread:

```bash
gh api graphql -f query='
mutation {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "THREAD_ID",
    body: "REPLY_TEXT"
  }) {
    comment { id }
  }
}'
```

7. Resolve each fixed thread:

```bash
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {
    threadId: "THREAD_ID"
  }) {
    thread { isResolved }
  }
}'
```

8. Stage only files changed during this process and create one commit:

```text
fix: address PR review feedback
```

Include a body listing each file and what changed.

## Rules

- Do not resolve a thread unless the issue was fixed or the comment needs no code change.
- Reply with concrete details, not generic acknowledgements like "Fixed as suggested."
- Escape double quotes, newlines, and backslashes when injecting reply text into GraphQL queries.
- Use `rg` instead of `grep` where possible.
- Do not push unless the user explicitly asks.
