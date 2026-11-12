import {chromium} from 'playwright-core';import fs from 'node:fs/promises';
const out=process.env.T58_OUT,b=await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',headless:true});const results=[];
for(const width of [390,1440]){
 const ctx=await b.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'}),p=await ctx.newPage();
 await p.addInitScript(()=>{window.t58Events=[];document.addEventListener('transitionrun',e=>{if(e.target.closest?.('[data-tabs]'))window.t58Events.push({property:e.propertyName,target:e.target.className})})});
 await p.goto('http://127.0.0.1:8790/sales-atlas-system');await p.waitForTimeout(1000);
 results.push({width,name:'tabs-load',events:await p.evaluate(()=>window.t58Events)});
 await p.evaluate(()=>window.t58Events=[]);await p.setViewportSize({width:width-1,height:1000});await p.waitForTimeout(500);results.push({width,name:'tabs-resize',events:await p.evaluate(()=>window.t58Events)});
 await p.setViewportSize({width,height:1000});await p.waitForTimeout(500);
 const root=p.locator('[data-tabs]').first(),tabs=root.locator('[role=tab]');
 const top=await root.evaluate(e=>scrollY+e.getBoundingClientRect().top-80);
 if(width===1440){for(let i=0;i<12;i++){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+i*60);await p.waitForTimeout(40)}results.push({width,name:'slow-scroll',selected:await tabs.evaluateAll(es=>es.findIndex(e=>e.getAttribute('aria-selected')==='true'))})}
 await p.goto('http://127.0.0.1:8790');await p.waitForTimeout(600);
 if(width===390){await p.locator('.nav-toggle').click();await p.waitForTimeout(40);results.push({width,name:'nav-overlap',value:await p.evaluate(()=>({panelTop:document.querySelector('.site-nav').getBoundingClientRect().top,logoBottom:document.querySelector('.logo').getBoundingClientRect().bottom}))});await p.keyboard.press('Escape');await p.waitForTimeout(200);results.push({width,name:'nav-close-hidden',display:await p.locator('.site-nav').evaluate(e=>getComputedStyle(e).display)})}
 await p.emulateMedia({reducedMotion:'reduce'});
 for(const tone of ['light','dark']){const f=p.locator(`form.lead-form.${tone}`).first();await f.evaluate(e=>e.setAttribute('aria-busy','true'));results.push({width,name:`reduce-${tone}-busy`,value:await f.locator('.submit').evaluate(e=>({opacity:getComputedStyle(e).opacity,animations:e.getAnimations().map(a=>a.transitionProperty),duration:getComputedStyle(e).transitionDuration}))});await f.evaluate(e=>e.removeAttribute('aria-busy'))}
 await ctx.close();
 const nojs=await b.newContext({viewport:{width,height:1000},javaScriptEnabled:false});const q=await nojs.newPage();await q.goto('http://127.0.0.1:8790');results.push({width,name:'no-js-nav',display:await q.locator('.site-nav').evaluate(e=>getComputedStyle(e).display)});await nojs.close();
}
await fs.writeFile(`${out}/supplement.json`,JSON.stringify(results,null,2));await b.close();console.log(results);
