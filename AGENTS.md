# AGENTS.md

Instructions for any coding agent (Claude Code, Codex, Cursor and the like)
working in this repository. The programmer describes the change they want in
plain words. You turn that into a branch off the latest `staging` with the
change implemented and checked.

Read `CLAUDE.md` too. It describes the file layout, design tokens and page
structure. This file covers how to do the work.

## The workflow

When the programmer describes a change ("update the phone number", "add a FAQ
to the web design page", "the footer overlaps on mobile"), follow these steps
in order.

### 1. Understand the request

- Restate the change to yourself as a concrete edit: which pages or files it touches and
  what the result should look like.
- If the request is ambiguous and a wrong guess would waste real work (which
  page, what wording, what the new value is), ask one short question first.
  Otherwise pick the sensible reading and say which one you chose.
- If the change affects several pages (header, footer, contact details, anything
  duplicated), find every copy before you start:
  `git grep -n "<text>"`.

### 2. Start from the latest staging

Never work on `main` or `staging` directly, and never reuse an old branch for
a new request.

```bash
git status                       # must be clean; if not, stop and ask
git fetch origin
git checkout -b <type>/<short-slug> origin/staging
git branch --unset-upstream      # so a bare `git push` can never land on staging
```

Branch names: `<type>/<short-kebab-slug>`, where type is one of

| type     | use for                                              |
|----------|------------------------------------------------------|
| `fix`    | something broken or wrong (layout bug, dead link)    |
| `content`| copy, contact details, images, portfolio entries     |
| `feat`   | a new page, section or behaviour                     |
| `design` | visual changes with no new content                   |
| `seo`    | meta tags, JSON-LD, sitemap, robots                  |
| `chore`  | tooling, docs, config, headers                       |

Example: `content/update-contact-email`, `fix/footer-overflow-mobile`.

If the working tree is dirty, do not stash, reset or discard anything. Tell
the programmer what is uncommitted and ask what to do.

### 3. Implement

Keep the change as small as the request allows. Do not refactor, reformat or
"tidy up" code the request does not touch.

Rules that apply to every change on this site. The website is everything in
`public/`; site paths below (`assets/...`, `_headers`, `sitemap.xml`, the
pages) are relative to it.

- **Plain static site.** HTML, CSS and vanilla JS only. No build step, no
  framework, no npm packages in the shipped site. Only `public/` is
  deployed; do not put repo files (docs, tools, notes) in it.
- **Shared styles live in `assets/styles/`.** `main.css` owns the header, nav,
  logo, buttons and footer. The page stylesheets (`home-page.css`,
  `service-page.css`, `legal-page.css`, `portfolio-page.css`,
  `contact-block.css`) own page-specific rules. Do not re-add nav, logo or
  button rules to page stylesheets.
- **Header and footer markup is duplicated in all twelve pages.** A change to
  either must be made in every page:
  `about`, `ai-automation`, `contact`, `digital-marketing-seo`, `index`,
  `portfolio`, `privacy-policy`, `services`, `terms-of-service`,
  `video-editing`, `virtual-assistant-services`, `web-design`.
  (`googled8bc16d6be7851a6.html` is a Search Console verification file. Never
  edit it.)
- **Cache-busting.** Every `<link rel="stylesheet">` and `<script src>` carries
  `?v=<yyyymmdd>`. If you changed any CSS or JS file, bump that string to
  today's date in all twelve pages (add a letter suffix, such as `20260930b`, if
  today's date is already in use):
  `grep -l '?v=' public/*.html`.
- **Use the design tokens** (`--blue`, `--night`, `--cyan` and so on in
  `:root`) rather than hard-coded colours.
- **No prices.** No prices, packages, payment terms, billing language or
  "affordable"-type copy anywhere. Fees are left to the proposal.
- **Contact email** is `info@vantasq.com` (also `CONTACT_EMAIL` in
  `assets/scripts/main.js`).
- **Content Security Policy.** `_headers` sets a strict CSP. Any new
  third-party script, font, image host or fetch target must be added there, or
  it will be blocked in production. Prefer self-hosting (fonts are already
  self-hosted in `assets/fonts/`).
- **SEO data stays in sync.** If you change a service page's visible FAQ,
  title or description, update its JSON-LD (`Service`, `FAQPage`,
  `BreadcrumbList`) and meta tags to match. New pages need an entry in
  `sitemap.xml`, the same header and footer, and canonical and OG tags.
- **Images.** Add them under `assets/` (portfolio work goes in
  `assets/portfolio/`), provide `.webp` where the page already uses it, and
  always set `alt`, `width` and `height`.
- **The globe.** `assets/scripts/hero-globe.js` uses the trimmed Three.js build
  in `assets/scripts/vendor/three.min.js`. If you need a Three.js class that
  isn't in it, the vendor bundle must be rebuilt. Flag this to the programmer
  rather than loading Three.js from a CDN.

### 4. Check your work

There are no tests and no build, so check the result directly:

- `git diff` and read every hunk. Nothing unrelated should be in it.
- Re-run the `git grep` from step 1 to confirm no copy was missed.
- If the site is running locally (Laragon: `http://vantasq.test`, document
  root `public/`), open the affected pages. Check desktop and a
  phone-width viewport (about 375px), and check the browser console for
  errors. Layout changes must not cause horizontal scroll on phones.
- Validate any JSON-LD you touched (it must still parse as JSON).
- If the change sets a new rule, picks between real alternatives, or reverses
  a note in `docs/decisions/`, add a decision note (see `docs/README.md`).
  Routine fixes and copy edits do not need one.

### 5. Hand it back

Tell the programmer, briefly:

- the branch name,
- what changed and in which files,
- anything you could not check or had to assume.

Commit, push and open a pull request **only when the programmer asks**. When
they do:

```bash
git add <files>
git commit -m "<type>: <what changed, in plain words>"
git push -u origin <branch>
gh pr create --base staging --title "<same as commit subject>" --body "<what and why>"
```

Pull requests always target `staging`, never `main`. Never merge a pull
request, and never push to `staging` or `main`. Merging is the programmer's
call.
