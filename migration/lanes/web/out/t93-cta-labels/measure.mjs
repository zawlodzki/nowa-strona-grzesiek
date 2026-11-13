#!/usr/bin/env node
// Usage: node measure.mjs --origin http://127.0.0.1:8790 --out <dir> [--posts 3]
// Counts rendered lines of every CTA label on every sitemap page at 390/768/1024/1440 px.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../../../../apps/web/package.json'));
const { chromium } = require('@playwright/test');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, a) => (v.startsWith('--') ? [...acc, [v.slice(2), a[i + 1]]] : acc), []));
const origin = (args.origin ?? 'http://127.0.0.1:8790').replace(/\/$/, '');
const out = args.out ?? here;
const postCount = Number(args.posts ?? 3);
const viewports = [390, 768, 1024, 1440];

async function sitemapPaths(name) {
  const xml = await (await fetch(`${origin}/${name}`)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

const all = await sitemapPaths('sitemap-pl.xml');
const posts = all.filter((p) => p.startsWith('/blog/'));
const paths = [...new Set([...all.filter((p) => !p.startsWith('/blog/')), '/blog', ...posts.slice(0, postCount)])];

const browser = await chromium.launch(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : { channel: 'chrome' });
const rows = [];
for (const width of viewports) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const path of paths) {
    const res = await page.goto(origin + path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const found = await page.evaluate(() => {
      const sel = 'a.action:not(.text), .pricing .action > a.cta, form button[type="submit"], .pill-link';
      return [...document.querySelectorAll(sel)].filter((el) => el.offsetParent || el.getClientRects().length).map((el) => {
        const labelEl = el.matches('a.action') ? el.querySelector('span') ?? el : el;
        const range = document.createRange();
        range.selectNodeContents(labelEl);
        const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top)));
        const section = el.closest('section.section');
        const context = el.matches('.pill-link') ? 'header' : el.matches('button') ? 'form-submit' : section?.classList[2] ?? 'other';
        return { label: labelEl.textContent.trim().replace(/\s+/g, ' '), context, buttonWidth: Math.round(el.getBoundingClientRect().width), lines: tops.size };
      });
    });
    for (const f of found) rows.push({ path, status: res.status(), width, ...f, chars: [...f.label].length });
  }
  await page.close();
}
await browser.close();

mkdirSync(out, { recursive: true });
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
const cols = ['path', 'status', 'width', 'context', 'label', 'chars', 'buttonWidth', 'lines'];
writeFileSync(join(out, 'measurements.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');

const budget = {};
for (const r of rows) {
  const b = (budget[r.context] ??= {});
  const v = (b[r.width] ??= { longestOneLine: 0, shortestWrapped: null, minButtonWidth: Infinity });
  v.minButtonWidth = Math.min(v.minButtonWidth, r.buttonWidth);
  if (r.lines <= 1) v.longestOneLine = Math.max(v.longestOneLine, r.chars);
  else v.shortestWrapped = Math.min(v.shortestWrapped ?? Infinity, r.chars);
}
const wrapped = rows.filter((r) => r.lines > 1);
const summary = { origin, measuredAt: new Date().toISOString(), pages: paths.length, buttonsPerViewport: Object.fromEntries(viewports.map((w) => [w, rows.filter((r) => r.width === w).length])), wrappedInstances: wrapped.length, wrappedLabels: [...new Set(wrapped.map((r) => r.label))].length, budget };
writeFileSync(join(out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ ...summary, budget: undefined }, null, 2));
for (const r of wrapped) console.log([r.width, r.context, r.buttonWidth, r.chars, r.lines, r.path, r.label].join('\t'));
