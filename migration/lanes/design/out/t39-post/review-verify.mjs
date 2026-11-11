import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const origin = process.env.VERIFY_ORIGIN || 'http://127.0.0.1:8790';
const out = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox'] });
const results = [];
try {
  for (const slug of ['asana-vs-jira', 'asana-cennik']) for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    assert.equal((await page.goto(`${origin}/blog/${slug}`)).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    const reject = page.getByRole('button', { name: 'Odrzucam opcjonalne', exact: true });
    if (await reject.count()) await reject.first().click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const trigger = page.getByRole('button', { name: 'Udostępnij', exact: true });
    assert.equal(await trigger.locator('svg[aria-hidden="true"]').count(), 1);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.screenshot({ path: `${out}review-${slug}-share-icon-${width}.png` });
    await page.keyboard.press('Enter');
    assert(await page.locator('#share-options').evaluate(el => el.matches(':popover-open')));
    await page.keyboard.press('Escape');
    const targets = await page.locator('[data-post-toc] a').evaluateAll(links => links.map(link => {
      const id = decodeURIComponent(link.hash.slice(1));
      const heading = document.getElementById(id);
      return { id, tag: heading?.tagName, text: link.textContent, nested: !!link.closest('ol ol') };
    }));
    assert(targets.length > 0);
    assert.equal(new Set(targets.map(t => t.id)).size, targets.length);
    for (const target of targets) {
      assert(['H2', 'H3'].includes(target.tag), 'anchor is on the actual heading');
      assert(target.id.startsWith('post-'));
      if (target.tag === 'H3') assert(target.nested, 'h3 is nested below h2');
    }
    if (slug === 'asana-cennik') assert(targets.some(t => t.tag === 'H3'));
    const target = slug === 'asana-cennik' ? targets.find(t => t.tag === 'H3') : targets[Math.floor(targets.length / 2)];
    await page.locator(`[id="${target.id}"]`).evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - 112));
    await page.waitForFunction(id => document.querySelector(`[data-post-toc] a[aria-current="location"]`)?.getAttribute('href') === `#${id}`, target.id);
    assert.equal(await page.locator('[data-post-toc] [aria-current="location"]').count(), 1);
    await page.screenshot({ path: `${out}review-${slug}-active-${width}.png` });
    await page.locator('[data-post-heading]').first().evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - 112));
    await page.waitForFunction(id => document.querySelector('[data-post-toc] [aria-current="location"]')?.getAttribute('href') === `#${id}`, targets[0].id);
    await page.locator('.author-section').evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - 110));
    await page.locator('.avatar').evaluate(async img => { if (!img.complete) await new Promise(resolve => img.addEventListener('load', resolve, { once: true })); });
    const avatar = await page.locator('.avatar').evaluate(el => {
      const css = getComputedStyle(el);
      return { width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, fit: css.objectFit, radius: css.borderRadius, position: css.objectPosition };
    });
    assert.equal(avatar.width, 80); assert.equal(avatar.height, 80); assert.equal(avatar.fit, 'cover');
    assert(parseFloat(avatar.radius) >= 40);
    await page.screenshot({ path: `${out}review-${slug}-avatar-${width}.png` });
    results.push({ slug, width, headings: targets, activeTarget: target.id, activeCount: 1, reverseScrollPassed: true, avatar, icon: true, overflow: false });
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${origin}/blog/asana-cennik`);
  assert(await page.locator('[data-post-toc] ol ol a').count() > 0);
  const href = await page.locator('[data-post-toc] ol ol a').first().getAttribute('href');
  assert.equal(await page.locator(href).count(), 1);
  await context.close();
  await writeFile(`${out}review-verification.json`, JSON.stringify({ origin, results, noJavaScriptNestedLinks: true }, null, 2));
  console.log('Review proof passed for two posts at desktop/mobile, including nested h3, scrollspy both directions and no-JS anchors.');
} finally { await browser.close(); }
