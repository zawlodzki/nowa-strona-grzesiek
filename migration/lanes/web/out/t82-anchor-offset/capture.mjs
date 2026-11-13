import { chromium } from '../../../../../node_modules/.pnpm/playwright-core@1.65.0/node_modules/playwright-core/index.mjs';
import { writeFileSync } from 'node:fs';
const phase = process.argv[2];
const out = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const results=[];
for (const width of [390,768,1440]) {
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.goto('http://127.0.0.1:8790/');
 console.log('elements',width,await page.locator('body > *').evaluateAll(es=>es.map(e=>({tag:e.tagName,cls:e.className})))) ;
 for (const promo of [false,true]) for (const anchor of (phase === 'before' ? ['kontakt','crm','ai'] : ['kontakt','crm','ai','cennik','faq','opinie'])) {
  await page.goto(`http://127.0.0.1:8790/${["cennik","faq"].includes(anchor) ? "audyt-crm-pipedrive" : ""}#${anchor}`);
  await page.evaluate(()=>document.fonts.ready);
  if(promo) await page.evaluate(()=>{const bar=document.createElement('aside');bar.textContent='Promo bar fixture (in flow)';bar.style.cssText='padding:16px;background:#eee';document.body.prepend(bar);});
  await page.locator(`#${anchor}`).evaluate(e=>e.scrollIntoView());
  await page.waitForTimeout(200);
  results.push(await page.evaluate(({width,anchor,promo})=>{const s=document.getElementById(anchor), h=s.querySelector('h2,h3');return {width,anchor,promo,heading:h?.textContent,headingTop:h?.getBoundingClientRect().top,headerBottom:document.querySelector('.site-header').getBoundingClientRect().bottom,sectionTop:s.getBoundingClientRect().top};},{width,anchor,promo}));
  await page.screenshot({path:`${out}${phase}-${anchor}-${width}-${promo ? "promo-fixture" : "no-promo"}.png`});
 }
 await page.goto('http://127.0.0.1:8790/blog/bezpieczne-przekazanie-danych');
 if(width<896) await page.locator('[data-toc-disclosure] summary').click();
 const link=page.locator('[data-post-toc] a[href^="#"]').nth(1);
 const hash=await link.getAttribute('href');
 await link.click();
 await page.waitForTimeout(300);
 results.push(await page.evaluate(({width,hash})=>{const h=document.querySelector(hash); const bottom=document.querySelector('.site-header').getBoundingClientRect().bottom;return {width,blog:location.pathname,hash,headingTop:h.getBoundingClientRect().top,headerBottom:bottom,gap:h.getBoundingClientRect().top-bottom,lineHeight:parseFloat(getComputedStyle(h).lineHeight)};},{width,hash}));
 await page.screenshot({path:`${out}${phase}-blog-${width}.png`});
 await page.close();
}
writeFileSync(`${out}${phase}.json`,JSON.stringify(results,null,2));
await browser.close();
