# Debugging Questions And Fix

## Debugging Questions

- Does the key include every value used by `queryFn`?
- Does the key distinguish tenant/org/user?
- Are two different data shapes sharing one key?
- Does `queryFn` throw for non-2xx?
- Is `AbortSignal` causing expected cancellation or unexpected error UI?
- Is query disabled by `enabled` or `skipToken`?
- Does mutation return a Promise from invalidation when pending state matters?
- Is invalidation too narrow, too broad, or aimed at the wrong prefix?
- Is Next.js server cache fresh while Query cache is stale, or the reverse?
- Is `router.refresh()` being used where `invalidateQueries()` is needed?
- Is SSR prefetch using the same options as client `useQuery`?
- Does Devtools show previous tenant/user data after context switch?

## Fix Discipline

- Fix the smallest cache invariant that is broken.
- Prefer regression tests for query keys, invalidation, auth cache clearing, hydration, optimistic rollback, and live event mapping.
- If the repo lacks test support, document a manual repro and replacement verification according to `.itsol.md`.
- After a fix, inspect Devtools and Network to confirm the cache operation changed the intended query only.
