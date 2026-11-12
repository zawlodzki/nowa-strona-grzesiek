#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

// 2026-11-12 production dataset: CSS 37,646 B, JS 7,934 B, each file gzipped
// separately and summed. Rounded limits allow approximately 10% growth.
export const BUDGETS = { css: 42_000, js: 8_800 };
const ORIGIN = 'https://www.zawlodzki.pl';
const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map((m) => [m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4])]));
}
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
}
function route(file) {
  return '/' + file.replace(/\.html$/, '').replace(/(^|\/)index$/, '').replace(/\/$/, '');
}
function csv(text) {
  const rows = []; let row = [], value = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(value.replace(/\r$/, '')); value = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else value += c;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift();
  return rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

export function checkDist(dist, { urlMap = join(ROOT, 'migration/contracts/url-map.csv'), budgets = BUDGETS } = {}) {
  const files = new Map(walk(dist).map((f) => [relative(dist, f).replaceAll('\\', '/'), f]));
  const pages = new Map([...files].filter(([f]) => f.endsWith('.html')).map(([f, p]) => [route(f), p]));
  const errors = [], reports = [], sizes = { css: 0, js: 0 };
  const fail = (path, message) => errors.push(`${path}: ${message}`);
  function local(url) {
    try {
      const u = new URL(url);
      if (u.origin !== ORIGIN || u.search || u.hash) return null;
      return decodeURIComponent(u.pathname);
    } catch { return null; }
  }
  for (const [path, file] of pages) {
    if (path === '/404' || path === '/_ds' || path.startsWith('/_ds/')) continue;
    // Ignore comments and raw script/style contents when scanning structural HTML.
    const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
    const structure = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
    const links = [...structure.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
    if ([...structure.matchAll(/<h1\b[^>]*>/gi)].length !== 1) fail(path, 'expected exactly one h1');
    const titles = [...structure.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
    if (titles.length !== 1 || !titles[0][1].trim()) fail(path, 'expected non-empty title');
    const descriptions = [...structure.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0])).filter((a) => a.name?.toLowerCase() === 'description');
    if (descriptions.length !== 1 || !descriptions[0].content?.trim()) fail(path, 'expected non-empty meta description');
    const canonicals = links.filter((a) => a.rel?.toLowerCase() === 'canonical');
    const canonical = canonicals[0]?.href;
    const canonicalPath = local(canonical);
    if (canonicals.length !== 1 || canonicalPath !== path || canonicalPath !== canonicalPath?.toLowerCase()
      || canonical !== ORIGIN + (path === '/' ? '' : path)) fail(path, 'invalid canonical (host, path, case or trailing slash)');
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
      .filter((m) => attrs(m[1]).type?.toLowerCase() === 'application/ld+json');
    if (scripts.length !== 1) fail(path, 'expected exactly one JSON-LD script');
    else {
      try {
        const data = JSON.parse(scripts[0][2]);
        if (!data || Array.isArray(data) || !Array.isArray(data['@graph'])
          || Object.keys(data).some((k) => !['@context', '@graph'].includes(k))) fail(path, 'expected single @graph');
        function inspect(value, root = false) {
          if (!value || typeof value !== 'object') return;
          if (!root && '@graph' in value) fail(path, 'nested @graph');
          const types = [value['@type']].flat();
          if (types.some((t) => typeof t === 'string' && /(?:^|[/#])(SearchAction|HowTo)$/.test(t))) fail(path, 'forbidden JSON-LD type');
          Object.values(value).forEach((v) => inspect(v));
        }
        inspect(data, true);
      } catch { fail(path, 'invalid JSON-LD JSON'); }
    }
    const alternates = links.filter((a) => a.hreflang);
    if (alternates.length) {
      const pl = alternates.find((a) => a.hreflang === 'pl');
      const en = alternates.find((a) => a.hreflang === 'en');
      if (!pl || !en || !pages.has(local(pl.href)) || !pages.has(local(en.href))
        || !(local(en.href) === '/en' || local(en.href)?.startsWith('/en/')) || local(pl.href)?.startsWith('/en/')) fail(path, 'hreflang requires existing PL and EN pages');
      for (const a of alternates) if (!pages.has(local(a.href))) fail(path, 'hreflang target missing');
    }
  }
  const sitemaps = [...files.keys()].filter((f) => /(^|\/)sitemap[^/]*\.xml$/.test(f));
  if (!sitemaps.includes('sitemap.xml')) fail('sitemap.xml', 'missing sitemap');
  for (const file of sitemaps) {
    for (const m of readFileSync(files.get(file), 'utf8').matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)) {
      const path = local(decode(m[1].trim()));
      if (!path || !(pages.has(path) || files.has(path.slice(1)))) fail(file, `sitemap loc missing from dist: ${m[1]}`);
    }
  }
  const robots = files.has('robots.txt') ? readFileSync(files.get('robots.txt'), 'utf8') : '';
  if (!/^Sitemap:\s*https:\/\/www\.zawlodzki\.pl\/sitemap\.xml\s*$/mi.test(robots)) fail('robots.txt', 'must name sitemap');
  // Only /, /blog and /404 have unconditional Astro routes. All other keep
  // URLs are rendered from published Sanity documents, regardless of page_type.
  for (const row of csv(readFileSync(urlMap, 'utf8'))) {
    if (row.action !== 'keep' || pages.has(row.new_path_pl)) continue;
    if (['/', '/blog', '/404'].includes(row.new_path_pl)) fail(row.new_path_pl, 'static keep route missing');
    else reports.push(`Unpublished-content keep route absent: ${row.new_path_pl}`);
  }
  for (const [file, full] of files) {
    for (const ext of ['css', 'js']) if (file.endsWith('.' + ext)) sizes[ext] += gzipSync(readFileSync(full)).length;
  }
  for (const ext of ['css', 'js']) if (sizes[ext] > budgets[ext]) fail(ext, `gzip budget exceeded: ${sizes[ext]} > ${budgets[ext]} bytes`);
  if (!pages.size) fail(dist, 'no HTML pages');
  return { errors, reports, sizes, pages: pages.size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = checkDist(resolve(process.argv[2] || join(ROOT, 'apps/web/dist')));
    for (const report of result.reports) console.log(report);
    console.log(`Checked ${result.pages} HTML pages; gzip CSS ${result.sizes.css}/${BUDGETS.css} B; JS ${result.sizes.js}/${BUDGETS.js} B`);
    for (const error of result.errors) console.error(error);
    console.log(result.errors.length ? `FAIL: ${result.errors.length} violation(s)` : 'PASS');
    process.exitCode = result.errors.length ? 1 : 0;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
