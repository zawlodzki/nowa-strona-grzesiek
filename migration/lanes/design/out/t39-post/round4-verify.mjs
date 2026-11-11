import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const require = createRequire(new URL('../../../../../apps/web/package.json', import.meta.url));
const sharp = createRequire(require.resolve('astro'))('sharp');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const origin = process.env.VERIFY_ORIGIN || 'http://127.0.0.1:8790';
const out = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox'] });
const results = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const reference = await context.newPage();
    await reference.goto('https://aleksandraolesiewicz.com/blog/pcos-co-to-za-choroba/');
    await reference.evaluate(() => document.fonts.ready);
    const referenceReject = reference.getByRole('button', { name: 'Odrzucam opcjonalne', exact: true });
    try { await referenceReject.waitFor({ state: 'visible', timeout: 5000 }); await referenceReject.click(); await referenceReject.waitFor({ state: 'hidden' }); } catch {}
    await reference.getByRole('button', { name: 'Udostępnij', exact: true }).click();
    await reference.locator('#share-options').waitFor({ state: 'visible' });
    const referenceImage = await reference.screenshot({ path: `${out}round4-reference-${width}.png` });
    const page = await context.newPage();
    assert.equal((await page.goto(`${origin}/blog/asana-vs-jira`)).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    const reject = page.getByRole('button', { name: 'Odrzucam opcjonalne', exact: true });
    if (await reject.count()) await reject.click();
    const trigger = page.getByRole('button', { name: 'Udostępnij', exact: true });
    await trigger.scrollIntoViewIfNeeded();
    const centered = await page.locator('.share').evaluate(el => {
      const button = el.querySelector('button').getBoundingClientRect(), column = el.closest('.toc-column').getBoundingClientRect();
      return button.left + button.width / 2 - column.left - column.width / 2;
    });
    assert(Math.abs(centered) < 1);
    await trigger.focus(); await page.keyboard.press('Enter');
    const panel = page.locator('#share-options');
    assert(await panel.evaluate(el => el.matches(':popover-open')));
    const menu = await panel.boundingBox();
    assert(menu.x >= 0 && menu.y >= 0 && menu.x + menu.width <= width && menu.y + menu.height <= 900, 'menu stays within viewport');
    const tiles = await panel.locator('.share-tile').evaluateAll(els => els.map(el => {
      const rect = el.getBoundingClientRect();
      return { label: el.textContent, width: rect.width, height: rect.height, icons: el.querySelectorAll('svg[aria-hidden="true"]').length, href: el.getAttribute('href') };
    }));
    assert.deepEqual(tiles.map(tile => tile.label), ['X', 'LinkedIn', 'Facebook', 'Email', 'WhatsApp', 'Kopiuj link']);
    for (const tile of tiles) { assert(Math.abs(tile.width - tiles[0].width) < 1); assert.equal(tile.height, tiles[0].height); assert(tile.height >= 44); assert.equal(tile.icons, 1); }
    const localImage = await page.screenshot({ path: `${out}round4-new-${width}.png` });
    await sharp({ create: { width: width * 2, height: 900, channels: 3, background: 'white' } }).composite([{ input: referenceImage, left: 0, top: 0 }, { input: localImage, left: width, top: 0 }]).png().toFile(`${out}round4-compare-${width}.png`);
    await page.keyboard.press('Tab');
    assert(await panel.evaluate(el => el.contains(document.activeElement)));
    await panel.getByRole('button', { name: 'Kopiuj link', exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'https://www.zawlodzki.pl/blog/asana-vs-jira');
    assert.equal(await panel.locator('[role="status"]').textContent(), 'Link skopiowany.');
    const successMenu = await panel.boundingBox();
    assert(successMenu.x >= 0 && successMenu.y >= 0 && successMenu.x + successMenu.width <= width && successMenu.y + successMenu.height <= 900, 'copy success also fits viewport');
    await page.keyboard.press('Escape');
    assert.equal(await panel.evaluate(el => el.matches(':popover-open')), false);
    assert(await trigger.evaluate(el => document.activeElement === el));
    await trigger.click();
    await panel.getByRole('button', { name: 'Zamknij', exact: true }).click();
    assert.equal(await panel.evaluate(el => el.matches(':popover-open')), false);
    assert(await trigger.evaluate(el => document.activeElement === el));
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied for fallback check'); } } }); });
    await trigger.click();
    await panel.getByRole('button', { name: 'Kopiuj link', exact: true }).click();
    assert(await panel.locator('.manual').isVisible());
    assert(await panel.locator('.manual input').evaluate(el => document.activeElement === el && el.selectionEnd === el.value.length));
    await page.screenshot({ path: `${out}round4-fallback-${width}.png` });
    const fallbackMenu = await panel.boundingBox();
    assert(fallbackMenu.x >= 0 && fallbackMenu.y >= 0 && fallbackMenu.x + fallbackMenu.width <= width && fallbackMenu.y + fallbackMenu.height <= 900, 'copy fallback also fits viewport');
    await page.keyboard.press('Escape');
    results.push({ width, centered, menu, tiles, keyboardAndFocus: true, clipboard: true, manualCopyFallback: true, fallbackMenu });
    await context.close();
  }
  await writeFile(`${out}round4-verification.json`, JSON.stringify(results, null, 2));
  console.log('Round 4 proof passed at 1440 and 390: six equal icon tiles, centered trigger, viewport containment, keyboard/focus, copy and manual fallback.');
} finally { await browser.close(); }
