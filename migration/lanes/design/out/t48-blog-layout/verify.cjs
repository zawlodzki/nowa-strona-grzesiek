const { chromium } = require('/tmp/t31-browser/node_modules/playwright-core');
const fs = require('node:fs');
const out=__dirname;
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const path='/blog/automatyzacja-sprzedazy';
 const results=[];
 for(const width of [1440,1100,900,390]){
  await page.setViewportSize({width,height:1000});
  for(const [name,origin] of [['live','https://zawlodzki.pl'],['new','http://127.0.0.1:8790']]){
   await page.goto(origin+path,{waitUntil:'domcontentloaded'}); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1800); const reject=page.getByRole('button',{name:/Odrzucam opcjonalne|Odrzuć/i}); if(await reject.count()) await reject.first().click(); await page.screenshot({path:`${out}/${name}-${width}.png`});
  }
  await page.locator('.post-layout').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${out}/layout-${width}.png`});
  results.push(await page.evaluate(()=>{
   const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,width:r.width,y:r.y};};
   return {width:innerWidth,header:rect('.post-head .inner'),toc:rect('.toc-column'),content:rect('.post-content'),right:rect('.recommendations'),cta:getComputedStyle(document.querySelector('.sidebar-cta')).display,open:document.querySelector('details[data-toc-disclosure]').open,overflow:document.documentElement.scrollWidth>innerWidth};
  }));
  if(width===390){
   await page.locator('[data-toc-disclosure] summary').click();
   await page.screenshot({path:`${out}/toc-expanded-390.png`});
   await page.locator('[data-toc-disclosure] summary').click();
   await page.locator('.share-trigger').click();
   await page.screenshot({path:`${out}/share-390.png`});
   await page.keyboard.press('Escape');
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8790'+path,{waitUntil:'domcontentloaded'});
 const states=[];
 for(const reducedMotion of ['no-preference','reduce']){
  await page.emulateMedia({reducedMotion});
  for(const [name,fraction] of [['before',.35],['after',.6],['back',.35]]){
   await page.evaluate(f=>{const r=document.querySelector('.post-content').getBoundingClientRect();scrollTo(0,scrollY+r.top+r.height*f-innerHeight/2)},fraction);
   await page.waitForTimeout(350);
   states.push(await page.locator('[data-related-posts]').evaluate((el)=>({inert:el.inert,opacity:getComputedStyle(el).opacity,transition:getComputedStyle(el).transitionDuration,transform:getComputedStyle(el).transform,rect:el.getBoundingClientRect().toJSON()})));
   await page.screenshot({path:`${out}/related-${reducedMotion}-${name}.png`});
  }
 }
 await page.locator('.share-trigger').click();await page.screenshot({path:`${out}/share-1440.png`});
 const tiles=await page.locator('.share-tile').evaluateAll(els=>els.map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})));
 fs.writeFileSync(`${out}/measurements.json`,JSON.stringify({results,states,tiles,errors},null,2));
 if(tiles.length!==6||new Set(tiles.map(t=>t.width+':'+t.height)).size!==1||errors.length||results.some(r=>r.overflow)||states.some((s,i)=>s.inert!==(i%3!==1)))throw Error('Verification failed');
 await browser.close();
})();
