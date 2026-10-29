---
name: vantasq-staging
description: Land every open pull request that targets staging in the vantasq repo, oldest first. Each PR branch is rebased onto the latest staging (never merged), conflicts are resolved, the branch is force-pushed with lease, its checks (including the Cloudflare preview build) must pass, and the PR is merged with GitHub's rebase method. PRs with a failed build are left open and reported. Use when the user runs /vantasq-staging or asks to merge, land or ship all PRs into staging.
context: fork
agent: general-purpose
---

# /vantasq-staging

Land every open PR whose base is `staging`, one at a time, oldest first, so
`staging` stays linear. Always rebase and never merge: no `git merge`, no merge
commits, and `gh pr merge --rebase` only.

Running this skill is the user's authorization to force-push the PR branches
it lands and to merge those PRs into `staging`. It does not authorize anything
else: never push to `main`, and never force-push `staging`.

## 0. Preflight

```bash
git status --porcelain          # must be empty; if not, stop and ask
gh auth status
git fetch origin --prune
```

Remember the branch the user was on so you can return to it at the end.

List the candidates:

```bash
gh pr list --repo vantasqadmin/vantasq --base staging --state open \
  --json number,title,headRefName,isDraft,isCrossRepository,mergeable \
  --jq 'sort_by(.number)[]'
```

Skip, and report as skipped:
- drafts;
- PRs from forks (`isCrossRepository: true`), because you cannot push to them;
- PRs whose head already has a failing check, including Cloudflare's
  "Workers Builds: vantasq-staging" preview build. A failed build is never
  merged; report it with its link (see "Checks gate" below).

If nothing is left, say so and stop.

## 1. For each PR, oldest first

```bash
git fetch origin staging <head>
git checkout -B <head> origin/<head>
git rebase origin/staging
```

The rebase is against the staging that already includes the PRs landed
earlier in this run, so fetch staging again before every PR.

If the rebase stops on a conflict, resolve it (see "Resolving conflicts"),
then run `git add <files>` and `GIT_EDITOR=true git rebase --continue`, and
repeat until the rebase finishes. If a conflict cannot be resolved with
confidence, run `git rebase --abort`, skip this PR, and carry on with the next.

After the rebase, check the result:

```bash
git grep -nE '^(<<<<<<<|=======|>>>>>>>)( |$)' -- . ':!*.md'   # must print nothing
git diff --stat origin/staging...HEAD                           # only this PR's files
```

Then run the site checks (cache-busting, links, JSON-LD, sitemap, pricing):

```bash
BASE_REF=origin/staging node tools/check-site.js
```

If they fail, do not push or merge. Skip the PR and report what the check
printed.

Then push, if the rebase changed anything (`git rev-parse HEAD` differs from
`origin/<head>`):

```bash
git push --force-with-lease origin <head>
```

### Checks gate

A push starts new checks, and checks from before the rebase say nothing about
the rebased code. Wait for every check on the PR's current head to finish:

```bash
gh pr checks <number> --repo vantasqadmin/vantasq --watch
gh pr checks <number> --repo vantasqadmin/vantasq --json name,state,link \
  --jq '.[] | .name+" "+.state+" "+.link'
```

Checks can take a few seconds to appear after a push; if `gh` reports none
yet, run it again (a few tries, about a minute in all).

Merge only when every check is `SUCCESS` or `SKIPPED`, and both `site` and
`Workers Builds: vantasq-staging` are among them. Otherwise do not merge:
leave the PR open, skip it, and carry on with the next PR. A failed, cancelled
or missing check is a skip. In the report, give each failing or missing
check's name and link. For a Cloudflare build, the link opens the build log in
the Cloudflare dashboard; read it there only if the user asks why it failed.

When the gate passes, merge:

```bash
gh pr merge <number> --repo vantasqadmin/vantasq --rebase --delete-branch
```

If `gh pr merge` says the branch is out of date or not mergeable, another PR
has just landed, so repeat step 1 for this PR once. If it fails again, skip it.

## Resolving conflicts

Read both sides and the PR description before touching anything. The goal is
a result that keeps both intents, not one that picks a side.

- **Cache-bust strings (`?v=YYYYMMDD…`)**: take the later value. If both sides
  changed CSS or JS, set today's date (with a letter suffix if it is taken) in
  every page, as `CLAUDE.md` requires.
- **Header, nav or footer markup** (duplicated in all twelve pages): combine
  both changes, and make sure every page ends up identical.
- **`sitemap.xml`**: keep every `<url>` from both sides and the later
  `<lastmod>`.
- **JSON-LD**: merge the entries from both sides, keep it valid JSON, and keep
  it matching the visible page copy.
- **CSS**: keep both rule changes. If both sides changed the same property of
  the same selector, take the PR's value, since it is the newer intent, and
  mention it in the report.
- **Docs (`CLAUDE.md`, `AGENTS.md`, `README.md`)**: combine the prose.
- **Same copy rewritten differently on both sides**, or anything where
  keeping both intents is not obvious: do not guess. Abort that PR's rebase
  and skip it.

Site rules still apply to the resolved result: no pricing language, and the
contact email is `info@vantasq.com`.

## 2. Finish

```bash
git fetch origin --prune
git checkout <branch the user started on>
```

Report in a few lines: the PRs merged (number and title), the PRs skipped and
why, and every conflict you resolved (file and how you resolved it). Put a
PR skipped for a failed build first, as "#<n> <title>: not merged,
<check name> failed, <link>", so it cannot be missed.
