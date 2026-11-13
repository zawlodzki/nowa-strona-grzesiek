import { createRequire } from 'node:module';
import { writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../../../../../../apps/web/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const phase = process.argv[2];
const browser = await chromium.launch();
const results = [];
try {
 for (const path of ['/', '/szkolenie-i-wdrozenie-pipedrive', '/sales-atlas-system', '/o-mnie']) {
  const slug = path.slice(1) || 'home';
  for (const width of [390, 1440]) {
   const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
   const response = await page.goto(`http://127.0.0.1:8790${path}`, { waitUntil: 'networkidle' });
   assert.equal(response.status(), 200);
   const html = await response.text();
   const outline = await page.evaluate(html => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return [...doc.querySelectorAll('main :is(h1,h2,h3,h4,h5,h6)')].map(h => ({ tag: h.localName, text: h.textContent.trim() }));
   }, html);
   const skips = outline.filter((h, i) => Number(h.tag[1]) > (i ? Number(outline[i-1].tag[1]) : 0) + 1);
   if (phase === 'after') assert.deepEqual(skips, [], `${path} skipped headings`);
   await writeFile(new URL(`${phase}-${slug}-${width}-outline.tsv`, import.meta.url), outline.map(h => `${h.tag}\t${h.text}`).join('\n')+'\n');
   await page.evaluate(() => document.fonts.ready);
      await page.getByRole('button', { name: 'Odrzucam opcjonalne', exact: true }).click({ timeout: 2000 }).catch(() => {});
      await page.evaluate(() => scrollTo(0, 0));
   const measurement = await page.evaluate(() => {
    const all = [...document.querySelectorAll('main section.section')];
    const rect = el => el.getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth > innerWidth, groups: [...document.querySelectorAll('main .section-group')].map(g => [...g.children].map(el => all.indexOf(el)).filter(i => i >= 0)).filter(g => g.length), sections: all.map((el, i) => ({ heading: el.querySelector('h1,h2,h3')?.textContent, gapToNext: all[i+1] ? rect(all[i+1].firstElementChild).top - rect(el.firstElementChild).bottom : null, copyMedia: el.querySelector('.copy') && el.querySelector('.media') ? rect(el.querySelector('.media')).top - rect(el.querySelector('.copy')).bottom : null })) };
   });
   assert.equal(measurement.overflow, false, `${path} overflow`);
   let groups = measurement.groups;
   if (phase === 'before') groups = JSON.parse(await readFile(new URL(`after-${slug}-${width}.json`, import.meta.url))).groups;
   await page.screenshot({path: new URL(`compare-${phase}-${slug}-${width}-full.png`,import.meta.url).pathname, fullPage:true, animations:'disabled'});
   for (const [index, group] of groups.entries()) {
    const clip = await page.evaluate(group => {
     const all = [...document.querySelectorAll('main section.section')];
     const boxes = group.map(i => all[i].getBoundingClientRect());
     const x = Math.min(...boxes.map(b=>b.x)), y = Math.min(...boxes.map(b=>b.y))+scrollY;
     return { x, y, width: Math.max(...boxes.map(b=>b.right))-x, height: Math.max(...boxes.map(b=>b.bottom))+scrollY-y };
    }, group);
    await page.screenshot({path: new URL(`compare-${phase}-${slug}-${width}-group-${index}.png`,import.meta.url).pathname,clip, fullPage:true, animations:'disabled'});
   }
   await writeFile(new URL(`${phase}-${slug}-${width}.json`,import.meta.url), JSON.stringify(measurement,null,2));
   results.push({path,width, headings:outline.length,skips});
   await page.close();
  }
 }
 await writeFile(new URL(`${phase}-summary.json`,import.meta.url), JSON.stringify(results,null,2));
} finally { await browser.close(); }
