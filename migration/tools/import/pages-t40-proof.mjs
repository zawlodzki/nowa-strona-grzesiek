import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const out = 'migration/lanes/design/out/t40-asana';
const facts = JSON.parse(await readFile(`${out}/facts.json`, 'utf8'));
const beforeBody = await readFile(process.argv[2], 'utf8');
const graphs = html => [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
const afterBody = await (await fetch('http://127.0.0.1:8791/szkolenie-i-wdrozenie-asana')).text();
const before = graphs(beforeBody), after = graphs(afterBody);
assert.equal(after.length, 1);
assert.equal(after[0]['@graph'].filter(n=>n['@type']==='Review').length, 1);
await writeFile(`${out}/jsonld-before-after.json`, JSON.stringify({ before, after }, null, 2)+'\n');
for(const p of facts.pages) {
  assert.equal(p.overflow, false, `overflow ${p.path} ${p.width}`);
  for(const posts of p.posts) { assert.equal(posts.count,3); assert.ok(Math.abs(posts.containerCenter-posts.cardsCenter)<1); }
  if(['/audyt-sprzedazy','/wdrozenie-ai-w-sprzedazy-b2b'].includes(p.path)) {
    assert.equal(p.prices.length,3);
    for(const price of p.prices) for(const key of ['family','size','weight','color']) assert.equal(price[key],p.prices[0][key]);
  }
  if(p.path==='/szkolenie-i-wdrozenie-asana') {
    assert.equal(p.graphs.length,1);
    assert.equal(p.quotes.length,p.graphs[0]['@graph'].filter(n=>n['@type']==='Review').length);
    assert.ok(p.logos.some(l=>/smmash/i.test(l.alt)&&l.loaded));
  }
}
const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome',args:['--no-sandbox']});
try {
const page = await browser.newPage();
const patched = [];
for(const width of [1440,768,375]) {
  await page.setViewportSize({width,height:1000});
  for(const path of [...new Set(facts.badges.filter(b=>facts.proposals.some(p=>p.before===b.text)).map(b=>b.path))]) {
    await page.goto('http://127.0.0.1:8791'+path);
    await page.evaluate(async()=>await document.fonts.ready);
    const result=await page.locator('.pricing .tier').evaluateAll((els,proposals)=>els.map(el=>{
      const proposal=proposals.find(p=>p.before===el.textContent); if(proposal)el.textContent=proposal.after;
      const r=document.createRange();r.selectNodeContents(el);
      return {text:el.textContent,lines:new Set([...r.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.top))).size};
    }),facts.proposals);
    for(const badge of result) assert.equal(badge.lines,1,`${path} ${width} ${badge.text}`);
    await page.locator('.pricing').screenshot({path:`${out}/preview-badges-${path.slice(1)}-${width}.png`});
    patched.push({path,width,badges:result});
  }
  await page.goto('http://127.0.0.1:8791/szkolenie-i-wdrozenie-asana');
  await page.locator('.testimonials img.logo').evaluate(async el=>{el.loading='eager';await el.decode();});
  await page.locator('.testimonials').screenshot({path:`${out}/smmash-${width}.png`});
  await page.goto('http://127.0.0.1:8791/audyt-sprzedazy');
  const cta=page.locator('.hero a').filter({hasText:'Umów audyt sprzedaży'});
  assert.equal(await cta.getAttribute('href'),'/kontakt');
  await page.locator('.hero').screenshot({path:`${out}/audit-cta-${width}.png`});
}
await writeFile(`${out}/patched-preview.json`,JSON.stringify(patched,null,2)+'\n');
console.log('PASS: quote coverage, logo loaded, centered post lists, price typography, CTA, no overflow, shortened badges all one line.');

} finally { await browser.close(); }
