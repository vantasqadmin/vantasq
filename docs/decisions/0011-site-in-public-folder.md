# 0011. The website lives in `public/`

Status: Accepted
Date: 2026-10-01

## Context

The repo holds two kinds of files: the website, and things about the website
(docs, CI, the site checker, agent instructions). Whatever Cloudflare is
pointed at becomes a public URL, so the two must not share a folder.

## Decision

- Everything the website serves is in `public/`: the pages, `assets/`,
  `robots.txt`, `sitemap.xml`, `_headers` and the Search Console file.
- `wrangler.jsonc` points Cloudflare's static assets at `./public`, so only
  that folder is deployed.
- Repo files (`docs/`, `tools/`, `.github/`, `.claude/`, the `.md` files) stay
  at the root and are never served.
- Docs refer to site files by their path inside `public/` (`assets/...`),
  which is also their URL.

## Consequences

- Nothing outside `public/` can reach the site, including these notes.
- Laragon's document root for `vantasq.test` points at `public/`.
- Cloudflare builds with the repo's `wrangler.jsonc`: `vantasq` with the
  default config, `vantasq-staging` with `--env staging`.

## Related

- [0001. Plain static site, no framework or build](0001-plain-static-site.md)
- [0010. Branch, PR to staging, release to main](0010-staging-release-flow.md)
