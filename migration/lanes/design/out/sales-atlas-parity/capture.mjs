import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const out = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const report=[];
async function ready(p) {
 await p.evaluate(async()=>{await document.fonts.ready;for(let y=0;y<document.body.scrollHeight;y+=800){scrollTo(0,y);await new Promise(r=>setTimeout(r,20));}scrollTo(0,0)});
 await p.waitForTimeout(1400);
 const reject=p.getByRole('button',{name:/Odrzucam/i});if(await reject.count()&&await reject.first().isVisible())await reject.first().click();
}
async function shot(p,loc,name){await loc.scrollIntoViewIfNeeded();await p.waitForTimeout(400);await loc.screenshot({style:'.site-header, .navbar { visibility: hidden !important; }',path:`${out}/${name}.png`});}
async function metrics(p,label,width){const m=await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));report.push({label,width,...m});if(width===375)assert.equal(m.scrollWidth,375,label);}
try {
for(const width of [1280,375]) {
 const live=await browser.newPage({viewport:{width,height:900}});const local=await browser.newPage({viewport:{width,height:900}});
 await live.goto('https://zawlodzki.pl/sales-atlas-system');await ready(live);
 await local.goto('http://127.0.0.1:8791/_ds/blocks-a');await ready(local);
 const pairs={hero:[live.locator('.hero-section').first(),local.locator('#t32-hero')],test:[live.locator('.section').filter({has:live.getByRole('heading',{name:'Sprawdź, czy masz już system',exact:true})}).first(),local.locator('#t32-test')], 'tabs-default':[live.locator('.tabs-vertical'),local.locator('#t32-tabs')]};
 for(const [name,[a,b]] of Object.entries(pairs)){await shot(live,a,`live-${name}-w${width}`);await shot(local,b,`local-${name}-w${width}`);}
 const lt=live.locator('.tab-vertical');const ct=local.locator('#t32-tabs [role=tab]');
 assert.equal(await ct.count(),9);
 await lt.nth(3).click();await ct.nth(3).click();
 await shot(live,live.locator('.tabs-vertical'),`live-tabs-click04-w${width}`);await shot(local,local.locator('#t32-tabs'),`local-tabs-click04-w${width}`);
 await lt.first().focus();await lt.first().press('Home');for(let i=0;i<3;i++)await live.keyboard.press('ArrowDown');
 // Webflow keyboard behavior may differ; capture actual active state in report.
 await ct.first().focus();await ct.first().press('Home');for(let i=0;i<3;i++)await local.keyboard.press('ArrowDown');
 assert.equal(await ct.nth(3).getAttribute('aria-selected'),'true');
 await shot(live,live.locator('.tabs-vertical'),`live-tabs-keyboard04-w${width}`);await shot(local,local.locator('#t32-tabs'),`local-tabs-keyboard04-w${width}`);
 const states=[];
 for(const key of ['ArrowDown','Home','End']){await local.keyboard.press(key);states.push({key,tabs:await ct.evaluateAll(es=>es.map(e=>({role:e.role,selected:e.getAttribute('aria-selected'),tabindex:e.tabIndex,controls:e.getAttribute('aria-controls')})))});}
 assert.equal(states[0].tabs[4].selected,'true');assert.equal(states[1].tabs[0].selected,'true');assert.equal(states[2].tabs[8].selected,'true');
 const panels=await local.locator('#t32-tabs [role=tabpanel]').evaluateAll(es=>es.map(e=>({id:e.id,labelledby:e.getAttribute('aria-labelledby'),hidden:e.hidden})));
 assert.equal(panels.filter(p=>!p.hidden).length,1);
 report.push({width,states,panels,liveKeyboardSelected:await lt.evaluateAll(es=>es.findIndex(e=>e.classList.contains('w--current')))});
 await local.emulateMedia({reducedMotion:'reduce'});
 const motion=await local.locator('#t32-tabs .panel').evaluateAll(es=>es.map(e=>({transition:getComputedStyle(e).transitionDuration,animation:getComputedStyle(e).animationName})));
 assert.ok(motion.every(m=>m.transition==='0s'&&m.animation==='none'));report.push({width,motion});
 await metrics(local,'catalog',width);
 for(const route of ['/sales-atlas-system','/szkolenie-i-wdrozenie-pipedrive','/audyt-crm-pipedrive']){
  await local.goto(`http://127.0.0.1:8791${route}`);await ready(local);const hero=local.locator('section.hero');
  assert.equal(await hero.locator('.image-badge').count(),0);
  assert.ok(await hero.locator('a.action').count());
  await shot(local,hero,`local-route-${route.slice(1)}-hero-w${width}`);await metrics(local,route,width);
 }
 await live.close();await local.close();
 for(const name of ['hero','test','tabs-default','tabs-click04','tabs-keyboard04']){
 const p=await browser.newPage({viewport:{width:width*2,height:900}});
 const images=await Promise.all(['live','local'].map(async s=>'data:image/png;base64,'+(await fs.readFile(`${out}/${s}-${name}-w${width}.png`)).toString('base64')));
 await p.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;font:16px system-ui}figure{margin:0}figcaption{padding:12px;background:#eee}img{display:block;width:100%}</style>${images.map((s,i)=>`<figure><figcaption>${i?'Local catalog':'Live'} ${name} ${width}px</figcaption><img src="${s}"></figure>`).join('')}`);
 await p.locator('body').screenshot({path:`${out}/compare-${name}-w${width}.png`});await p.close();
 }
}
const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:375,height:900}});await nojs.goto('http://127.0.0.1:8791/_ds/blocks-a');assert.equal(await nojs.locator('#t32-tabs .panel:visible').count(),9);report.push({noJSVisiblePanels:9});await nojs.close();
await fs.writeFile(`${out}/browser-checks.json`,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
