// PR #50 follow-up proof. Run against verify-web's healthy local Worker on 8790.
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
const out = new URL('./', import.meta.url).pathname;
const report = [];
try {
  for (const width of [1280, 375]) {
    for (const source of ['live', 'local']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'no-preference' });
      await page.goto(source === 'live' ? 'https://zawlodzki.pl/' : 'http://127.0.0.1:8790/', { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
        await Promise.all(Array.from(document.images).filter(e => e.getBoundingClientRect().width > 0).map(e => e.decode().catch(() => {})));
        window.scrollTo(0, 0);
      });
      const newsletter = page.locator(source === 'live' ? '.cta-section:has(.div-block)' : 'section.newsletter').last();
      const footer = page.locator('footer');
      const row = newsletter.locator(source === 'live' ? '.div-block' : 'form');
      const controlMetrics = await row.evaluate(row => {
        const input = row.querySelector('[type=email]'), button = row.querySelector('[type=submit]');
        const measure = element => { const r = element.getBoundingClientRect(), s = getComputedStyle(element); return { width: r.width, height: r.height, centerY: r.y + r.height / 2, x: r.x, y: r.y, padding: s.padding, fontSize: s.fontSize, lineHeight: s.lineHeight, border: s.border }; };
        return { input: measure(input), button: measure(button), rowDisplay: getComputedStyle(row).display, rowGap: getComputedStyle(row).columnGap };
      });
      if (source === 'local' && (Math.abs(controlMetrics.input.height - controlMetrics.button.height) > .1 || Math.abs(controlMetrics.input.centerY - controlMetrics.button.centerY) > .1)) throw new Error('Newsletter control alignment failed');
      const typography = await footer.evaluate((footer, source) => {
        const selectors = source === 'live' ? { link: '.vertical-menu-link', title: '.vertical-menu-title', legal: '.nav-link' } : { link: '.columns .footer-link', title: '.column-title', legal: '.legal .footer-link' };
        return Object.fromEntries(Object.entries(selectors).map(([name, selector]) => { const s = getComputedStyle(footer.querySelector(selector)); const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1; const ctx = canvas.getContext('2d'); ctx.fillStyle = s.color; ctx.fillRect(0, 0, 1, 1); const rgb = Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3); return [name, { fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, color: `rgb(${rgb.join(', ')})`, colorCSS: s.color, fontFamily: s.fontFamily }]; }));
      }, source);
      await crop(page, newsletter, `${source}-review-newsletter-w${width}.png`);
      await crop(page, row, `${source}-review-newsletter-row-w${width}.png`);
      await crop(page, footer, `${source}-review-footer-w${width}.png`);
      const badge = footer.locator('.sas-beam');
      const selectors = source === 'live' ? { ring: '.sas-beam__ring', ink: '.sas-beam__ring > i', glow: '.sas-beam__glow' } : { ring: '.ring', ink: '.ring > i', glow: '.glow' };
      const animation = await animations(badge, selectors);
      if (width === 1280) {
        // Seek/pause the browser's native CSS animations at exact timeline times.
        // This avoids network/screenshot latency changing the compared phases.
        for (const seconds of [0, 3, 6]) {
          await badge.evaluate((badge, seconds) => { for (const animation of badge.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = seconds * 1000; } }, seconds);
          await page.evaluate(() => new Promise(requestAnimationFrame));
          await crop(page, badge, `${source}-review-badge-t${seconds}.png`, 8);
        }
      }
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.evaluate(() => new Promise(requestAnimationFrame));
      const reduced = await animations(badge, selectors);
      if (reduced.ring.animationName !== 'none' || reduced.ink.animationName !== 'none' || reduced.activeAnimations !== 0) throw new Error('Reduced-motion badge still animates');
      await crop(page, badge, `${source}-review-badge-reduced-w${width}.png`, 8);
      report.push({ source, width, controls: controlMetrics, typography, badge: { animation, reduced }, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) });
      await page.close();
    }
    for (const name of ['newsletter', 'newsletter-row', 'footer']) await compare(name, width);
  }
  for (const route of ['/newsletter', '/kontakt', '/blog/bezpieczne-przekazanie-danych']) {
    for (const width of [1280, 375]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.goto(`http://127.0.0.1:8790${route}`);
      const form = page.locator('section.newsletter form');
      await form.scrollIntoViewIfNeeded();
      const geometry = await form.evaluate(form => { const a = form.querySelector('[type=email]').getBoundingClientRect(), b = form.querySelector('[type=submit]').getBoundingClientRect(); return { inputHeight: a.height, buttonHeight: b.height, centerDifference: Math.abs(a.y + a.height / 2 - b.y - b.height / 2), scrollWidth: document.documentElement.scrollWidth }; });
      if (geometry.centerDifference > .1 || geometry.inputHeight !== geometry.buttonHeight || geometry.scrollWidth !== width) throw new Error('Shared newsletter regression');
      report.push({ source: 'local', route, width, geometry });
      await page.close();
    }
  }
  for (const width of [1280, 375]) {
    const live = report.find(x => x.source === 'live' && x.width === width && x.typography);
    const local = report.find(x => x.source === 'local' && x.width === width && x.typography);
    for (const role of ['link', 'title', 'legal']) for (const key of ['fontSize', 'fontWeight', 'lineHeight', 'color']) if (live.typography[role][key] !== local.typography[role][key]) throw new Error(`Footer ${role} ${key}: ${live.typography[role][key]} vs ${local.typography[role][key]}`);
  }
  await fs.writeFile(`${out}/review-computed.json`, JSON.stringify(report, null, 2) + '\n');
} finally { await browser.close(); }
async function crop(page, element, file, pad = 0) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await element.boundingBox();
  await page.screenshot({ path: `${out}/${file}`, fullPage: true, clip: { x: Math.max(0, box.x - pad), y: box.y - pad, width: Math.min(box.width + pad * 2, page.viewportSize().width), height: box.height + pad * 2 }, captureBeyondViewport: true });
}
async function animations(badge, selectors) {
  return badge.evaluate((badge, selectors) => {
    const read = selector => { const s = getComputedStyle(badge.querySelector(selector)); return { animationName: s.animationName, animationDuration: s.animationDuration, animationIterationCount: s.animationIterationCount, animationTimingFunction: s.animationTimingFunction, transform: s.transform, opacity: s.opacity, filter: s.filter }; };
    return { ring: read(selectors.ring), ink: read(selectors.ink), glow: read(selectors.glow), activeAnimations: badge.getAnimations({ subtree: true }).length, width: badge.getBoundingClientRect().width, height: badge.getBoundingClientRect().height };
  }, selectors);
}
async function compare(name, width) {
  const page = await browser.newPage({ viewport: { width: width * 2, height: 900 } });
  const images = await Promise.all(['live', 'local'].map(async source => `data:image/png;base64,${(await fs.readFile(`${out}/${source}-review-${name}-w${width}.png`)).toString('base64')}`));
  await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;font:16px system-ui;background:white}figure{margin:0}figcaption{padding:12px;background:#eee}img{display:block;max-width:100%;height:auto;margin:auto}</style>${images.map((image,i)=>`<figure><figcaption>${i ? 'Local Worker' : 'Live Webflow'} — ${name} — ${width}px</figcaption><img src="${image}"></figure>`).join('')}`);
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  const height = await page.locator('figure').evaluateAll(figures => Math.ceil(Math.max(...figures.map(figure => figure.querySelector('figcaption').getBoundingClientRect().height + figure.querySelector('img').getBoundingClientRect().height))));
  await page.screenshot({ path: `${out}/compare-review-${name}-w${width}.png`, clip: { x: 0, y: 0, width: width * 2, height }, fullPage: true }); await page.close();
}
