#!/usr/bin/env node
// Checks the catalogue page at phone and desktop widths: every diagram
// instance reserves exactly its scaled scene height and fits its slot, and
// scrolling through the page while all diagrams play shifts no layout.
//
//   node apps/web/src/components/diagrams/port/layout-diagrams.mjs --origin http://127.0.0.1:8790

import { launch } from './cdp.mjs';

const origin = process.argv[process.argv.indexOf('--origin') + 1];
if (!origin?.startsWith('http')) {
  console.error('usage: layout-diagrams.mjs --origin <url>');
  process.exit(1);
}

let failed = false;
for (const width of [375, 1280]) {
  const page = await launch({ width, height: 800 });
  await page.goto(`${origin}/_ds/diagrams`);
  const result = await page.eval(`(async () => {
    let cls = 0;
    const shifts = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.hadRecentInput) continue;
        cls += e.value;
        shifts.push(e.sources.map((s) => s.node?.closest?.('[data-diagram]')?.dataset.diagram ?? s.node?.nodeName).join(','));
      }
    }).observe({ type: 'layout-shift', buffered: true });

    await document.fonts.ready;
    const bad = [];
    const roots = [...document.querySelectorAll('[data-diagram]')];
    for (const root of roots) {
      const stage = root.querySelector('.dg-stage');
      const fit = root.querySelector('.dg-fit');
      const scene = fit.firstElementChild.getBoundingClientRect();
      const stageBox = stage.getBoundingClientRect();
      const reserved = parseFloat(getComputedStyle(fit).blockSize);
      if (Math.abs(reserved - scene.height) > 0.5) bad.push(root.dataset.diagram + ' reserves ' + reserved.toFixed(2) + ' for ' + scene.height.toFixed(2));
      if (scene.left < stageBox.left - 0.5 || scene.right > stageBox.right + 0.5) bad.push(root.dataset.diagram + ' overflows its slot');
    }
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    await new Promise((r) => setTimeout(r, 8000));
    return { instances: roots.length, cls, shifts, bad };
  })()`);
  await page.close();
  const ok = result.cls === 0 && result.bad.length === 0;
  failed ||= !ok;
  console.log(`width ${width}: ${result.instances} instances, CLS ${result.cls}, ${result.bad.length} sizing problem(s)`);
  for (const b of result.bad) console.log(`  ${b}`);
  for (const s of result.shifts) console.log(`  shift: ${s}`);
}
process.exit(failed ? 1 : 0);
