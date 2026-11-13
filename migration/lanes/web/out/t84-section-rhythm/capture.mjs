import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const [origin, output] = process.argv.slice(2);
const require = createRequire(new URL('../../../../../apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || undefined,
});
const pages = ['/', '/szkolenie-i-wdrozenie-pipedrive', '/sales-atlas-system'];

await mkdir(resolve(output), { recursive: true });
try {
  for (const path of pages) {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const response = await page.goto(new URL(path, origin).href, { waitUntil: 'load' });
      assert.equal(response?.status(), 200, path);
      await page.evaluate(() => document.fonts.ready);
      const evidence = await page.evaluate(() => {
        const heading = 'h1,h2,h3,h4,h5,h6';
        const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
        const text = (element) => element?.textContent?.trim() || '';
        const sections = all('main section.section');
        const round = (value) => Math.round(value * 100) / 100;
        const rect = (element) => element.getBoundingClientRect();
        const content = (section) => section.firstElementChild;
        return {
          title: document.title,
          canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
          headings: all(`main :is(${heading})`).map((h) => ({ tag: h.localName, text: text(h) })),
          ids: all('main [id]').map((element) => element.id).sort(),
          sections: sections.map((section, index) => {
            const next = sections[index + 1];
            const ownHeading = section.querySelector(heading);
            const copy = section.querySelector('.feature-layout > .copy');
            const media = section.querySelector('.feature-layout > .media');
            return {
              type: [...section.classList].filter((name) => !name.startsWith('astro-')).slice(2),
              heading: text(ownHeading),
              headingSize: ownHeading ? getComputedStyle(ownHeading).fontSize : null,
              paddingStart: getComputedStyle(section).paddingBlockStart,
              paddingEnd: getComputedStyle(section).paddingBlockEnd,
              gapToNext: next ? round(rect(content(next)).top - rect(content(section)).bottom) : null,
              copyToMedia: copy && media && rect(media).height && rect(media).top >= rect(copy).bottom
                ? round(rect(media).top - rect(copy).bottom) : null,
            };
          }),
        };
      });
      const stem = join(output, `${path.slice(1) || 'home'}-${width}`);
      await writeFile(`${stem}.json`, JSON.stringify(evidence, null, 2) + '\n');
      await page.screenshot({ path: `${stem}.jpg`, fullPage: true, quality: 68, animations: 'disabled' });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
