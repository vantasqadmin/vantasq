# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Vantasq** is a static marketing website for an AI-driven digital agency. There is no build system, no package manager, and no framework — everything is plain HTML, CSS, and vanilla JavaScript served directly by Laragon.

## Development

Open the site in a browser via Laragon's local server (`http://vantasq.test`, with the document root set to `public/`). There is no build step, compilation, or hot-reload — just edit files and refresh the browser.

## File Structure

Everything the website serves lives in `public/`, and Cloudflare publishes only that folder (`wrangler.jsonc`). Repo files (`docs/`, `tools/`, `.github/`, `.claude/`, the `.md` files) stay at the root and are never served. Paths below are relative to `public/` unless they start with `docs/` or `tools/`.

- `index.html` — Main landing page
- `digital-marketing-seo.html`, `web-design.html`, `video-editing.html`, `virtual-assistant-services.html`, `ai-automation.html` — Service pages (same shell as the legal pages plus `assets/styles/service-page.css`; each carries Service, FAQPage and BreadcrumbList JSON-LD)
- `services.html` — Services hub listing the five roles (same shell)
- `contact.html` — Contact page: the enquiry form on its own URL (shares `assets/styles/contact-block.css` with the home page section)
- `about.html` — About page (same shell)
- `portfolio.html` — Portfolio page (same shell plus `assets/styles/portfolio-page.css`; full-width work sections instead of the TOC sidebar, real screenshots and campaign creative in `assets/portfolio/`, CollectionPage/ItemList/BreadcrumbList JSON-LD). No decorative icons here: the images carry the page.
- `privacy-policy.html` — Privacy policy page
- `terms-of-service.html` — Terms of service page
- `assets/` — `styles/`, `scripts/main.js`, self-hosted `fonts/`, `logo-mark.svg` (header/footer mark), `icon.svg` + `apple-touch-icon.png` + `../favicon.ico` (browser icons), `logo.png` (512px icon for JSON-LD), `og-image.jpg`
- `assets/scripts/hero-globe.js` + `globe-land.js` — the WebGL globe on the home page, imported by `main.js` after load. `vendor/three.min.js` is a trimmed Three.js r186 build (only the classes `hero-globe.js` imports); regenerate it if the globe needs another Three.js class. `assets/images/globe-poster.svg` is the globe's first frame, shown before WebGL starts and when it cannot.
- Dark sections use `--night` (#0d3d73). Header: night on every page, using the transparent `assets/logo-mark.svg`; the home page adds `nav-over` so it starts clear over the hero.
- `robots.txt`, `sitemap.xml`, `_headers` — crawl and Cloudflare header config, deployed as-is
- `tools/check-site.js` — the CI check (cache-busting, links, JSON-LD, sitemap, pricing); Node is used for nothing else
- `docs/` — why the site is built the way it is. `docs/decisions/` holds one numbered note per decision, indexed in `docs/README.md`. Read the relevant note before changing a rule it records.

Site-wide rule: no prices, payment terms or billing language anywhere. Fees are
left to the proposal. Do not add pricing, packages or "affordable" copy.

Site-wide rule: do not name where the team is based (no Philippines, Manila,
PHT or `addressCountry`). See `docs/decisions/0014-no-team-location.md`.

Assets are cache-busted with `?v=<date>` on every `<link rel="stylesheet">`
and `<script src>`. After changing any CSS or JS, bump the version string in
all twelve HTML pages (`grep -l '?v=' public/*.html`).

## Architecture

### Pages and stylesheets
No page has inline `<style>`. Every page loads `assets/styles/main.css` (tokens, header, nav, buttons, footer) and then its own:
- `index.html`: `home-page.css` + `contact-block.css`
- service pages, `services`, `about`: `legal-page.css` + `service-page.css`
- `contact.html`: those two + `contact-block.css`
- `portfolio.html`: those two + `portfolio-page.css`
- `privacy-policy`, `terms-of-service`: `legal-page.css`

`assets/scripts/main.js` (loaded on every page) runs the mobile nav, the contact form and, on the home page, loads the globe on the first scroll, pointer move or key press after `load` (never at 860px or narrower).

### Home page sections
`#hero` → `#trust` → `#services` → `#why` → `#process` → `#ai-strip` → `#testimonials` → `#faq` → `#cta` → `#contact`. The section IDs are the nav anchors.

### Header
Every page renders the same navbar and mobile sheet: Home, Services, Portfolio,
About, Contact, one Get Started button and a hamburger below 860px. The markup
is duplicated per page, but the styles live in `assets/styles/main.css` — do not
re-add nav, logo or button rules to the page stylesheets. The nav is
`position: sticky`; `nav-over` on the home page makes it fixed and clear over the hero.

### Design tokens
Defined in `:root` in `assets/styles/main.css`; use them instead of hard-coded colours. Main ones: `--blue` #1658a1, `--blue-dark`/`--night` #0d3d73, `--blue-mid` #1d78c4, `--cyan` #54c8da, `--cyan-light` #7dd8e6, `--ink` #0b2545, `--paper` #f6f8fb, `--border` #dce5f0, `--radius` 10px.

### Typography
Self-hosted in `assets/fonts/`: **Montserrat** (`--font-display`, headings/logo), **Poppins** (`--font-sans`, body/UI), **Nunito** (secondary).

### Contact form
Handled in `assets/scripts/main.js`. With `FORM_ENDPOINT` empty (the current setting) it opens the visitor's mail client addressed to `CONTACT_EMAIL`; set it to a form service URL to post there instead, and add that origin to `connect-src` in `_headers`.

## Key Conventions

- Contact email: `info@vantasq.com`
- Decisions behind these rules: `docs/decisions/`.
