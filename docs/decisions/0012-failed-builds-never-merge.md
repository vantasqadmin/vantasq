# 0012. A PR with a failed build is never merged

Status: Accepted
Date: 2026-10-01

## Context

Every PR gets two checks: `site` (`tools/check-site.js`) and Cloudflare's
"Workers Builds: vantasq-staging", which builds the PR's preview. A rebase onto
`staging` changes the code, so checks from before the rebase prove nothing
about what is merged.

## Decision

- `/vantasq-staging` waits for every check on a PR's current head, after its
  own rebase and push, before merging it.
- It merges only when every check passed and both `site` and
  `Workers Builds: vantasq-staging` are present. A failed, cancelled or missing
  check leaves the PR open, and the run carries on with the next PR.
- Each PR left open for a failed check is reported first, with the check's
  name and link.

## Consequences

- A broken build cannot reach `staging`, so the release gate in
  `/vantasq-prod` only has to prove the combination works.
- A run takes longer: one Cloudflare build per landed PR.

## Related

- [0010. Branch, PR to staging, release to main](0010-staging-release-flow.md)
