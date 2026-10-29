---
name: vantasq-commit
description: Commit the change currently being worked on in the vantasq repo and open a pull request to staging. Creates a properly named branch off staging if still on staging or main, runs the site checks, commits only the files belonging to the change, pushes, and opens (or updates) the PR against staging. Never merges. Use when the user runs /vantasq-commit or says "commit and open a PR to staging", "ship this fix to staging", or similar.
---

# /vantasq-commit

Commit the work in progress and open a PR to `staging`. Follows step 5 of
`AGENTS.md`. Running this skill is the user's authorization to commit, push the
feature branch and open or update its PR. It does not authorize merging, and
never push to `staging` or `main`.

## 0. Look at what is there

```bash
git status --porcelain
git branch --show-current
git fetch origin --prune
```

- Nothing to commit and nothing unpushed: say so and stop.
- Read `git diff` and `git diff --cached` in full. Work out what the change is
  and which files belong to it. Files that clearly have nothing to do with it
  (stray scratch files, unrelated edits) are left uncommitted; name them in the
  report. If you cannot tell which files belong, ask.

## 1. Be on a feature branch

If the current branch is `staging` or `main` (or `HEAD` is detached), create
one, carrying the uncommitted changes with it:

```bash
git checkout -b <type>/<short-slug>
git branch --unset-upstream 2>/dev/null || true
```

Type is one of `fix`, `content`, `feat`, `design`, `seo`, `chore` (see
`AGENTS.md`). Pick it and the slug from the diff.

If the branch is not based on the latest `origin/staging`
(`git merge-base --is-ancestor origin/staging HEAD` fails), commit first
(step 3), then `git rebase origin/staging`. Resolve conflicts the way
`/vantasq-staging` describes; if one cannot be resolved with confidence, abort
the rebase and ask.

## 2. Check

- If any CSS or JS under `public/assets/` changed, every page's `?v=` must be bumped
  to today's date (letter suffix if taken). Do it if it was missed.
- Run the site checks when the script exists:

  ```bash
  BASE_REF=origin/staging node tools/check-site.js
  ```

  Fix anything it reports that the change caused. If a failure predates the
  change, leave it and mention it.
- If the change sets a new rule, picks between real alternatives, or reverses
  a note in `docs/decisions/`, add the next numbered note from
  `docs/decisions/_template.md` (mark any reversed note `Superseded by`), link
  it from related notes and add its row to `docs/README.md`. Include it in the
  same commit. Skip this for routine fixes and copy edits.

## 3. Commit

```bash
git add <files>
git commit -m "<type>: <what changed, in plain words>"
```

One commit unless the work is clearly several unrelated changes. Subject in
lower case after the type, no trailing period, under ~70 characters. Add a
short body only when the why is not obvious from the subject.

## 4. Push and open the PR

```bash
git push -u origin <branch>
gh pr list --repo vantasqadmin/vantasq --head <branch> --state open --json number,url
```

If a PR already exists for the branch, the push updated it; stop there.
Otherwise:

```bash
gh pr create --repo vantasqadmin/vantasq --base staging \
  --title "<commit subject>" --body "<what and why, then pages/files touched>"
```

Base is always `staging`, never `main`. After a rebase the push needs
`--force-with-lease`, and only on this feature branch.

## 5. Report

One or two lines: the branch, the commit subject, the PR link, and any files
left uncommitted or checks that failed.
