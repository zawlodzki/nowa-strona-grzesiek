const {chromium}=require(process.env.PLAYWRIGHT_CORE || '/tmp/t31-browser/node_modules/playwright-core');
const fs=require('fs');
const out=__dirname, phase=process.argv[2]||'after';
const paths=['/szkolenie-i-wdrozenie-asana','/audyt-sprzedazy','/szkolenie-i-wdrozenie-pipedrive','/wdrozenie-ai-w-sprzedazy-b2b','/kurs-ai-w-sprzedazy','/sales-atlas-system','/blog/asana-vs-jira'];
(async()=>{
 const browser=await chromium.launch({executablePath:'/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
 try {
 const page=await browser.newPage();const results=[];
 for(const path of paths){
  await page.goto('http://127.0.0.1:8790'+path);await page.evaluate(()=>document.fonts.ready);
  const headings=await page.locator('h2,h3').evaluateAll(es=>es.map(e=>({tag:e.tagName,text:e.textContent.trim(),id:e.id,visible:!!e.getClientRects().length,inMain:!!e.closest('main'),excluded:!!e.closest('.tabs')||!!e.closest('[data-kind="tabs"]')})));
  const duplicates=await page.locator('[id]').evaluateAll(es=>es.map(e=>e.id).filter((id,i,a)=>a.indexOf(id)!==i));
  if(phase!=='before'&&duplicates.length)throw Error(`${path}: duplicate document ids ${duplicates}`);
  const html=await (await page.request.get('http://127.0.0.1:8790'+path)).text();
  if(phase!=='before'&&headings.some(h=>h.id&&!html.includes(`id="${h.id}"`)))throw Error('Anchor missing from server HTML');
  results.push({path,headings,total:headings.length,withId:headings.filter(h=>h.id).length,missing:headings.filter(h=>!h.id).map(h=>h.text),duplicates:headings.filter((h,i)=>h.id&&headings.findIndex(x=>x.id===h.id)!==i)});
 }
 fs.writeFileSync(`${out}/${phase}-counts.json`,JSON.stringify(results,null,2));
 if(phase==='after'){
 const navigation=[];
 for(const path of [paths[0],paths[1],paths[6]]) for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});await page.goto('http://127.0.0.1:8790'+path);await page.evaluate(()=>document.fonts.ready);
  const id=await page.locator('main h2[id], main h3[id]').first().getAttribute('id');
  await page.goto('http://127.0.0.1:8790'+path+'#'+id);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  const metrics=await page.evaluate(id=>{const h=document.getElementById(id);const header=document.querySelector('body > header, .site-header');return {id,top:h.getBoundingClientRect().top,headerBottom:header?.getBoundingClientRect().bottom??0,margin:getComputedStyle(h).scrollMarginTop,scrollY};},id);
  navigation.push({path,width,...metrics});
  await page.screenshot({path:`${out}/new-${path.split('/').at(-1)}-${width}.png`});
  await page.goto('https://www.zawlodzki.pl'+path);await page.evaluate(()=>document.fonts.ready);
  const text=results.find(r=>r.path===path).headings.find(h=>h.id===id)?.text;
  const live=page.locator('h2,h3').filter({hasText:text}).first();if(await live.count())await live.evaluate(e=>window.scrollTo(0,scrollY+e.getBoundingClientRect().top-120));
  await page.screenshot({path:`${out}/live-${path.split('/').at(-1)}-${width}.png`});
 }
 for(const path of [paths[0],paths[1],paths[6]]) for(const width of [1440,390]) {
 const stem=path.split('/').at(-1);
 const images=['live','new'].map(name=>fs.readFileSync(`${out}/${name}-${stem}-${width}.png`).toString('base64'));
 await page.setViewportSize({width:width*2,height:1040});
 await page.setContent(`<body style="margin:0;background:white"><div style="display:flex">${images.map((img,i)=>`<div style="width:${width}px"><div style="height:40px;font:20px sans-serif">${i?'Local Worker with anchor':'Live Webflow reference'}</div><img style="width:100%" src="data:image/png;base64,${img}"></div>`).join('')}</div></body>`);
 await page.screenshot({path:`${out}/compare-${stem}-${width}.png`});
 }
 fs.writeFileSync(`${out}/navigation.json`,JSON.stringify(navigation,null,2));
 if(navigation.some(n=>n.top<n.headerBottom||n.top<0))throw Error('Heading hidden behind header');
 }
 } finally {await browser.close();}
})();
