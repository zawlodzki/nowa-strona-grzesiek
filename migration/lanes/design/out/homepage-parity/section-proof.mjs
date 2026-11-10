// The three approved contact refinements; live/full variant differences remain intentional.
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const out=new URL('./',import.meta.url).pathname,report=[];
try{
 for(const width of[1280,375])for(const source of['live','local'])for(const route of['/','/kontakt']){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  await page.goto((source==='live'?'https://zawlodzki.pl':'http://127.0.0.1:8790')+route,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await document.fonts.ready;for(let y=0;y<document.body.scrollHeight;y+=650){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,30))}await Promise.all(Array.from(document.images).filter(e=>e.getBoundingClientRect().width>0).map(e=>e.decode().catch(()=>{})));window.scrollTo(0,0)});
  const section=page.locator(source==='live'?'.contact-section':'section.contact').first();
  const data=await section.evaluate((section,{source,route})=>{
   const measure=e=>{if(!e)return null;const s=getComputedStyle(e),r=e.getBoundingClientRect();return{tag:e.tagName,text:e.textContent.trim(),width:r.width,height:r.height,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,textAlign:s.textAlign,borderRadius:s.borderRadius}};
   const headings=Array.from(section.querySelectorAll('h1,h2,h3,h4,h5,h6'));
   const heading=headings.find(e=>e.textContent.trim()==='Formularz kontaktowy');
   const head=source==='live'?section.querySelector('.section-title.centered'):section.querySelector('.inner > .head');
   const headerChildren=Array.from(head?.children||[]);
   const card=section.querySelector(source==='live'?'.contact-grid':'.card');
   const input=section.querySelector('form [type=email]');
   const photo=section.querySelector(source==='live'?'img.kontakt.s-m-b-24':'.portrait');
   const photoHeading=source==='live'?photo?.nextElementSibling:section.querySelector('.details h3');
   const firstPageHeading=headings.find(e=>e.tagName===(route==='/'?'H2':'H1'));
   return{header:measure(head||firstPageHeading),headerChildGaps:headerChildren.slice(1).map((e,i)=>e.getBoundingClientRect().y-headerChildren[i].getBoundingClientRect().bottom),headerCardGap:head&&card?card.getBoundingClientRect().y-head.getBoundingClientRect().bottom:null,formHeading:measure(heading),formHeadingToInput:heading?input.getBoundingClientRect().y-heading.getBoundingClientRect().bottom:null,photo:measure(photo),photoToHeading:photo&&photoHeading?photoHeading.getBoundingClientRect().y-photo.getBoundingClientRect().bottom:null,headings:headings.map(e=>({level:e.tagName,text:e.textContent.trim()})),cardBackground:card?getComputedStyle(card).backgroundColor:null,phoneText:Array.from(section.querySelectorAll('a[href^="tel:"]')).map(e=>e.textContent.trim()),underlines:Array.from(section.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]')).map(e=>getComputedStyle(e).textDecorationLine),scrollWidth:document.documentElement.scrollWidth};
  },{source,route});
  if(source==='local'){
   if(data.scrollWidth!==width)throw new Error('Overflow');
   if(route==='/'&&(data.header.textAlign!=='center'||data.formHeading?.tag!=='H3'||data.photo===null))throw new Error('Landing contact structure mismatch');
   if(route==='/kontakt'&&(data.formHeading!==null||data.photo!==null||data.headings.filter(h=>h.level==='H1').length!==1))throw new Error('Full contact heading/photo duplication');
  }
  report.push({source,route,width,...data});
  await page.evaluate(()=>window.scrollTo(0,0));const box=await section.boundingBox();await page.screenshot({path:`${out}/${source}-section-contact-${route==='/'?'home':'kontakt'}-w${width}.png`,fullPage:true,clip:box,captureBeyondViewport:true});await page.close();
 }
 for(const local of report.filter(r=>r.source==='local'&&r.route==='/')){
  const live=report.find(r=>r.source==='live'&&r.route==='/'&&r.width===local.width);
  const near=(a,b,label)=>{if(Math.abs(a-b)>.1)throw new Error(`${label}: ${a} vs ${b}`)};
  near(local.header.width,live.header.width,'Header width');near(local.headerCardGap,live.headerCardGap,'Header/card gap');
  local.headerChildGaps.forEach((gap,i)=>near(gap,live.headerChildGaps[i],'Header child gap'));
  for(const key of['tag','fontWeight'])if(local.formHeading[key]!==live.formHeading[key])throw new Error(`Form heading ${key}`);
  for(const key of['fontSize','lineHeight'])near(parseFloat(local.formHeading[key]),parseFloat(live.formHeading[key]),`Form heading ${key}`);
  near(local.formHeadingToInput,live.formHeadingToInput,'Heading/input gap');
  for(const key of['width','height'])near(local.photo[key],live.photo[key],`Photo ${key}`);
  if(local.photo.borderRadius!==live.photo.borderRadius)throw new Error('Photo radius');near(local.photoToHeading,live.photoToHeading,'Photo spacing');
 }
 for(const width of[1280,375])for(const route of['home','kontakt'])await compare(route,width);
 await fs.writeFile(`${out}/section-computed.json`,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close()}
async function compare(route,width){const page=await browser.newPage({viewport:{width:width*2,height:900}});const images=await Promise.all(['live','local'].map(async source=>`data:image/png;base64,${(await fs.readFile(`${out}/${source}-section-contact-${route}-w${width}.png`)).toString('base64')}`));await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;background:white;font:16px system-ui}figure{margin:0}figcaption{padding:12px;background:#eee}img{display:block;max-width:100%;height:auto}</style>${images.map((image,i)=>`<figure><figcaption>${i?'Local Worker':'Live Webflow'} — contact ${route} — ${width}px</figcaption><img src="${image}"></figure>`).join('')}`);await page.locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));const height=await page.locator('figure').evaluateAll(es=>Math.ceil(Math.max(...es.map(e=>e.querySelector('figcaption').getBoundingClientRect().height+e.querySelector('img').getBoundingClientRect().height))));await page.screenshot({path:`${out}/compare-section-contact-${route}-w${width}.png`,fullPage:true,clip:{x:0,y:0,width:width*2,height}});await page.close()}
