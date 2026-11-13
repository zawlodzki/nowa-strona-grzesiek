import { launch } from '../../../../tools/cdp.mjs';
import { writeFileSync } from 'node:fs';
const out = new URL('./', import.meta.url);
const base='https://zawlodzki-web.zawlodzki.workers.dev';
const xml=await (await fetch(base+'/sitemap-pl.xml')).text();
const paths=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>new URL(m[1]).pathname);
const sample=['/blog/ai-w-sprzedazy','/blog/asana-cennik','/blog/pipedrive-cennik','/blog/audyt-wdrozonego-crm','/blog/5-krokow-do-obslugi-kazdego-leada-w-5-minut'];
const selected=[...paths.filter(p=>!p.startsWith('/blog/')||sample.includes(p)), '/lista-cookies-i-identyfikatorow','/404','/podziekowanie-konsultacja','/podziekowanie-newsletter',...Array.from({length:6},(_,i)=>'/blog/strona/'+(i+2))];
const browser=await launch();
const facts=[];
try {
for(const path of selected){
 const row={path};
 for(const [name,origin] of [['staging',base],['live','https://zawlodzki.pl']]){
  await browser.goto(origin+path);
  row[name]=await browser.eval(`(() => {const y=e=>Math.round(e.getBoundingClientRect().top+scrollY); const root=document.querySelector('main')||document.body; return {title:document.title,height:document.documentElement.scrollHeight,headings:[...root.querySelectorAll('h1,h2,h3')].map(e=>({text:e.textContent.trim(),y:y(e)})),actions:[...root.querySelectorAll('a,button,input[type=submit]')].filter(e=>e.getBoundingClientRect().height>0).map(e=>({text:(e.textContent||e.value||'').trim().replace(/\\s+/g,' '),target:e.getAttribute('href')||e.getAttribute('type'),y:y(e),class:e.className})),forms:[...root.querySelectorAll('form')].map(e=>({y:y(e),text:e.textContent.trim().slice(0,300)}))};})()`);
 }
 facts.push(row); writeFileSync(new URL('facts.json',out),JSON.stringify({date:new Date().toISOString(),viewport:[1280,900],discovered:paths,selected,facts},null,2));
 console.log(path, row.staging.height, row.staging.headings.filter(h=>h.text).map(h=>h.text).join(' | '));
}
}finally{await browser.close()}
