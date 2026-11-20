// Run from repository root: xvfb-run -n 119 node migration/lanes/web/out/T119/probe.cjs
const {chromium}=require('../../../../../apps/web/node_modules/@playwright/test');
const fs=require('node:fs');const {execFileSync}=require('node:child_process');
const out=__dirname; const report={};
(async()=>{const b=await chromium.launch({headless:false,args:['--no-sandbox','--window-size=1280,1000']});
try {
 for(const width of [375,1280]){
  const p=await b.newPage({viewport:{width,height:900}});
  for(const [label,origin] of [['live','https://www.zawlodzki.pl'],['local','http://127.0.0.1:8790']]){
   await p.goto(origin+'/sales-atlas-system');await p.waitForTimeout(2000);await p.evaluate(()=>document.fonts.ready);
   const reject=p.getByRole('button',{name:'Odrzucam opcjonalne',exact:true});if(await reject.count())await reject.click();
   const root=p.locator('[data-tabs]').first();
   if(await root.count()){await root.evaluate(r=>window.scrollTo(0,scrollY+r.getBoundingClientRect().top-80));}
   else {await p.getByText('01 Diagnoza',{exact:false}).first().scrollIntoViewIfNeeded();}
   await p.waitForTimeout(500);
   await p.screenshot({path:`${out}/${label}-${width}.png`});
   if(width===375 && await root.count()) await root.screenshot({path:`${out}/${label}-${width}-tabs.png`});
  }
  report[width]=await p.locator('[data-tabs]').evaluate(r=>({scroll:r.dataset.scroll,selected:[...r.querySelectorAll('[role=tab]')].map(t=>t.getAttribute('aria-selected')),hidden:[...r.querySelectorAll('.panel')].map(t=>t.getAttribute('hidden')),controls:r.querySelectorAll('[role=tab][aria-controls]').length,hiddenRects:[...r.querySelectorAll('.panel[hidden]')].map(t=>t.getBoundingClientRect().height)}));
  await p.close();
 }
 const p=await b.newPage({viewport:{width:1280,height:900}});await p.goto('http://127.0.0.1:8790/sales-atlas-system');await p.waitForTimeout(1000);
 const reject=p.getByRole('button',{name:'Odrzucam opcjonalne',exact:true});if(await reject.count())await reject.click();
 const r=p.locator('[data-tabs]');await r.evaluate(r=>{window.scrollTo(0,scrollY+r.getBoundingClientRect().top-80);window.matches=[];r.addEventListener('beforematch',e=>window.matches.push({trusted:e.isTrusted,id:e.target.id}));});await p.waitForTimeout(300);
 const state=()=>r.evaluate(r=>({scroll:r.dataset.scroll,selected:[...r.querySelectorAll('[role=tab]')].findIndex(t=>t.getAttribute('aria-selected')==='true'),hidden:[...r.querySelectorAll('.panel')].map(t=>t.getAttribute('hidden')),matches:window.matches,scrollY}));
 report.before=await state();await p.screenshot({path:`${out}/find-before.png`});await p.bringToFront();execFileSync('python3',[`${out}/keys.py`]);await p.waitForTimeout(1000);report.after=await state();await p.screenshot({path:`${out}/find-after.png`});
 if(report.after.selected!==1||!report.after.matches.some(m=>m.trusted))throw Error('Native find failed');
 await p.keyboard.press('Escape');
 const tabs=r.getByRole('tab');await tabs.nth(1).focus();await p.keyboard.press('End');report.end=await state();await p.keyboard.press('Home');report.home=await state();await p.keyboard.press('ArrowDown');report.down=await state();await p.keyboard.press('ArrowUp');report.up=await state();
 const c=await b.newContext({javaScriptEnabled:false});const n=await c.newPage();await n.goto('http://127.0.0.1:8790/sales-atlas-system');report.noJS=await n.locator('[data-tabs]').evaluate(r=>({anchors:r.querySelectorAll('.menu a[href^="#"]').length,hidden:r.querySelectorAll('[hidden]').length,panels:r.querySelectorAll('.panel').length}));await c.close();
 const m=await b.newPage({viewport:{width:375,height:900}});await m.goto('http://127.0.0.1:8790/sales-atlas-system');await m.waitForTimeout(1000);await m.locator('[data-tabs] .menu > a').first().scrollIntoViewIfNeeded();await m.evaluate(()=>{window.matches=[];document.addEventListener('beforematch',e=>window.matches.push({trusted:e.isTrusted,id:e.target.id}))});await m.screenshot({path:`${out}/find-mobile-before.png`});await m.bringToFront();execFileSync('python3',[`${out}/keys.py`]);await m.waitForTimeout(500);report.mobileFind=await m.locator('[data-tabs]').evaluate(r=>({expanded:[...r.querySelectorAll('.menu > a')].findIndex(t=>t.getAttribute('aria-expanded')==='true'),matches:window.matches}));await m.screenshot({path:`${out}/find-mobile-after.png`});if(report.mobileFind.expanded!==1||!report.mobileFind.matches.some(m=>m.trusted))throw Error('Mobile native find failed');await m.close();
}finally{fs.writeFileSync(`${out}/probe.json`,JSON.stringify(report,null,2));await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
