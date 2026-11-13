import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const require = createRequire(`${process.cwd()}/apps/web/package.json`);
const { chromium } = require('@playwright/test');
const out = `${process.cwd()}/migration/lanes/web/out/t86-buttons`;
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({headless:true});
const report = {capturedAt:new Date().toISOString(),origins:{new:'http://127.0.0.1:8790',live:'https://www.zawlodzki.pl'},captures:[],checks:[],table:[]};
const errors=[];
function check(name, pass, details){report.checks.push({name,pass,details});if(!pass)errors.push(name);}
async function measure(locator){return locator.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),label=e.querySelector('span'),lr=label?.getBoundingClientRect();return {label:e.textContent.trim(),width:r.width,height:r.height,x:r.x,labelX:lr?.x,padding:[s.paddingBlockStart,s.paddingInlineStart],radius:s.borderRadius,weight:s.fontWeight,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,labelFont:label?getComputedStyle(label).fontSize:null,whiteSpace:s.whiteSpace,head:e.querySelector('.arrow-head')?getComputedStyle(e.querySelector('.arrow-head')).transform:null,shaft:e.querySelector('.arrow-shaft')?getComputedStyle(e.querySelector('.arrow-shaft')).opacity:null,outline:s.outlineStyle,outlineWidth:s.outlineWidth};});}
const localOnly=process.argv.includes('--local-only');
if(localOnly){const prior=JSON.parse(readFileSync(`${out}/measurements.json`,'utf8'));report.captures.push(...prior.captures.filter(c=>c.origin==='live'));report.liveCapturedAt=prior.capturedAt;}
for(const [origin,base] of Object.entries(report.origins).filter(([origin])=>!localOnly||origin==='new')){
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  for(const [slug,path] of [['home','/'],['sales-atlas','/sales-atlas-system'],['course','/kurs-ai-w-sprzedazy'],['ai','/wdrozenie-ai-w-sprzedazy-b2b']]){
   const response=await page.goto(base+path,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
   const reject=page.getByTestId('consent-banner-reject-button'); if(await reject.isVisible()) { await reject.click(); await page.getByTestId('consent-banner-card').waitFor({state:'hidden'}); await page.waitForTimeout(600); }
   const targets=slug==='home'?[['hero',page.locator('main .action.primary').first()],['text',page.locator('main .action.text').first()],['band',page.locator('.band .action.on-dark').first()]]:[['band',page.locator('.band .action.on-dark').first()]];
   for(const [kind,button] of targets){
    if(!await button.count()){report.captures.push({origin,width,path,kind,error:'CTA missing'});if(origin==='new')errors.push('missing '+path+kind);continue;}
    await page.mouse.move(0,0);await button.evaluate(e=>e.scrollIntoView({block:'center'}));await page.waitForTimeout(350);
    const rest=await measure(button);const name=`${origin}-${slug}-${kind}-w${width}`;
    // Context crop includes heading/copy, while retaining exact pixel scale.
    const region=await button.evaluate(e=>{const r=e.getBoundingClientRect();return {y:Math.max(0,r.y+scrollY-150),height:Math.min(320,document.documentElement.scrollHeight-Math.max(0,r.y+scrollY-150))};});
    await page.screenshot({path:`${out}/${name}-rest.png`});
    await button.hover();await page.waitForTimeout(350);const hover=await measure(button);
    await page.screenshot({path:`${out}/${name}-hover.png`});
    report.captures.push({origin,width,path,kind,status:response.status(),rest,hover});
    if(origin==='new'){
     check(`${name}: stable geometry`,rest.width===hover.width&&rest.labelX===hover.labelX,{rest,hover});
     check(`${name}: label fits`,rest.scrollWidth<=rest.clientWidth+1&&rest.x>=0&&rest.x+rest.width<=width+1,rest);
     check(`${name}: arrow`,hover.head==='matrix(1, 0, 0, 1, 6, 0)'&&hover.shaft==='1',hover);
    }
   }
   if(origin==='new'){
    check(`${slug}-w${width}: document fits`,await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})));
    const fits=await page.locator('a.action:visible').evaluateAll(es=>es.map(e=>{const span=e.querySelector('span');const range=document.createRange();range.selectNodeContents(span);return {label:e.textContent,font:getComputedStyle(span).fontSize,fits:range.getBoundingClientRect().width<=span.getBoundingClientRect().width+1,whiteSpace:getComputedStyle(e).whiteSpace};}));
    check(`${slug}-w${width}: all CTA labels single-line and complete`,fits.every(e=>e.fits&&e.whiteSpace==='nowrap'),fits);
   }
  }
  await page.close();
 }
}
const page=await browser.newPage({viewport:{width:1440,height:900}});
for(const [path,selectors] of [['/',['.site-header .action','main .action.primary','main .action.text','.band .action','.newsletter .submit']],['/kurs-ai-w-sprzedazy',['.pricing a.cta']],['/blog',['.pagination a.action']],['/kontakt',['.lead-form .submit']]]){
 await page.goto(report.origins.new+path);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
 for(const selector of selectors){const loc=page.locator(selector);if(await loc.count())for(const item of await loc.all()) report.table.push({path,selector,...await measure(item)});else report.table.push({path,selector,missing:true});}
}
await page.goto(report.origins.new+'/');await page.evaluate(()=>document.fonts.ready);
const button=page.locator('main .action.primary').first();
await page.mouse.move(0,0);await page.keyboard.press('Tab');await button.focus();await page.waitForTimeout(300);
const focus=await measure(button);check('keyboard focus ring and arrow',focus.outline==='solid'&&parseFloat(focus.outlineWidth)>=3&&focus.shaft==='1',focus);
await button.screenshot({path:`${out}/new-keyboard-focus.png`});
await button.blur();await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.move(0,0);const reducedRest=await measure(button);await button.hover();await page.waitForTimeout(100);const reducedHover=await measure(button);
check('reduced motion stays static',reducedRest.head===reducedHover.head&&reducedRest.width===reducedHover.width,{reducedRest,reducedHover});await button.screenshot({path:`${out}/new-reduced-motion.png`});
const touch=await browser.newPage({viewport:{width:390,height:900},hasTouch:true,isMobile:true});await touch.goto(report.origins.new+'/');await touch.evaluate(()=>document.fonts.ready);const tb=touch.locator('main .action.primary').first();await tb.tap({trial:true});const tm=await measure(tb);check('touch keeps chevron',tm.head==='none'&&tm.shaft==='0',tm);await touch.close();
check('home has no gradient text',await page.evaluate(()=>!Array.from(document.querySelectorAll('main *')).some(e=>getComputedStyle(e).backgroundClip==='text'&&getComputedStyle(e).backgroundImage.includes('gradient'))),{});
await browser.close();writeFileSync(`${out}/measurements.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({captures:report.captures.length,checks:report.checks.length,errors},null,2));if(errors.length)process.exitCode=1;
