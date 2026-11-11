import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../../../../apps/web/package.json',import.meta.url));
const sharp=createRequire(require.resolve('astro'))('sharp');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const out=new URL('./',import.meta.url).pathname;
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
const results=[];
try {
for(const slug of ['asana-vs-jira','asana-vs-trello']) for(const width of [1440,768,375]) {
  const context=await browser.newContext({viewport:{width,height:900},permissions:['clipboard-read','clipboard-write']});
  const local=await context.newPage(),live=await context.newPage();
  const path=`/blog/${slug}`;
  assert.equal((await local.goto(`http://127.0.0.1:8791${path}`)).status(),200);
  assert.equal((await live.goto(`https://zawlodzki.pl${path}`)).status(),200);
  for(const page of [local,live]) {
    const reject=page.getByRole('button',{name:'Odrzucam opcjonalne',exact:true});
    if(await reject.count()) await reject.first().click();
  }
  await Promise.all([local.evaluate(()=>document.fonts.ready),live.evaluate(()=>document.fonts.ready)]);
  assert.equal(await local.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
  assert.equal(await local.locator('.recommendations li').count(),3);
  assert.equal(await local.locator('main > section #related-heading').count(),0);
  assert.equal(await local.locator('.author .nudge').count(),0);
  const ids=await local.locator('.toc-column nav a').evaluateAll(links=>links.map(a=>a.hash.slice(1)));
  assert(ids.length>0);assert.equal(new Set(ids).size,ids.length);
  for(const id of ids) assert.equal(await local.locator(`[id="${id}"]`).count(),1);
  const order=await local.evaluate(()=>{
    const author=document.querySelector('.author-section'),cta=document.querySelector('.author-section + section'),faq=document.querySelector('#faq');
    return !!author && !!cta && !!faq && !!(author.compareDocumentPosition(cta)&4) && !!(cta.compareDocumentPosition(faq)&4);
  });assert(order,'author CTA FAQ order');
  const avatar=await local.locator('.avatar').evaluate(img=>({fit:getComputedStyle(img).objectFit,width:img.width,height:img.height,natural:img.naturalWidth/img.naturalHeight}));
  assert.equal(avatar.fit,'contain');
  const sticky=[];
  async function capture(state) {
    const a=await live.screenshot();
    const b=await local.screenshot();
    await sharp({create:{width:width*2,height:900,channels:3,background:'white'}}).composite([{input:a,left:0,top:0},{input:b,left:width,top:0}]).png().toFile(`${out}compare-${slug}-${state}-${width}.png`);
  }
  await capture('hero');
  await local.locator('.post-layout').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-112));
  await live.locator('h2').first().evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-112));
  await capture('top');
  for(const step of [0,650]) {
    if(step){await local.evaluate(()=>scrollBy(0,650));await live.evaluate(()=>scrollBy(0,650));}
    sticky.push(await local.locator('.sticky').evaluateAll(els=>els.map(el=>({y:el.getBoundingClientRect().top,position:getComputedStyle(el).position}))));
  }
  if(width===1440) for(let i=0;i<2;i++){assert.equal(sticky[1][i].position,'sticky');assert(Math.abs(sticky[1][i].y-sticky[0][i].y)<2,'columns stay sticky');}
  else for(const item of sticky[1]) assert.equal(item.position,'static');
  await capture('mid');
  await local.locator('.author-section').evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-110));
  const liveAuthor=live.getByText('O autorze',{exact:true});
  if(await liveAuthor.count()) await liveAuthor.first().evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-110));
  else await live.locator('h2').filter({hasText:'Najczęściej zadawane pytania'}).first().evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-650));
  await capture('bottom');
  for(const state of ['cta','faq','sidebar']) {
    const selector=state==='cta'?'.author-section + section':state==='faq'?'#faq':'.recommendations';
    await local.locator(selector).evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-110));
    await capture(state);
  }
  await local.getByRole('button',{name:'Udostępnij',exact:true}).focus();
  await local.keyboard.press('Enter');
  assert(await local.locator('#share-options').evaluate(el=>el.matches(':popover-open')));
  assert.equal(await local.locator('#share-options a').count(),5);
  await capture('share');
  await local.getByRole('button',{name:'Kopiuj link',exact:true}).click();
  assert.equal(await local.evaluate(()=>navigator.clipboard.readText()),`https://www.zawlodzki.pl${path}`);
  await local.keyboard.press('Escape');
  assert.equal(await local.locator('#share-options').evaluate(el=>el.matches(':popover-open')),false);
  assert.equal(await local.evaluate(()=>document.activeElement?.textContent),'Udostępnij');
  results.push({slug,width,headings:ids.length,related:3,order,avatar,sticky,share:'keyboard open, copy, Escape and restored focus passed',overflow:false});
  await context.close();
}
for(const path of ['/','/blog']) {
 const page=await browser.newPage();assert.equal((await page.goto(`http://127.0.0.1:8791${path}`)).status(),200);
 for(const width of [1440,768,375]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:`${out}regression-${path==='/'?'home':'blog'}-${width}.png`});}
 await page.close();
}
await writeFile(`${out}verification.json`,JSON.stringify(results,null,2));
console.log(`Verified ${results.length} post/viewport combinations and home/blog.`);
} finally {await browser.close();}
