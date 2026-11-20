import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
const require = createRequire(resolve('apps/web/package.json'));
const { chromium } = require('@playwright/test');
const out = dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const widths=process.argv[2] ? [Number(process.argv[2])] : [375,1280];
const report=process.argv[2] ? JSON.parse(readFileSync(out+'/report.json','utf8')).filter(row=>!widths.includes(row.width)) : [];
try {
for (const width of widths) for (const mode of ['normal','grayscale','forced']) {
 const shots=[];
 for (const origin of ['https://www.zawlodzki.pl','http://127.0.0.1:8790']) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',forcedColors:mode==='forced'?'active':'none'});
  await page.goto(origin+'/o-mnie',{waitUntil:'networkidle'});
  const reject=page.getByRole('button',{name:'Odrzucam opcjonalne',exact:true});
  if(await reject.isVisible()) await reject.click();
  if(mode==='grayscale') await page.addStyleTag({content:'html {filter:grayscale(1)}'});
  const local=origin.includes('127.0.0.1');
  if(local) {
   console.log('local',await page.title(),await page.locator('[data-tabs]').count());
   if(width===375) await page.locator('.nav-toggle').click();
   const nav=page.locator('.nav-link[aria-current="page"]');
   const navStable = await nav.evaluate(e => {
     const before=e.getBoundingClientRect().toJSON();
     e.style.textDecoration='none';
     const after=e.getBoundingClientRect().toJSON();
     e.style.removeProperty('text-decoration');
     return JSON.stringify(before)===JSON.stringify(after);
   });
   if(!navStable) throw new Error('nav indicator shifts layout');
   report.push({width,mode,navStable,nav:await nav.evaluate(e=>({label:e.textContent,decoration:getComputedStyle(e).textDecorationLine,color:getComputedStyle(e).color,background:getComputedStyle(e.closest('header')).backgroundColor}))});
  } else if(width===375) {
   const toggle=page.locator('.nav-toggle').first();
   if(await toggle.isVisible()) await toggle.click();
  }
  const header=await page.screenshot();
  if(local) {
   await page.locator('.nav-link[aria-current="page"]').focus();
   await page.screenshot({path:out+'/focus-nav-'+mode+'-'+width+'.png'});
  }
  if(local && width===375) await page.locator('.nav-toggle').click();
  await page.goto(origin+'/sales-atlas-system',{waitUntil:'networkidle'});
  if(await reject.isVisible()) await reject.click();
  if(mode==='grayscale') await page.addStyleTag({content:'html {filter:grayscale(1)}'});
  const tabs=page.locator('[data-tabs]').first();
  let tabshot;
  if(await tabs.count()) {
   await page.locator('[role=tab][aria-selected=true]').first().scrollIntoViewIfNeeded();
   tabshot=await page.screenshot();
   if(local) {
    const selected=page.locator('[role="tab"][aria-selected="true"]').first();
    report.push({width,mode,tab:await selected.evaluate(e=>{const s=getComputedStyle(e),p=getComputedStyle(e,'::after'); const before=e.getBoundingClientRect(); e.removeAttribute('aria-selected'); const after=e.getBoundingClientRect(); e.setAttribute('aria-selected','true'); return {color:s.color,background:s.backgroundColor,border:p.borderInlineStartWidth,indicatorColor:p.borderInlineStartColor,position:p.position,deltaWidth:after.width-before.width,deltaX:after.x-before.x};})});
    const metrics = await selected.evaluate(e => {
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
      function luminance(color) {
        ctx.fillStyle = color; ctx.fillRect(0,0,1,1);
        const rgb = [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(v => {v/=255; return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});
        return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
      }
      const style=getComputedStyle(e), a=luminance(style.color), b=luminance(style.backgroundColor);
      const before=e.getBoundingClientRect().toJSON();
      const override=document.createElement('style'); override.textContent='.menu a::after { content: none !important; }';document.head.append(override);
      const after=e.getBoundingClientRect().toJSON(); override.remove();
      return {contrast:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05),noIndicatorLayoutShift:JSON.stringify(before)===JSON.stringify(after)};
    });
    if(metrics.contrast<3 || !metrics.noIndicatorLayoutShift) throw new Error(JSON.stringify(metrics));
    report.push({width,mode,metrics});
    await selected.focus();
    await page.screenshot({path:out+'/focus-tabs-'+mode+'-'+width+'.png'});
   }
  } else throw new Error('tabs missing '+origin);
  shots.push({header,tabshot});
  await page.close();
 }
 // Browser canvas joins the actual live and local captures without resampling.
 const canvasPage=await browser.newPage({viewport:{width:width*2,height:900}});
 for(const [key,label] of [['header','nav'],['tabshot','tabs']]) {
  await canvasPage.setContent('<canvas width="'+width*2+'" height="900"></canvas>');
  await canvasPage.evaluate(async ({a,b,w})=>{const c=document.querySelector('canvas'); const ctx=c.getContext('2d'); for(const [i,src] of [a,b].entries()){const img=new Image();img.src='data:image/png;base64,'+src;await img.decode();ctx.drawImage(img,i*w,0);}}, {a:shots[0][key].toString('base64'),b:shots[1][key].toString('base64'),w:width});
  await canvasPage.locator('canvas').screenshot({path:out+'/compare-'+label+'-'+mode+'-'+width+'.png'});
 }
 await canvasPage.close();
}
writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');
} finally {await browser.close();}
