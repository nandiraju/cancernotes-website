// Generates sitemap.xml from the pages themselves, so it can never drift.
//
// <loc>     each page's own <link rel="canonical">. A page with no canonical, or
//           one marked noindex/none in <meta name="robots">, is left out (404.html).
// <lastmod> the date that page's CONTENT last changed. The script hashes only the
//           part of the page that carries content -- <title>, the meta description
//           and everything inside <main> -- and keeps the hash plus its date in
//           scripts/sitemap.state.json. A shared header/footer/nav edit therefore
//           does not reset every page's lastmod, which is what makes the dates
//           worth anything to a crawler; real content edits bump them to today.
//           Unknown pages fall back to the file's last git commit date.
//
// Optional scripts/sitemap.config.json adds Google Image Sitemap entries:
//   { "images": { "index.html": ["assets/images/og-image.jpg", "..."] } }
//
// Portable: no page list and no site-specific values live in this file.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const ROOT = process.cwd();
const CONFIG = 'scripts/sitemap.config.json';
const STATE = 'scripts/sitemap.state.json';
const OUT = 'sitemap.xml';

const TODAY = new Date().toISOString().slice(0, 10);
const readJson = (f, fallback) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback);

/** Last commit date (YYYY-MM-DD) for a file; today if dirty, untracked or no git. */
function gitLastModified(file) {
  const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  try {
    if (git(['status', '--porcelain', '--', file]) !== '') return TODAY;
    return git(['log', '-1', '--format=%cs', '--', file]) || TODAY;
  } catch {
    return TODAY;
  }
}

/**
 * Fingerprint of the parts of a page that are content, ignoring the shared
 * chrome. Whitespace is collapsed so reformatting alone never counts as a change.
 */
function contentHash(html) {
  const pick = (re) => html.match(re)?.[1] ?? '';
  const parts = [
    pick(/<title>([\s\S]*?)<\/title>/i),
    pick(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i),
    pick(/<main\b[^>]*>([\s\S]*?)<\/main>/i),
  ];
  return createHash('sha256').update(parts.join('\u0000').replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 16);
}

const xmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const imagesFor = readJson(CONFIG, {}).images ?? {};
const state = readJson(STATE, {});
const nextState = {};

const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
if (pages.length === 0) throw new Error('no .html pages found in the site root');

const entries = [];
const skipped = [];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');

  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i)?.[1] ?? '';
  if (/\b(noindex|none)\b/i.test(robots)) {
    skipped.push(`${page} (robots: ${robots.trim()})`);
    continue;
  }

  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
  if (!canonical) {
    skipped.push(`${page} (no rel=canonical)`);
    continue;
  }
  if (!/^https:\/\//.test(canonical)) {
    throw new Error(`${page}: canonical is not an absolute https URL: ${canonical}`);
  }
  if (!/<main\b/i.test(html)) {
    throw new Error(`${page}: no <main> element, so its content cannot be fingerprinted`);
  }

  const hash = contentHash(html);
  const prev = state[page];
  // Content unchanged -> keep the date it really last changed, however many
  // header/footer edits have landed since.
  const lastmod = prev?.hash === hash ? prev.lastmod : prev ? TODAY : gitLastModified(page);
  const changed = !prev ? 'new' : prev.hash === hash ? '' : `content changed (was ${prev.lastmod})`;

  nextState[page] = { hash, lastmod };
  entries.push({ page, loc: canonical, lastmod, changed, images: imagesFor[page] ?? [] });
}

if (entries.length === 0) throw new Error('every page was skipped; nothing to write');

// Deterministic order: homepage first (shortest canonical), then alphabetical.
entries.sort((a, b) => a.loc.length - b.loc.length || a.loc.localeCompare(b.loc));

const origin = new URL(entries[0].loc).origin;
for (const e of entries) {
  const o = new URL(e.loc).origin;
  if (o !== origin) throw new Error(`${e.page}: canonical origin ${o} does not match ${origin}`);
}

const usesImages = entries.some((e) => e.images.length > 0);
const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    (usesImages ? '\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : '') +
    '>',
];
for (const e of entries) {
  lines.push('  <url>');
  lines.push(`    <loc>${xmlEscape(e.loc)}</loc>`);
  lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
  for (const img of e.images) {
    lines.push('    <image:image>', `      <image:loc>${xmlEscape(new URL(img, `${origin}/`).href)}</image:loc>`, '    </image:image>');
  }
  lines.push('  </url>');
}
lines.push('</urlset>', '');

writeFileSync(OUT, lines.join('\n'));
writeFileSync(STATE, `${JSON.stringify(nextState, null, 2)}\n`);

// Keep robots.txt pointing at the sitemap we just wrote.
if (existsSync('robots.txt')) {
  const robotsTxt = readFileSync('robots.txt', 'utf8');
  const want = `Sitemap: ${origin}/sitemap.xml`;
  if (!robotsTxt.split('\n').some((l) => l.trim() === want)) {
    const next = /^Sitemap:/im.test(robotsTxt)
      ? robotsTxt.replace(/^Sitemap:.*$/im, want)
      : `${robotsTxt.replace(/\s*$/, '\n')}\n${want}\n`;
    writeFileSync('robots.txt', next);
    console.log(`robots.txt  updated -> ${want}`);
  }
}

console.log(`${OUT}  ${entries.length} url(s)`);
for (const e of entries) {
  const extras = [e.images.length ? `+${e.images.length} images` : '', e.changed].filter(Boolean).join(', ');
  console.log(`  ${e.lastmod}  ${e.loc}${extras ? `  (${extras})` : ''}`);
}
for (const s of skipped) console.log(`  skipped: ${s}`);
