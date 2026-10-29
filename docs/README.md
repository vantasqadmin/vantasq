# Docs

The why behind the site. `README.md` at the root says what the site is,
`AGENTS.md` says how to make a change, `CLAUDE.md` maps the files. This folder
records the decisions those files take for granted, so nobody has to dig
through git history to learn why a rule exists.

Open this folder as an Obsidian vault, or read it on GitHub. Links are plain
relative markdown links, which work in both. Paths like `assets/...` mean the
file inside `public/`, the website folder.

## Decisions

One note per decision, numbered in the order they were made. A decision is
never edited to say something else: write a new note that supersedes it and
mark the old one `Superseded by`.

| #    | Decision                                                                      | Status   |
|------|-------------------------------------------------------------------------------|----------|
| 0001 | [Plain static site, no framework or build](decisions/0001-plain-static-site.md) | Accepted |
| 0002 | [Position as an offshore outsourcing partner](decisions/0002-outsourcing-positioning.md) | Superseded by 0014 |
| 0003 | [No prices anywhere on the site](decisions/0003-no-prices.md)                 | Accepted |
| 0004 | [Only claims we can stand behind](decisions/0004-only-defensible-claims.md)   | Accepted |
| 0005 | [Shared styles, duplicated header markup](decisions/0005-shared-styles-duplicated-markup.md) | Accepted |
| 0006 | [Cache-bust assets with a dated `?v=`](decisions/0006-dated-cache-busting.md) | Accepted |
| 0007 | [Self-host assets behind a strict CSP](decisions/0007-self-hosted-strict-csp.md) | Accepted |
| 0008 | [A trimmed Three.js bundle for the globe](decisions/0008-trimmed-threejs-globe.md) | Accepted |
| 0009 | [Real imagery only on the portfolio](decisions/0009-real-portfolio-imagery.md) | Accepted |
| 0010 | [Branch, PR to staging, release to main](decisions/0010-staging-release-flow.md) | Accepted |
| 0011 | [The website lives in `public/`](decisions/0011-site-in-public-folder.md) | Accepted |
| 0012 | [A PR with a failed build is never merged](decisions/0012-failed-builds-never-merge.md) | Accepted |
| 0013 | [The globe waits for the first interaction](decisions/0013-globe-waits-for-interaction.md) | Accepted |
| 0014 | [Do not name where the team is based](decisions/0014-no-team-location.md) | Accepted |

## Adding a note

Copy [the template](decisions/_template.md) to the next number, fill it in,
link it from the related notes and add a row above. Write one when a change
sets a rule others must follow, picks between real alternatives, or would make
someone ask "why is it like this?" later. Routine fixes and copy edits do not
need one; the commit message is enough.
