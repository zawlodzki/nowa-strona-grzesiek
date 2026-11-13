#!/usr/bin/env node
// Usage: node fit-check.mjs --origin http://127.0.0.1:8790 [--proposals proposals.json]
// Swaps each proposed label into the rendered button and counts its lines, before anything is written to Sanity.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../../../../apps/web/package.json'));
const { chromium } = require('@playwright/test');

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, a) => (v.startsWith('--') ? [...acc, [v.slice(2), a[i + 1]]] : acc), []));
const origin = (args.origin ?? 'http://127.0.0.1:8790').replace(/\/$/, '');
const proposals = JSON.parse(readFileSync(args.proposals ?? join(here, 'proposals.json'), 'utf8'));

const browser = await chromium.launch(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : { channel: 'chrome' });
let failures = 0;
for (const width of [390, 768, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  for (const p of proposals) {
    await page.goto(origin + p.path, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const lines = await page.evaluate(({ old, next }) => {
      const span = [...document.querySelectorAll('a.action span')].find((s) => s.textContent.trim() === old);
      if (!span) return -1;
      span.textContent = next;
      const range = document.createRange();
      range.selectNodeContents(span);
      return new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
    }, { old: p.old, next: p.new });
    if (lines !== 1) failures++;
    console.log([width, lines === -1 ? 'MISSING' : lines === 1 ? 'ok' : 'WRAPS', [...p.new].length, p.path, p.new].join('\t'));
  }
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
