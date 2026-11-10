import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const out=fileURLToPath(new URL('.',import.meta.url));
const browser=await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const report=[];
try {
 for(const width of [1280,375]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:8790/_ds/blocks-a',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await document.fonts.ready;});
  await page.waitForTimeout(1400);
  const reject=page.getByRole('button',{name:/Odrzucam/i});if(await reject.count()&&await reject.first().isVisible())await reject.first().click();
  const section=page.locator('#t32-tabs');const tabs=section.getByRole('tab');
  assert.equal(await tabs.count(),9);
  for(const [label,index] of [['default',0],['click04',3]]) {
   if(index)await tabs.nth(index).click();
   await section.scrollIntoViewIfNeeded();
   assert.equal(await tabs.nth(index).getAttribute('aria-selected'),'true');
   const style=await tabs.nth(index).evaluate(e=>({border:getComputedStyle(e).borderInlineStartWidth,background:getComputedStyle(e).backgroundColor}));
   assert.equal(style.border,'0px');assert.notEqual(style.background,'rgba(0, 0, 0, 0)');
   assert.equal(await section.locator('.menu a > span:last-child:visible').count(),1);
   await section.screenshot({path:`${out}tabs-no-accent-${label}-w${width}.png`,style:'.site-header { visibility: hidden !important; }'});
   report.push({width,state:label,selected:index,...style});
  }
  await tabs.nth(3).press('Home');assert.equal(await tabs.nth(0).getAttribute('aria-selected'),'true');
  await tabs.nth(0).press('ArrowDown');assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
  await tabs.nth(1).press('End');assert.equal(await tabs.nth(8).getAttribute('aria-selected'),'true');
  assert.equal(await tabs.nth(8).getAttribute('tabindex'),'0');
  assert.equal(await section.getByRole('tabpanel').filter({visible:true}).count(),1);
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);assert.equal(scrollWidth,width);
  report.push({width,keyboard:'Home/ArrowDown/End passed',scrollWidth});
  await page.close();
 }
 const page=await browser.newPage({javaScriptEnabled:false});await page.goto('http://127.0.0.1:8790/_ds/blocks-a',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('#t32-tabs .panel:visible').count(),9);
 assert.equal(await page.locator('#t32-tabs .menu a > span:last-child:visible').count(),9);
 report.push({noJSVisiblePanels:9,noJSVisibleSummaries:9});await page.close();
 await fs.writeFile(`${out}no-accent-checks.json`,JSON.stringify(report,null,2)+'\n');
} finally {await browser.close();}
