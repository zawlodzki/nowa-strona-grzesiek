import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
const out=process.env.T58_OUT;
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',headless:true});
const report=[];
async function stats(p,selector){return p.locator(selector).first().evaluate(e=>{const s=getComputedStyle(e);return {opacity:s.opacity,scale:s.scale,translate:s.translate,display:s.display,transition:s.transition,animations:e.getAnimations({subtree:true}).map(a=>({property:a.transitionProperty,time:a.currentTime,duration:a.effect.getTiming().duration,keyframes:a.effect.getKeyframes()}))}})}
async function mid(p){await p.evaluate(()=>{document.body.offsetHeight;for(const a of document.getAnimations()){if(a instanceof CSSTransition){a.pause();a.currentTime=Number(a.effect.getTiming().duration)/2}}})}
async function finish(p){await p.evaluate(()=>{for(const a of document.getAnimations())if(a instanceof CSSTransition)a.finish()});await p.waitForTimeout(30)}
async function shot(p,name){await p.screenshot({path:`${out}/${name}.png`})}
async function center(l){await l.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}))}
for(const width of [390,1440])for(const origin of ['local','staging']){
 const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference',ignoreHTTPSErrors:true});
 const p=await ctx.newPage();const base=origin==='local'?'http://127.0.0.1:8790':'https://zawlodzki-web.zawlodzki.workers.dev';
 const prefix=`${origin}-w${width}`;
 async function goto(path){await ctx.setOffline(false);await p.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});await p.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2000))]));await p.waitForTimeout(600);const reject=p.getByRole('button',{name:'Odrzucam opcjonalne',exact:true});try{await reject.waitFor({state:'visible',timeout:2000});await reject.click()}catch{}}
 async function state(name,selector,action){await shot(p,`${prefix}-${name}-before`);await action();await mid(p);if(name==='tabs-switch'&&width===390)await center(p.locator('[data-tabs] .panel:not([hidden])').first());report.push({origin,width,name,...await stats(p,selector)});await shot(p,`${prefix}-${name}-mid`);await finish(p);await shot(p,`${prefix}-${name}-after`);console.log(prefix,name);await fs.writeFile(`${out}/proof.json`,JSON.stringify(report,null,2))}
 await goto('/');
 if(width===390){await state('nav-open','.site-nav',()=>p.locator('.nav-toggle').click());await state('nav-close','.site-nav',()=>p.keyboard.press('Escape'));for(let i=0;i<6;i++){await p.locator('.nav-toggle').click();await p.waitForTimeout(30)}await finish(p)}
 else report.push({origin,width,name:'desktop-nav',...await stats(p,'.site-nav')});
 for(const [name,path,selector] of [['primary','/','.action.primary'],['secondary','/blog','.action.secondary'],['on-dark','/','.action.on-dark'],['pricing','/szkolenie-i-wdrozenie-pipedrive','.cta'],['header','/','.pill-link'],['text','/','.action.text']]){
  await goto(path);if(width===390&&name==='header') {await p.locator('.nav-toggle').click();await finish(p)}
  const l=p.locator(selector).first();if(!await l.count()){report.push({origin,width,name,error:'missing selector'});continue}
  await center(l);await p.waitForTimeout(200);await l.evaluate(e=>e.addEventListener('click',ev=>ev.preventDefault(),{once:true}));
  await state(`press-${name}`,selector,async()=>{const box=await l.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down()});await p.mouse.up();await finish(p);
 }
 await goto('/blog/chatgpt-work-czy-codex');await center(p.locator('.share-trigger'));await state('share-open','[popover]',()=>p.locator('.share-trigger').click());
 for(const method of ['button','escape','outside']){
  if(!await p.locator('[popover]').evaluate(e=>e.matches(':popover-open'))) {await p.locator('.share-trigger').click();await finish(p)}
  await state(`share-close-${method}`,'[popover]',async()=>{if(method==='button')await p.locator('.share-close').click();else if(method==='escape')await p.keyboard.press('Escape');else await p.locator('h1').click({force:true})});
 }
 await goto('/');
 for(const tone of ['light','dark']){
  const f=p.locator(`form.lead-form.${tone}`).first();await center(f.locator('.submit'));await p.waitForTimeout(100);
  // Exercise busy CSS independently so an immediate offline failure cannot hide it.
  await state(`form-${tone}-busy`,`.lead-form.${tone} .submit`,()=>f.evaluate(e=>e.setAttribute('aria-busy','true')));await f.evaluate(e=>e.removeAttribute('aria-busy'));await finish(p);
  await f.locator('input[type=email]').fill('t58-proof@example.invalid');
  await ctx.setOffline(true);
  await state(`form-${tone}-error`,`.lead-form.${tone} .status`,async()=>{await f.evaluate(e=>e.requestSubmit());await f.locator('.status').filter({hasText:'Brak połączenia'}).waitFor()});
  report.push({origin,width,name:`form-${tone}-aria`,value:await f.locator('.status').evaluate(e=>({role:e.getAttribute('role'),live:e.getAttribute('aria-live'),text:e.textContent}))});
  await f.evaluate(e=>e.requestSubmit());await f.locator('.status').filter({hasText:'Brak połączenia'}).waitFor();await finish(p);await ctx.setOffline(false);
 }
 await goto('/sales-atlas-system');
 const root=p.locator('[data-tabs]').first();const tabs=root.locator('[role=tab]');await center(width===390?root.locator('.panel:not([hidden])'):root.locator('.stage'));await p.waitForTimeout(100);
 report.push({origin,width,name:'tabs-baseline',value:await root.evaluate(e=>({size:e.style.getPropertyValue('--stage-size'),pinned:e.hasAttribute('data-scroll')}))});
 await state('tabs-switch','[data-tabs] .menu a[aria-selected=true]',()=>tabs.nth(1).click());
 for(const key of ['ArrowDown','ArrowUp','Home','End']){await tabs.nth(1).focus();await p.keyboard.press(key);await finish(p);report.push({origin,width,name:`tabs-key-${key}`,selected:await tabs.evaluateAll(es=>es.findIndex(e=>e.getAttribute('aria-selected')==='true'))})}
 if(width===1440){
  const top=await root.evaluate(e=>scrollY+e.getBoundingClientRect().top-80);for(let i=0;i<8;i++){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),top+i*160);await p.waitForTimeout(35);await shot(p,`${prefix}-tabs-fast-${i}`)}
  await p.setViewportSize({width:1439,height:1000});await p.waitForTimeout(300);report.push({origin,width,name:'tabs-after-resize',...await stats(p,'[data-tabs] .panel:not([hidden])')});
 }
 await ctx.close();
}
// Reduced-motion proof in fresh local contexts, with the same real controls.
for(const width of [390,1440]){
 const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const p=await ctx.newPage();await p.goto('http://127.0.0.1:8790');await p.waitForTimeout(300);
 if(width===390){await p.locator('.nav-toggle').click();await mid(p);report.push({origin:'reduce',width,name:'nav',...await stats(p,'.site-nav')});await shot(p,`reduce-w${width}-nav-mid`);await finish(p);await p.keyboard.press('Escape')}
 const button=p.locator('.action.primary').first();await center(button);const box=await button.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();report.push({origin:'reduce',width,name:'press',...await stats(p,'.action.primary')});await shot(p,`reduce-w${width}-press`);await p.mouse.move(0,0);await p.mouse.up();
 const f=p.locator('form.lead-form.light').first();await center(f.locator('.submit'));await f.locator('input[type=email]').fill('t58-proof@example.invalid');await ctx.setOffline(true);await f.evaluate(e=>e.requestSubmit());await f.locator('.status').filter({hasText:'Brak połączenia'}).waitFor();await mid(p);report.push({origin:'reduce',width,name:'form-error',...await stats(p,'.lead-form.light .status')});await shot(p,`reduce-w${width}-form-mid`);await ctx.setOffline(false);
 await p.goto('http://127.0.0.1:8790/blog/chatgpt-work-czy-codex');await center(p.locator('.share-trigger'));await p.locator('.share-trigger').click();await mid(p);report.push({origin:'reduce',width,name:'share',...await stats(p,'[popover]')});await shot(p,`reduce-w${width}-share-mid`);
 await p.goto('http://127.0.0.1:8790/sales-atlas-system');const root=p.locator('[data-tabs]').first();await center(root);await root.locator('[role=tab]').nth(1).click();await mid(p);report.push({origin:'reduce',width,name:'tabs',pinned:await root.getAttribute('data-scroll'),...await stats(p,'[data-tabs] .panel:not([hidden])')});await shot(p,`reduce-w${width}-tabs-mid`);await ctx.close();
}
await fs.writeFile(`${out}/proof.json`,JSON.stringify(report,null,2));await browser.close();
