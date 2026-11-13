import { chromium } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { writeFile } from 'node:fs/promises';
const phase = process.argv[2] ?? 'new';
const browser = await chromium.launch({ headless: true });
const results = [];
for (const source of phase === 'live' ? ['live'] : ['new']) {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    const url = source === 'live' ? 'https://www.zawlodzki.pl/' : 'http://127.0.0.1:8791/';
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const reject = page.getByRole('button', { name: /Odrzucam/ });
    if (await reject.isVisible()) await reject.click();
    const footer = page.locator('footer').last();
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await footer.screenshot({ style: '.site-header { visibility: hidden !important; }', path: new URL(`review-${source}-${width}.png`, import.meta.url).pathname });
    const metrics = await footer.evaluate(footer => {
      const box = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right }; };
      const links = [...footer.querySelectorAll('a,button')];
      return {
        links: links.map(e => ({ label: e.textContent.trim() || e.getAttribute('aria-label'), href: e.getAttribute('href'), ...box(e) })),
        blog: links.filter(e => e.textContent.trim() === 'Blog').map(e => {
          const range = document.createRange(); range.selectNodeContents(e);
          return { link: box(e), text: box(range), justifyContent: getComputedStyle(e).justifyContent, padding: getComputedStyle(e).padding, margin: getComputedStyle(e).margin };
        }),
        brand: footer.querySelector('.brand') ? box(footer.querySelector('.brand')) : null,
        badge: footer.querySelector('.atlas-link') ? box(footer.querySelector('.atlas-link')) : null,
        row: footer.querySelector('.brand-row') ? box(footer.querySelector('.brand-row')) : null,
        h2: footer.querySelectorAll('h2').length,
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    results.push({ source, width, url, status: response.status(), ...metrics });
    await page.close();
  }
}
await browser.close();
await writeFile(new URL(`review-${phase}-metrics.json`, import.meta.url), JSON.stringify(results, null, 2));
console.log(results.map(r => ({source:r.source,width:r.width,blog:r.blog,badge:r.badge,row:r.row})));
