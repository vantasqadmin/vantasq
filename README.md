# Vantasq

Marketing website for Vantasq, an AI-driven digital agency. It is a
static brochure site whose job is to explain the agency's services and turn
visitors into enquiries.

Live at [vantasq.com](https://vantasq.com).

## What the site covers

The landing page runs top to bottom as a single narrative: a hero pitch, trust
signals, the service catalogue, reasons to choose the agency, the engagement
process, an AI capability strip, testimonials, an FAQ, a closing call to
action, and a contact form.

Nine services are presented: digital marketing, SEO optimization, video editing,
web development and design, graphic design, content marketing, paid advertising,
social media management, and virtual assistant services. Each service card
links to one of five service pages, which carry the detail, an FAQ and their
own Service and FAQPage structured data:

- `digital-marketing-seo.html` — SEO, paid ads, social media, content
- `web-design.html` — websites, landing pages, e-commerce, graphic design
- `video-editing.html`
- `virtual-assistant-services.html`
- `ai-automation.html`

`portfolio.html` collects the agency work — client websites, the custom
business systems built for operations teams, paid campaigns, email, social
content and video — and links out to the live sites. Its imagery is real: screenshots of each live site and the campaign
creative as it was published, stored as webp under `assets/portfolio/`. Re-shoot
a screenshot with headless Chrome when a client site changes:

```
chrome --headless=new --hide-scrollbars --virtual-time-budget=20000 \
  --window-size=1440,900 --screenshot=out.png https://example.com/
```

then crop to 16:10 and convert to webp at 1280×800. The business systems have
no screenshots on purpose: they run inside client offices, so that section is
typographic rather than illustrated with mock-ups.

`about.html`, `privacy-policy.html` and `terms-of-service.html` complete the
set. The service, About and Portfolio pages share `legal-page.css` for their
shell and add `service-page.css` on top; Portfolio adds `portfolio-page.css`
for its full-width work sections. Nothing on the site quotes a price; fees are
left to the proposal, and the pages are written that way on purpose.

## Stack

Plain HTML, CSS, and vanilla JavaScript. No framework, no build, no
dependencies. Node is used only by CI to run `tools/check-site.js`.

```
public/      the website: the pages, assets/, robots.txt, sitemap.xml, _headers
docs/        why the site is built this way (decision notes)
tools/       the site checker CI runs on every pull request
.github/     CI
.claude/     project skills for Claude Code
```

Only `public/` is deployed. Site paths in this README (`assets/...`,
`_headers`) are relative to it.

## Development

Point Laragon's document root for `vantasq.test` at `public/`.
There is no build step for local work, so edit and refresh.

Pages link to each other by clean URL (`/privacy-policy`, not
`privacy-policy.html`) because that is what Cloudflare serves. To make Apache
under Laragon do the same, drop this `.htaccess` in `public/` (it is
git-ignored so it never ships):

```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]
```

## Deployment

Two Cloudflare Workers build from this repo using static assets: `vantasq`
deploys `main` to `vantasq.com`, and `vantasq-staging` deploys `staging`
and gives every pull request its own preview URL. DNS and SSL are managed in Cloudflare;
the domain is registered at GoDaddy with nameservers pointed at Cloudflare.

`wrangler.jsonc` tells Cloudflare to publish `public/` and nothing else. Its
default config is `vantasq`; `env.staging` is `vantasq-staging`, so that
Worker's build commands carry `--env staging`.

`_headers` sets security headers and caches `assets/*` for a day, so purge the
Cloudflare cache after a CSS or JS change if you need it visible immediately.
Its Content-Security-Policy lists every origin the pages talk to; if
`FORM_ENDPOINT` in `assets/scripts/main.js` is ever pointed at a form service,
add that origin to `connect-src` or submissions will be blocked.

`robots.txt` and `sitemap.xml` are deployed as-is; add a `<url>` to the sitemap
when a page is added.

Stylesheets and scripts are linked with `?v=<date>` and `_headers` caches
`assets/*` for a day at the edge and in browsers. Bump the version string in
every page whenever a CSS or JS file changes, or visitors keep the old file
until the cache expires.

## Contact

info@vantasq.com
