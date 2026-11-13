import { chromium } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { writeFile } from 'node:fs/promises';
const phase = process.argv[2];
const browser = await chromium.launch({headless:true});
const out = new URL('./', import.meta.url);
const results=[];
for (const source of (phase === 'before' ? ['live','before'] : phase === 'reference' ? ['live'] : ['after'])) {
 for (const kind of ['home','article']) for (const width of (kind==='home'?[390,1440]:[390,1280,1440])) {
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const url=(source==='live'?'https://www.zawlodzki.pl':'http://127.0.0.1:8791')+(kind==='home'?'/':'/blog/wdrozenie-crm-krok-po-kroku');
  const response=await page.goto(url,{waitUntil:'networkidle',timeout:60000});
  await page.evaluate(async()=>{await document.fonts.ready; for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}scrollTo(0,0);});
  if(response.status()!==200) throw new Error(`${url}: ${response.status()}`);
  const reject=page.getByRole('button',{name:/Odrzucam/});
  if(await reject.isVisible()) {await reject.click();await page.waitForTimeout(400);}
  const prefix=`${source}-${kind}-${width}`;
  await page.screenshot({path:new URL(`${prefix}.png`,out).pathname,fullPage:true});
  await page.screenshot({path:new URL(`${prefix}-viewport.png`,out).pathname});
  if(kind==='article'){await page.locator('.toc-column').scrollIntoViewIfNeeded();await page.screenshot({path:new URL(`${prefix}-toc.png`,out).pathname});await page.evaluate(()=>scrollTo(0,0));}
  const metrics=await page.evaluate(()=>{
   const box=e=>e?{x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}:null;
   const strips=[...document.querySelectorAll('.logo-grid')].map(e=>({section:box(e.closest('section')),heading:box(e.closest('section').querySelector('header')),grid:box(e),logos:e.querySelectorAll('img').length,alts:[...e.querySelectorAll('img')].map(i=>i.alt)}));
   return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,header:box(document.querySelector('header a:has(img), .navbar a:has(img), .nav-logo, .brand')),breadcrumbs:box(document.querySelector('.crumbs, .breadcrumbs, [aria-label="Breadcrumbs"]')),toc:box(document.querySelector('.toc-column, .table-of-contents, [class*="toc"]')),column:box(document.querySelector('.post-content')),strips};
  });
  results.push({source,kind,width,url,status:response.status(),...metrics});
  if(kind==='home') {const strips=page.locator('section').filter({has:page.locator('.logo-grid')});for(let i=0;i<await strips.count();i++)await strips.nth(i).screenshot({path:new URL(`${prefix}-strip-${i}.png`,out).pathname});}
  await page.close();
 }
}
await writeFile(new URL(`${phase}-metrics.json`,out),JSON.stringify(results,null,2));
await browser.close();
