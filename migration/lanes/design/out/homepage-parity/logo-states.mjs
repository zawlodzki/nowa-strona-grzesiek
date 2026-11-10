import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
const out = new URL('./', import.meta.url).pathname;
const results = [];
try {
for (const route of ['/', '/automatyzacje-dla-pipedrive']) {
 for (const width of [1280, 375]) {
  const page = await b.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:8790${route}`, { waitUntil: 'domcontentloaded' });
  const strips = page.locator('.logo-grid');
  for (let i = 0; i < await strips.count(); i++) {
    const strip = strips.nth(i); await strip.scrollIntoViewIfNeeded();
    await strip.evaluate(async (strip) => { await document.fonts.ready; await Promise.all(Array.from(strip.querySelectorAll('img')).map((img) => img.decode().catch(() => {}))); });
    const slug = `${route === '/' ? 'home' : 'automatyzacje'}-strip-${i}-w${width}`;
    await strip.screenshot({ path: `${out}/${slug}-default.png` });
    const record = { route, width, strip: i, tools: await strip.evaluate((e) => e.classList.contains('tools')), default: await styles(strip) };
    if (width === 1280) {
      const cdp = await page.context().newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: `.logo-grid >> li`.replace(' >> ', ' ') });
      for (const nodeId of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['hover'] });
      await strip.screenshot({ path: `${out}/${slug}-hover.png` }); record.hover = await styles(strip);
      for (const nodeId of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      const target = strip.locator('a, li[tabindex]').first(); await page.keyboard.press('Tab'); await target.focus();
      await strip.screenshot({ path: `${out}/${slug}-focus.png` });
      record.focus = await target.evaluate((e) => ({ visible: e.matches(':focus-visible'), outline: getComputedStyle(e).outlineStyle, filter: getComputedStyle(e.querySelector('img')).filter, opacity: getComputedStyle(e.querySelector('img')).opacity }));
      if (!record.focus.visible || record.focus.opacity !== '1') throw new Error('Keyboard focus failed');
      record.whiteFocus = [];
      for (const cell of await strip.locator('.difference').all()) {
        await cell.locator('a').count() ? await cell.locator('a').focus() : await cell.focus();
        record.whiteFocus.push(await cell.evaluate((e) => ({ name: e.querySelector('img').alt, filter: getComputedStyle(e.querySelector('img')).filter, opacity: getComputedStyle(e.querySelector('img')).opacity })));
      }
      await cdp.detach();
    }
    results.push(record);
  }
  await page.close();
 }
}
await fs.writeFile(`${out}/logo-states.json`, JSON.stringify(results, null, 2) + '\n');
} finally { await b.close(); }
async function styles(strip) { return strip.locator('img').evaluateAll((images) => images.map((img) => ({ name: img.alt, filter: getComputedStyle(img).filter, opacity: getComputedStyle(img).opacity, width: img.getBoundingClientRect().width, loaded: img.naturalWidth > 0 }))); }
