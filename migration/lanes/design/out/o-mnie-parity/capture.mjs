import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const out=path.dirname(fileURLToPath(import.meta.url));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const report=[];
async function ready(p){await p.evaluate(async()=>{await document.fonts.ready;for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}await Promise.all([...document.images].filter(e=>e.getBoundingClientRect().width).map(e=>e.decode().catch(()=>{})));scrollTo(0,0)});await p.waitForTimeout(1600);const reject=p.getByRole('button',{name:/Odrzucam/i});if(await reject.count()&&await reject.first().isVisible())await reject.first().click();}
async function shot(p,loc,name){await loc.scrollIntoViewIfNeeded();await loc.screenshot({path:`${out}/${name}.png`,style:'.site-header,.navbar{visibility:hidden!important}'});}
async function compare(name,width){const p=await browser.newPage({viewport:{width:width*2,height:900}});const imgs=await Promise.all(['live','local'].map(async s=>'data:image/png;base64,'+(await fs.readFile(`${out}/${s}-${name}-w${width}.png`)).toString('base64')));await p.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;font:16px system-ui}figure{margin:0}figcaption{padding:12px;background:#eee}img{display:block;width:100%}</style>${imgs.map((src,i)=>`<figure><figcaption>${i?'Local Worker':'Live'} ${name} ${width}px</figcaption><img src="${src}"></figure>`).join('')}`);await p.locator('body').screenshot({path:`${out}/compare-${name}-w${width}.png`});await p.close();}
try{for(const width of [1280,375]){
 const live=await browser.newPage({viewport:{width,height:900}}),local=await browser.newPage({viewport:{width,height:900}});
 for(const [side,p,origin]of[['live',live,'https://zawlodzki.pl'],['local',local,'http://127.0.0.1:8791']]){
  await p.goto(origin+'/o-mnie');await ready(p);await p.screenshot({path:`${out}/${side}-about-full-w${width}.png`,fullPage:true});
  const article=p.locator(side==='live'?'.feature-grid-3.about':'.feature-layout.article');
  await shot(p,article,`${side}-article-w${width}`);
  const contact=p.locator(side==='live'?'.contact-section':'section.contact').first();await shot(p,contact,`${side}-contact-w${width}`);
  const opinions=p.locator(side==='live'?'.testimonials-section':'section.testimonials').filter({has:p.getByRole('heading',{name:'Opinie zadowolonych klientów',exact:true})});await shot(p,opinions,`${side}-opinions-w${width}`);
  const metrics=await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));report.push({side,width,route:'/o-mnie',...metrics});if(side==='local'){
   assert.equal(metrics.scrollWidth,width);assert.equal(await p.locator('.feature-layout.article').count(),1);assert.equal(await contact.locator('form').count(),0);assert.equal(await contact.locator('.icon-link').count(),5);assert.equal(await opinions.locator('.author-image,.linkedin').count(),0);
   const media=await article.locator('.media').evaluate(e=>({display:getComputedStyle(e).display,position:getComputedStyle(e).position,top:getComputedStyle(e).top,rect:e.getBoundingClientRect().toJSON()}));assert.equal(media.display,width===375?'none':'block');if(width===1280)assert.equal(media.position,'sticky');report.push({width,media});
   const marks=await opinions.locator('blockquote').evaluateAll(es=>es.map(e=>({first:e.querySelector('p')?.textContent,before:getComputedStyle(e.querySelector('p'),'::before').content,after:getComputedStyle(e.querySelector('p:last-child'),'::after').content})));assert.ok(marks.every(m=>!/^['"„“]/.test(m.first)));report.push({width,marks});
  }
  await p.goto(origin+'/');await ready(p);const home=p.locator(side==='live'?'.testimonials-section':'section.testimonials').filter({has:p.locator('blockquote,.testimonial-box')}).first();await shot(p,home,`${side}-home-opinions-w${width}`);
 }
 for(const name of ['about-full','article','contact','opinions','home-opinions'])await compare(name,width);
 await local.goto('http://127.0.0.1:8791/_ds/blocks-b');await ready(local);const fixture=local.locator('section.testimonials').filter({has:local.locator('.author-image')});assert.equal(await fixture.count(),1);assert.equal(await fixture.locator('.linkedin').count(),1);assert.equal(await fixture.locator('.logo').count(),1);await shot(local,fixture,`fixture-author-linkedin-w${width}`);report.push({width,fixture:{photo:true,linkedin:true,recommendationImage:true}});
 for(const route of ['/','/kontakt']){await local.goto('http://127.0.0.1:8791'+route);assert.equal(await local.locator('section.contact form').count(),1);report.push({width,route,contactForms:1});}
 await live.close();await local.close();
}await fs.writeFile(`${out}/browser-checks.json`,JSON.stringify(report,null,2)+'\n');}finally{await browser.close();}
