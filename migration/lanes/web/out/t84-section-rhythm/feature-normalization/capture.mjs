import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../../../../../../apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const phase = process.argv[2];
const results = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    for (const path of ['/', '/o-mnie']) {
      assert.equal((await page.goto(`http://127.0.0.1:8790${path}`)).status(), 200);
      await page.evaluate(() => document.fonts.ready);
      await page.getByRole('button', { name: 'Odrzucam opcjonalne', exact: true }).click({ timeout: 2000 }).catch(() => {});
      await page.evaluate(() => scrollTo(0, 0));
      const sections = path === '/' ? page.locator('section.feature:is(#crm,#ai,#automatyzacja,#asana)') : page.locator('section.feature').filter({ has: page.getByRole('heading', { name: 'W czym mogę Ci pomóc?', exact: true }) });
      assert.equal(await sections.count(), path === '/' ? 4 : 1);
      for (const section of await sections.all()) {
        const id = await section.getAttribute('id') || 'pomoc';
        await section.screenshot({ path: new URL(`compare-${phase}-${id}-${width}.png`, import.meta.url).pathname, animations: 'disabled' });
        const data = await section.evaluate(el => ({ id: el.id, paragraphs: el.querySelectorAll('.pt > p').length, listItems: el.querySelectorAll('.pt li').length, text: el.querySelector('.pt')?.textContent, breaks: el.querySelectorAll('.pt br').length, gap: el.querySelector('.pt > * + *') ? getComputedStyle(el.querySelector('.pt > * + *')).marginBlockStart : null, overflow: document.documentElement.scrollWidth > innerWidth }));
        assert.equal(data.overflow, false);
        if (phase === 'after') { assert.equal(data.breaks, 0); if (path === '/o-mnie') assert.ok(data.listItems > 0); }
        results.push({ path, width, ...data });
      }
    }
    await page.close();
  }
  await writeFile(new URL(`${phase}.json`, import.meta.url), JSON.stringify(results, null, 2));
} finally { await browser.close(); }
