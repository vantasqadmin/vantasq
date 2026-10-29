# 0010. Branch, PR to staging, release to main

Status: Accepted
Date: 2026-10-01

## Context

Changes come from people and coding agents alike. An unchecked change must not
reach the live site, and agents need a written rule for when they may push or
merge.

## Decision

- Every change is a `<type>/<slug>` branch off the latest `staging`, opened as
  a PR against `staging`. `staging` is released to `main` (the live site) as
  its own PR.
- `tools/check-site.js` runs in CI on every PR to `staging` or `main`.
- Agents follow `AGENTS.md`: they commit and open PRs only when asked
  (`/vantasq-commit`), never push to `staging` or `main`, and never merge a
  change PR. `/vantasq-staging` and `/vantasq-prod` handle the two merges, and
  `/vantasq-prod` waits for checks to pass.

## Consequences

- Every change is reviewed and checked before it is live, at the cost of two
  merges per release.
- Git history is the changelog; there is no `CHANGELOG.md`. Commit subjects
  follow the branch types so they read as one.

## Related

- [0006. Cache-bust assets with a dated `?v=`](0006-dated-cache-busting.md)
- [0012. A PR with a failed build is never merged](0012-failed-builds-never-merge.md)
