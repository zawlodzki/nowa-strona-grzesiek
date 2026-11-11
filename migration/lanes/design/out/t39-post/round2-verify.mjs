import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const origin = process.env.VERIFY_ORIGIN || 'http://127.0.0.1:8790';
const out = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN, args: ['--no-sandbox'] });
const results = [];
try {
  for (const slug of ['asana-vs-jira', 'asana-cennik']) for (const width of [1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    assert.equal((await page.goto(`${origin}/blog/${slug}`)).status(), 200);
    await page.evaluate(() => document.fonts.ready);
    const reject = page.getByRole('button', { name: 'Odrzucam opcjonalne', exact: true });
    if (await reject.count()) await reject.first().click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const trigger = page.getByRole('button', { name: 'Udostępnij', exact: true });
    assert.equal(await trigger.locator('svg[aria-hidden="true"]').count(), 1);
    const buttonStyle = await trigger.evaluate(el => {
      const css = getComputedStyle(el);
      return { radius: css.borderRadius, paddingInline: css.paddingInline, paddingBlock: css.paddingBlock };
    });
    assert.equal(buttonStyle.radius, '999px');
    assert.equal(buttonStyle.paddingInline, '24px');
    assert.equal(buttonStyle.paddingBlock, '8px');
    await trigger.scrollIntoViewIfNeeded();
    await trigger.focus();
    await page.screenshot({ path: `${out}round2-${slug}-share-icon-${width}.png` });
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
    const indicator = await page.locator('[data-post-toc] [aria-current="location"]').evaluate(el => {
      const label = getComputedStyle(el), segment = getComputedStyle(el, '::before');
      const list = el.closest('nav').querySelector(':scope > ol');
      const track = getComputedStyle(list, '::before');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = segment.backgroundColor; ctx.fillRect(0, 0, 1, 1);
      return { background: label.backgroundColor, decoration: label.textDecorationLine,
        segmentWidth: segment.width, segmentColor: [...ctx.getImageData(0, 0, 1, 1).data],
        segmentOffset: el.getBoundingClientRect().left + parseFloat(segment.left) - list.getBoundingClientRect().left,
        trackWidth: track.width, transition: segment.transitionDuration };
    });
    assert.equal(indicator.background, 'rgba(0, 0, 0, 0)');
    assert.equal(indicator.decoration, 'none');
    assert.equal(indicator.segmentWidth, '2px');
    assert.equal(indicator.trackWidth, '1px');
    assert(Math.abs(indicator.segmentOffset) < 1, 'active segment aligns with outer track including nested h3');
    const expected = [58, 72, 204, 255];
    indicator.segmentColor.forEach((value, index) => assert(Math.abs(value - expected[index]) <= 1, 'accent is #3a48cc'));
    assert.equal(indicator.transition, '0s');
    await page.screenshot({ path: `${out}round2-${slug}-active-${width}.png` });
    await page.locator('[data-post-heading]').first().evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - 112));
    await page.waitForFunction(id => document.querySelector('[data-post-toc] [aria-current="location"]')?.getAttribute('href') === `#${id}`, targets[0].id);
    await page.locator('.author-section').evaluate(el => scrollTo(0, scrollY + el.getBoundingClientRect().top - 110));
    await page.locator('.avatar').evaluate(async img => { if (!img.complete) await new Promise(resolve => img.addEventListener('load', resolve, { once: true })); });
    const avatar = await page.locator('.avatar').evaluate(el => {
      const css = getComputedStyle(el);
      return { width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, fit: css.objectFit, radius: css.borderRadius, position: css.objectPosition, headroom: css.paddingBlockStart };
    });
    assert.equal(avatar.width, 80); assert.equal(avatar.height, 80); assert.equal(avatar.fit, 'cover');
    assert(parseFloat(avatar.radius) >= 40);
    assert.equal(avatar.position, '50% 0%'); assert.equal(avatar.headroom, '8px');
    await page.screenshot({ path: `${out}round2-${slug}-avatar-${width}.png` });
    results.push({ slug, width, headings: targets, activeTarget: target.id, activeCount: 1, indicator, buttonStyle, reverseScrollPassed: true, avatar, icon: true, overflow: false });
    await context.close();
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${origin}/blog/asana-cennik`);
  assert(await page.locator('[data-post-toc] ol ol a').count() > 0);
  const href = await page.locator('[data-post-toc] ol ol a').first().getAttribute('href');
  assert.equal(await page.locator(href).count(), 1);
  await context.close();
  await writeFile(`${out}round2-verification.json`, JSON.stringify({ origin, results, noJavaScriptNestedLinks: true }, null, 2));
  console.log('Round 2 proof passed for both posts at 1440: aligned accent track segments, no label fill, reduced motion, pill share button and avatar headroom.');
} finally { await browser.close(); }
