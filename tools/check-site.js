#!/usr/bin/env node
// Static checks for the site, run on every pull request by
// .github/workflows/checks.yml. No dependencies: `node tools/check-site.js`.
//
// Set BASE_REF (e.g. origin/staging) to also require a ?v= bump whenever a
// CSS or JS file under public/assets/ changed against that ref.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repo = path.resolve(__dirname, '..');
const root = path.join(repo, 'public');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const errors = [];
const fail = (file, msg) => errors.push(`${file}: ${msg}`);

const pages = fs.readdirSync(root)
  .filter((f) => f.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(f))
  .sort();

// ─── Cache-busting: one ?v= value, on every local stylesheet and script ───
const versions = new Set();
for (const page of pages) {
  const html = read(page);
  const tags = html.match(/<link[^>]+rel="stylesheet"[^>]*>|<script[^>]+src="[^"]+"[^>]*>/g) || [];
  for (const tag of tags) {
    const url = (tag.match(/(?:href|src)="([^"]+)"/) || [])[1];
    if (!url || /^(https?:)?\/\//.test(url)) continue;
    const v = (url.match(/\?v=([^"&]+)/) || [])[1];
    if (!v) fail(page, `${url} has no ?v= cache-buster`);
    else versions.add(v);
  }
}
if (versions.size > 1) {
  errors.push(`?v= differs between pages (${[...versions].join(', ')}); bump it in all of them`);
}

// ─── A changed CSS/JS file needs a new ?v= ───
if (process.env.BASE_REF && versions.size === 1) {
  // R100 is a pure move: the file content, and so the browser's copy, is unchanged.
  const diff = execSync(`git diff --name-status ${process.env.BASE_REF}...HEAD`, { cwd: repo })
    .toString().split('\n').filter((l) => l && !/^(D|R100)\t/.test(l))
    .map((l) => l.split('\t').pop()).filter((f) => /^public\/assets\/.*\.(css|js)$/.test(f));
  const baseIndex = diff.length
    ? execSync(`git show ${process.env.BASE_REF}:public/index.html`, { cwd: repo }).toString() : '';
  const baseV = (baseIndex.match(/\?v=([^"&]+)/) || [])[1];
  if (diff.length && baseV === [...versions][0]) {
    errors.push(`${diff.join(', ')} changed but ?v= is still ${baseV}; bump it in every page`);
  }
}

// ─── Local links and assets resolve ───
const exists = (url) => {
  const clean = decodeURI(url.split(/[?#]/)[0]);
  if (clean === '' || clean === '/') return true;
  const p = path.join(root, clean.replace(/^\//, ''));
  return fs.existsSync(p) || fs.existsSync(`${p}.html`) || fs.existsSync(path.join(p, 'index.html'));
};
for (const page of pages) {
  const html = read(page);
  for (const [, url] of html.matchAll(/\b(?:href|src|srcset|content)="([^"]+)"/g)) {
    for (const candidate of url.split(',').map((s) => s.trim().split(/\s+/)[0])) {
      if (!candidate || /^(https?:|mailto:|tel:|data:|#|javascript:)/.test(candidate) || candidate.startsWith('//')) continue;
      if (!/^[./]|^assets\/|^[\w-]+\.(html|png|jpe?g|webp|svg|css|js|ico|xml|txt)/.test(candidate)) continue;
      if (!exists(candidate)) fail(page, `broken local reference ${candidate}`);
    }
  }
}
for (const css of fs.readdirSync(path.join(root, 'assets/styles')).filter((f) => f.endsWith('.css'))) {
  const file = `assets/styles/${css}`;
  for (const [, url] of read(file).matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    if (/^(data:|https?:|#)/.test(url)) continue;
    const target = url.startsWith('/') ? url : path.posix.join('assets/styles', url);
    if (!exists(target)) fail(file, `broken url(${url})`);
  }
}

// ─── JSON-LD parses ───
for (const page of pages) {
  for (const [, json] of read(page).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); } catch (e) { fail(page, `invalid JSON-LD: ${e.message}`); }
  }
}

// ─── Sitemap lists every page ───
const sitemap = read('sitemap.xml');
for (const page of pages) {
  const slug = page === 'index.html' ? '' : page.replace(/\.html$/, '');
  if (!sitemap.includes(`<loc>https://vantasq.com/${slug}</loc>`)) {
    fail('sitemap.xml', `missing ${page}`);
  }
}

// ─── No prices or billing language (site-wide rule) ───
const pricing = /\$\s?\d|\b(price[sd]?|pricing|affordable|per month|\/mo\b)\b/i;
for (const page of pages) {
  const text = read(page).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
  const hit = text.match(pricing);
  if (hit) fail(page, `pricing language "${hit[0]}" (fees are left to the proposal)`);
}

// ─── No team location (site-wide rule, docs/decisions/0014) ───
const location = /philippin|filipin|manila|PHT|"addressCountry"/i;
for (const page of pages) {
  const hit = read(page).match(location);
  if (hit) fail(page, `names the team's location "${hit[0]}"`);
}

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  console.error(`\n${errors.length} problem(s) in ${pages.length} pages`);
  process.exit(1);
}
console.log(`✓ ${pages.length} pages pass`);
