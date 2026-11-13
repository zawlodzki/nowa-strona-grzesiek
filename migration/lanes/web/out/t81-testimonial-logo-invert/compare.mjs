import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const [, , webDir, out] = process.argv;
const { chromium } = createRequire(`${webDir}/package.json`)('@playwright/test');
const PATH = '/szkolenie-i-wdrozenie-asana';
const ORIGINS = { production: 'https://www.zawlodzki.pl', branch: 'http://127.0.0.1:8790' };
const SECTIONS = { testimonials: 'section.testimonials', 'logo-strip': 'section.logo-strip' };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const shots = {};
for (const [name, origin] of Object.entries(ORIGINS)) {
  await page.goto(origin + PATH, { waitUntil: 'networkidle' });
  const reject = page.getByTestId('consent-banner-reject-button');
  if (await reject.isVisible().catch(() => false)) await reject.click();
  const filter = await page.locator('section.testimonials img.logo').evaluateAll((imgs) => imgs.map((img) => `${img.className} -> ${getComputedStyle(img).filter}`));
  console.log(name, 'testimonial logos:', JSON.stringify(filter));
  for (const [section, selector] of Object.entries(SECTIONS)) {
    const el = page.locator(selector).first();
    await el.scrollIntoViewIfNeeded();
    await el.evaluate((node) => Promise.all([...node.querySelectorAll('img')].map((img) => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
    const file = `${out}/${section}-${name}.png`;
    await el.screenshot({ path: file });
    (shots[section] ??= {})[name] = file;
  }
}
for (const [section, pair] of Object.entries(shots)) {
  const img = (label, file) => `<figure><figcaption>${label}</figcaption><img src="data:image/png;base64,${readFileSync(file).toString('base64')}"></figure>`;
  await page.setContent(`<style>body{margin:0;display:grid;gap:24px;justify-content:start;padding:16px;background:#fff;font:600 18px system-ui}figure{margin:0}img{display:block;max-width:1280px;border:1px solid #ccc}</style>${img(`production ${ORIGINS.production}${PATH}`, pair.production)}${img(`branch task/T81 (wrangler dev --local :8790)`, pair.branch)}`);
  await page.waitForLoadState('load');
  await page.locator('body').screenshot({ path: `${out}/compare-${section}.png` });
}
await browser.close();
console.log('wrote', out);
