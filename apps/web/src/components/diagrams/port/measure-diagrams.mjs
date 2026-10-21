#!/usr/bin/env node
// Measures each diagram's scene height at its design width on the running
// catalogue page and writes port/sizes.json for port-diagrams.mjs.
//
//   node apps/web/src/components/diagrams/port/measure-diagrams.mjs --origin http://127.0.0.1:8790

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './cdp.mjs';

const origin = process.argv[process.argv.indexOf('--origin') + 1];
if (!origin?.startsWith('http')) {
  console.error('usage: measure-diagrams.mjs --origin <url>');
  process.exit(1);
}

const page = await launch();
await page.goto(`${origin}/_ds/diagrams`);
const sizes = await page.eval(`(async () => {
  await document.fonts.ready;
  const out = {};
  for (const root of document.querySelectorAll('.ds-slot--wide [data-diagram]')) {
    const scene = root.querySelector('.dg-fit').firstElementChild;
    const box = scene.getBoundingClientRect();
    const h = box.height * (scene.offsetWidth / box.width);
    out[root.dataset.diagram] = { h: Math.round(h * 100) / 100 };
  }
  return out;
})()`);
await page.close();

const sorted = Object.fromEntries(Object.entries(sizes).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'sizes.json'), JSON.stringify(sorted, null, 2) + '\n');
console.log(`measured ${Object.keys(sorted).length} diagrams`);
