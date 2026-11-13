import { chromium } from '../../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const out=resolve('migration/lanes/web/out/t83-pricing/after');
const paths=readdirSync('apps/web/dist').filter(f=>f.endsWith('.html')&&readFileSync('apps/web/dist/'+f,'utf8').includes('section pricing')).map(f=>'/'+f.slice(0,-5));
paths.push('/_ds/blocks-b');
const b=await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const results=[];
for(const width of [1440,992,768,390,375,320]) {
 const p=await b.newPage({viewport:{width,height:900}});
 for(const path of paths){
 await p.goto('http://127.0.0.1:8791'+path);await p.evaluate(()=>document.fonts.ready);
 const cards=await p.locator('.pricing .plan').evaluateAll(cs=>cs.map(c=>{
 const rect=s=>{let e=c.querySelector(s),r=e.getBoundingClientRect(),st=getComputedStyle(e);let range=document.createRange();range.selectNodeContents(e);return {text:e.textContent.trim(),y:r.y,height:r.height,width:r.width,scroll:e.scrollWidth,font:st.fontSize,lines:[...range.getClientRects()].map(r=>r.y).filter((v,i,a)=>a.indexOf(v)===i).length};};
 return {tier:rect('.tier'),price:rect('.price'),note:rect('.note'),action:rect('.action'),cta:c.querySelector('.cta')?rect('.cta'):null};}));
 results.push({width,path,cards,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
 if(path==='/szkolenie-i-wdrozenie-pipedrive'&&width!==992){await p.locator('.pricing').screenshot({path:`${out}/section-w${width}.png`}); await p.evaluate(()=>window.scrollTo(0,document.querySelector('.pricing').getBoundingClientRect().top+scrollY-100)); await p.screenshot({path:`${out}/viewport-w${width}.png`});}
 }
 await p.close();
}
await b.close();writeFileSync(out+'/layout.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.filter(r=>r.path!=='/_ds/blocks-b'&&(r.overflow||r.cards.some(c=>c.tier.lines>1||c.tier.scroll>c.tier.width+1||(r.width===1440&&c.cta?.lines>1)))),null,2));
