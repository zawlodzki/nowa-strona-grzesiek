import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';

const [origin, phase, out] = process.argv.slice(2);
assert(['before', 'after', 'published'].includes(phase), 'Expected before, after, or published');
const plan = JSON.parse(await readFile(new URL('./plan.json', import.meta.url)));
const changes = JSON.parse(await readFile(new URL('./changes.json', import.meta.url)));
const expectedByPath = new Map(changes.map((row) => [row.path, row[phase === 'before' ? 'before' : 'after']]));
await mkdir(out, { recursive: true });
const browser = await chromium.launch(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {});
const results = [];
try {
  for (const width of [390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, serviceWorkers: 'block' });
    const entries = Object.entries(plan.pages);
    for (let i = 0; i < entries.length; i += 4) {
      await Promise.all(entries.slice(i, i + 4).map(async ([path, target]) => {
        const page = await context.newPage();
        try {
          const response = await page.goto(new URL(path, origin).href, { waitUntil: 'domcontentloaded' });
          assert.equal(response.status(), 200, path);
          const hero = page.locator('section').filter({ has: page.locator('.hero-layout') });
          const portrait = hero.locator('.portrait-image img');
          const badge = hero.locator('.image-badge');
          const expected = expectedByPath.get(path);
          const expectBadge = Boolean(expected.badgeImage);
          assert.equal(await badge.count(), Number(expectBadge), path);
          await page.evaluate(() => document.fonts.ready);
          for (const img of [portrait, ...(expectBadge ? [badge] : [])]) {
            await img.evaluate((image) => image.decode());
          }
          const details = await hero.evaluate((section) => {
            const portrait = section.querySelector('.portrait-image img');
            const badge = section.querySelector('.image-badge');
            const sectionBox = section.getBoundingClientRect();
            const portraitBox = portrait.getBoundingClientRect();
            const badgeBox = badge?.getBoundingClientRect();
            const image = (node) => ({
              src: node.getAttribute('src'), alt: node.alt, width: node.getAttribute('width'),
              height: node.getAttribute('height'), loading: node.loading,
            });
            return {
              portrait: image(portrait),
              badge: badge && image(badge),
              badgeWithinHero: !badge || (badgeBox.left >= sectionBox.left && badgeBox.right <= sectionBox.right &&
                badgeBox.top >= sectionBox.top && badgeBox.bottom <= sectionBox.bottom),
              badgeStartsInLowerHalf: !badge || badgeBox.top >= portraitBox.top + portraitBox.height / 2,
              viewport: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
              primaryImage: [...document.querySelectorAll('script[type="application/ld+json"]')]
                .flatMap((script) => JSON.parse(script.textContent)['@graph'] ?? [])
                .find((node) => node.primaryImageOfPage)?.primaryImageOfPage?.url ?? null,
            };
          });
          const assetFile = (ref) => ref.slice('image-'.length).replace(/-([a-z0-9]+)$/, '.$1');
          assert.equal(details.viewport, width, path);
          assert.equal(details.scrollWidth, width, path);
          assert.equal(details.portrait.loading, 'eager', path);
          assert.equal(details.portrait.alt, expected.image.alt, path);
          assert.ok(details.portrait.src.includes(assetFile(expected.image.asset._ref)), path);
          assert.ok(details.primaryImage?.includes(assetFile(expected.image.asset._ref)), path);
          if (expectBadge) {
            assert.equal(details.badge.alt, expected.badgeImage.alt, path);
            assert.ok(Number(details.badge.width) > 0 && Number(details.badge.height) > 0, path);
            assert.ok(details.badgeWithinHero, path);
            assert.ok(details.badgeStartsInLowerHalf, path);
            if (!plan.badges[target.badge]?.localFile || phase === 'published') {
              assert.ok(details.badge.src.includes(assetFile(expected.badgeImage.asset._ref)), path);
            }
          }
          const name = path.slice(1) || 'home';
          if (width !== 768) await hero.screenshot({ path: `${out}/${phase}-${name}-${width}.png`, animations: 'disabled' });
          results.push({ path, width, status: response.status(), ...details });
        } finally {
          await page.close();
        }
      }));
    }
    await context.close();
  }
} finally {
  await browser.close();
}
results.sort((a, b) => a.path.localeCompare(b.path) || a.width - b.width);
await writeFile(`${out}/${phase}.json`, JSON.stringify(results, null, 2) + '\n');
console.log(`${phase}: ${results.length} Worker renders checked`);
