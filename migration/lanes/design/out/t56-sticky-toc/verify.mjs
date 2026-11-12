import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = new URL('.', import.meta.url).pathname;
const mode = process.argv[2] || 'after';
const browser = await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--no-sandbox']});
const results = [];
try {
for (const width of [1440,1280,1100]) {
 const page = await browser.newPage({viewport:{width,height:900}, reducedMotion:'reduce'});
 await page.goto(`${mode === 'staging' ? 'https://zawlodzki-web.zawlodzki.workers.dev' : 'http://127.0.0.1:8791'}/blog/automatyzacja-sprzedazy`);
 await page.evaluate(() => document.fonts.ready);
 await page.waitForTimeout(1000);
 const reject = page.getByRole('button', {name:'Odrzucam opcjonalne', exact:true});
 if (await reject.isVisible()) await reject.click();
 const bounds = await page.locator('.post-content').evaluate(el => ({top:el.getBoundingClientRect().top + scrollY,height:el.getBoundingClientRect().height}));
 for (const [position,y] of [['top',0],['mid',bounds.top+bounds.height*.5-450],['late',bounds.top+bounds.height*.9-450]]) {
  await page.evaluate(y => scrollTo({top:y,behavior:'instant'}),y);
  await page.waitForTimeout(350);
  const facts = await page.evaluate(() => {
   const toc=document.querySelector('.toc-column .sticky');
   const right=document.querySelector('.recommendations .sticky');
   const article=document.querySelector('.post-content');
   const ancestors=[]; for(let el=toc.parentElement;el;el=el.parentElement) {const s=getComputedStyle(el);ancestors.push({tag:el.tagName,class:el.className,overflow:s.overflow,alignItems:s.alignItems,height:el.clientHeight});}
   const s=getComputedStyle(right);
   return {scrollY,tocTop:toc.getBoundingClientRect().top,tocHeight:toc.offsetHeight,tocPosition:getComputedStyle(toc).position,offset:getComputedStyle(toc).insetBlockStart,pageScroll:toc.hasAttribute('data-page-scroll'),articleWidth:article.clientWidth,right:{overflowY:s.overflowY,maxBlockSize:s.maxBlockSize,height:right.clientHeight,scrollHeight:right.scrollHeight,pageScroll:right.hasAttribute('data-page-scroll')},relatedHidden:document.querySelector('[data-related-posts]').inert,ancestors};
  });
  results.push({width,position,...facts});
  await page.screenshot({path:`${out}${mode}-${width}-${position}.png`});
 }
 await page.close();
}
writeFileSync(`${out}${mode}.json`,JSON.stringify(results,null,2));
if (mode === 'after') {
 for (const row of results) {
  assert.equal(row.tocPosition, 'sticky');
  assert.equal(row.pageScroll, false);
  if (row.position !== 'top') assert.ok(Math.abs(row.tocTop - parseFloat(row.offset)) < 1);
  assert.equal(row.right.overflowY, 'visible');
  assert.equal(row.right.maxBlockSize, 'none');
 }
}
console.log(results.map(r=>`${r.width} ${r.position} ${r.tocPosition} top=${r.tocTop} height=${r.tocHeight} width=${r.articleWidth}`).join('\n'));
} finally {await browser.close();}
