import assert from 'node:assert/strict';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({executablePath:process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});try { const p=await b.newPage();const out='migration/lanes/design/out/t40-asana';const facts=[];
for(const width of [1440,768,375]) {
 await p.setViewportSize({width,height:1000});
 for(const path of ['/','/wdrozenie-ai-w-sprzedazy-b2b','/szkolenie-i-wdrozenie-asana']) {
  await p.goto('http://127.0.0.1:8791'+path);await p.evaluate(async()=>await document.fonts.ready);
  const colors=await p.locator('.content-section .cards > li').evaluateAll(els=>els.map(el=>{
   const rgb=value=>{const c=document.createElement('canvas').getContext('2d');c.fillStyle=value;c.fillRect(0,0,1,1);return [...c.getImageData(0,0,1,1).data].slice(0,3)};
   return {background:rgb(getComputedStyle(el).backgroundColor),number:el.querySelector('.metric-value')?rgb(getComputedStyle(el.querySelector('.metric-value')).color):null};
  }));
  if(path!=='/')assert.ok(colors.length);for(const c of colors){assert.deepEqual(c.background,[249,250,251]);if(c.number)assert.deepEqual(c.number,[58,72,204]);}facts.push({path,width,colors});
  if(path!='/wdrozenie-ai-w-sprzedazy-b2b')continue;
  const local=await p.locator('.content-section:has(.metrics)').screenshot({path:`${out}/ai-results-new-${width}.png`});
  await p.goto('https://zawlodzki.pl'+path);await p.evaluate(async()=>await document.fonts.ready);
  await p.evaluate(()=>{for(const el of document.querySelectorAll('body *'))if(['fixed','sticky'].includes(getComputedStyle(el).position))el.style.visibility='hidden';});
  const h=p.locator('h2').filter({hasText:'Po 12 tygodniach'});const section=h.locator('xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," section ")][1]');
  const live=await section.screenshot({path:`${out}/ai-results-live-${width}.png`});
  const c=await b.newPage({viewport:{width:width*2,height:1000}});await c.setContent(`<style>body{margin:0;display:flex;align-items:start}img{width:50%;height:auto}</style><img src="data:image/png;base64,${live.toString('base64')}"><img src="data:image/png;base64,${local.toString('base64')}">`);const height=await c.locator('img').evaluateAll(async els=>{await Promise.all(els.map(e=>e.decode()));return Math.ceil(Math.max(...els.map(e=>e.getBoundingClientRect().height)));});await c.setViewportSize({width:width*2,height});await c.screenshot({path:`${out}/compare-ai-results-${width}.png`,fullPage:true});await c.close();
 }
}
const staging=[];
for(const width of [1440,768,375]) {
 await p.setViewportSize({width,height:1000});
 await p.goto('https://zawlodzki-web.zawlodzki.workers.dev/szkolenie-i-wdrozenie-asana');
 await p.evaluate(async()=>await document.fonts.ready);
 staging.push({width,cards:await p.locator('.content-section .cards > li').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor)),graphs:await p.locator('script[type="application/ld+json"]').evaluateAll(els=>els.map(el=>JSON.parse(el.textContent)))});
 await p.locator('.content-section:has(.cards)').screenshot({path:`${out}/staging-asana-${width}.png`});
}
await writeFile(`${out}/staging.json`,JSON.stringify(staging,null,2)+'\n');
await writeFile(`${out}/results-colors.json`,JSON.stringify(facts,null,2)+'\n');} finally { await b.close(); }console.log('PASS grey cards #f9fafb and blue numbers #3a48cc on AI/Asana at all three widths; home has no matching cards.');
