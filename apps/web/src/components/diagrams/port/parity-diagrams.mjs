#!/usr/bin/env node
// Checks the ported diagrams against the original Webflow embeds. It renders
// every original embed with the live site's Webflow CSS in a local harness,
// renders the ported catalogue page from a running server, and compares the
// box and opacity of every scene element in design-space px. It does this
// twice: with reduced motion (static end state) and after each animation has
// played. Boxes of elements in an endless animation are compared by opacity
// only. It also fails on any script error on the ported page.
//
//   node apps/web/src/components/diagrams/port/parity-diagrams.mjs --origin http://127.0.0.1:8790 [--out dir]

import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { collect } from './embeds.mjs';
import { launch } from './cdp.mjs';

const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined);
const origin = arg('--origin');
if (!origin?.startsWith('http')) {
  console.error('usage: parity-diagrams.mjs --origin <url> [--out dir]');
  process.exit(1);
}
const outDir = arg('--out') ?? mkdtempSync(join(tmpdir(), 'diagram-parity-'));

const here = dirname(fileURLToPath(import.meta.url));
const repo = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
const htmlDir = join(repo, 'migration/00-inventory/live-site/html');
const embeds = collect(htmlDir);

const home = readFileSync(join(htmlDir, 'index.html'), 'utf8');
const webflowCssUrl = home.match(/href="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+\.css)"/)[1];
const webflowCss = await (await fetch(webflowCssUrl)).text();
const harness = join(outDir, 'original.html');
writeFileSync(
  harness,
  `<!doctype html><html lang="pl"><head><meta charset="utf-8"><style>${webflowCss}</style></head><body>
${embeds.map((e) => `<section style="width: 920px; padding: 40px 0">${e.embed}</section>`).join('\n')}
</body></html>`,
);

// Runs in the page. Returns, per key, a map from a structural path to the
// element's box (relative to the scene, unscaled) and opacity.
const snapshot = (rootSelector) => `(() => {
  const out = {};
  for (const e of ${JSON.stringify(embeds.map((e) => e.key))}) {
    const root = document.querySelector(${JSON.stringify(rootSelector)}.replace('KEY', e));
    const scene = root.querySelector('.zw-scene, .cf-lanes');
    const sb = scene.getBoundingClientRect();
    const s = sb.width / scene.offsetWidth;
    const path = (el) => {
      const parts = [];
      for (let n = el; n !== scene; n = n.parentElement) {
        parts.unshift(n.tagName.toLowerCase() + ':' + [...n.parentElement.children].indexOf(n));
      }
      return parts.join('/');
    };
    const els = {};
    for (const el of scene.querySelectorAll('*')) {
      if (el.closest('.zw-confetti, .cf-confetti') || el.getClientRects().length === 0) continue;
      const r = el.getBoundingClientRect();
      const spinning = el.getAnimations().some((a) => a.effect.getTiming().iterations === Infinity);
      let opacity = 1;
      for (let n = el; n && n !== root; n = n.parentElement) opacity *= Number(getComputedStyle(n).opacity);
      els[path(el)] = [(r.left - sb.left) / s, (r.top - sb.top) / s, r.width / s, r.height / s, opacity].map((v) => Math.round(v * 10) / 10).concat(spinning);
    }
    out[e] = { scale: s, height: sb.height / s, els };
  }
  return out;
})()`;

async function render(url, rootSelector, reduced) {
  const page = await launch({ width: 1280, height: 900 });
  const errors = [];
  page.on((msg) => {
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  });
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await page.goto(url);
  await page.eval('document.fonts.ready.then(() => true)');
  if (!reduced) {
    for (const e of embeds) {
      await page.eval(`document.querySelector(${JSON.stringify(rootSelector.replace('KEY', e.key))}).scrollIntoView({ block: 'center' }), new Promise((r) => setTimeout(r, 120))`);
    }
    await page.eval(`new Promise((resolve) => {
      let quiet = 0;
      const tick = setInterval(() => {
        const running = document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations !== Infinity).length;
        quiet = running ? 0 : quiet + 1;
        if (quiet >= 30) { clearInterval(tick); resolve(true); }
      }, 100);
      setTimeout(() => { clearInterval(tick); resolve(false); }, 60000);
    })`);
  }
  const snap = await page.eval(snapshot(rootSelector));
  await page.close();
  return { snap, errors };
}

const TOL_PX = 1;
const TOL_OPACITY = 0.05;
let failures = 0;
const report = [];
for (const reduced of [true, false]) {
  const mode = reduced ? 'reduced-motion' : 'played';
  const original = await render(pathToFileURL(harness).href, '#KEY', reduced);
  const ported = await render(`${origin}/_ds/diagrams`, '.ds-slot--wide [data-diagram="KEY"]', reduced);
  for (const [label, r] of [['original', original], ['ported', ported]]) {
    for (const err of r.errors) report.push(`${mode}\t${label}\tSCRIPT-ERROR\t${err.split('\n')[0]}`);
    if (label === 'ported') failures += r.errors.length;
  }
  for (const { key } of embeds) {
    const a = original.snap[key];
    const b = ported.snap[key];
    const diffs = [];
    if (Math.abs(a.height - b.height) > TOL_PX) diffs.push(`scene height ${a.height.toFixed(1)} -> ${b.height.toFixed(1)}`);
    for (const p of new Set([...Object.keys(a.els), ...Object.keys(b.els)])) {
      const x = a.els[p];
      const y = b.els[p];
      if (!x || !y) {
        diffs.push(`${p} only in ${x ? 'original' : 'ported'}`);
        continue;
      }
      const geo = !x[5] && !y[5] && x.slice(0, 4).some((v, i) => Math.abs(v - y[i]) > TOL_PX);
      if (geo || Math.abs(x[4] - y[4]) > TOL_OPACITY) diffs.push(`${p} [${x}] -> [${y}]`);
    }
    report.push(`${mode}\t${key}\t${diffs.length ? 'DIFF' : 'ok'}\t${Object.keys(b.els).length} elements${diffs.length ? `\t${diffs.slice(0, 4).join(' | ')}${diffs.length > 4 ? ` | +${diffs.length - 4} more` : ''}` : ''}`);
    if (diffs.length) failures++;
  }
}

writeFileSync(join(outDir, 'parity.tsv'), report.join('\n') + '\n');
console.log(report.join('\n'));
console.log(`\n${failures ? `${failures} failure(s)` : 'all diagrams match'}; report in ${join(outDir, 'parity.tsv')}`);
process.exit(failures ? 1 : 0);
