const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
import { writeFile } from 'node:fs/promises';
const out = 'migration/lanes/design/out/t40-asana';
const response = await fetch('https://8u2zjhvn.api.sanity.io/v2025-02-19/data/query/production?' + new URLSearchParams({ query: '*[_type == \"page\"]', perspective: 'published' }));
if (!response.ok) throw new Error('Public page query failed');
const { result: docs } = await response.json();
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
try {
const page = await browser.newPage();
const facts = { badges: [], pages: [], comparisons: [] };
const paths = [...new Set(['/','/newsletter','/o-mnie','/blog', ...docs.filter(d => d._type === 'page' && d.sections?.some(s => s._type === 'pricing')).map(d => d.slug.current)])];
const shortened = {
  'Wdrożenie zespołu do 5 osób': 'Wdrożenie do 5 osób',
  'Wdrożenie zespołu do 15 osób': 'Wdrożenie do 15 osób',
  'Wdrożenie powyżej 15 osób': 'Wdrożenie 15+ osób',
  'Program grupowy · start 1 października': 'Grupa · start 1 X',
  'Diagnoza CRM Salesforce': 'Diagnoza Salesforce',
  'Audyt istniejącej Asany': 'Audyt Asany',
  'Wdrożenie 5+ handlowców': 'Wdrożenie 5+ osób',
};
const goto = async url => {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(async () => { await Promise.race([document.fonts.ready, new Promise(r=>setTimeout(r,8000))]); await Promise.race([Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })), new Promise(r=>setTimeout(r,8000))]); });
  const reject = page.getByRole('button', { name: 'Odrzucam opcjonalne', exact: true });
  if (await reject.count()) await reject.click();
};
const count = el => { const r = document.createRange(); r.selectNodeContents(el); return new Set([...r.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top))).size; };
for (const width of [1440,768,375]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const path of paths) {
    await goto('http://127.0.0.1:8791' + path);
    const result = await page.evaluate(({ countSource }) => {
      const count = eval('(' + countSource + ')');
      const style = el => { const s = getComputedStyle(el); return { family:s.fontFamily,size:s.fontSize,weight:s.fontWeight,color:s.color }; };
      const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
      return {
        badges: [...document.querySelectorAll('.pricing .tier')].map(el => ({ text:el.textContent, lines:count(el) })),
        prices: [...document.querySelectorAll('.pricing .type-price')].map(el => ({text:el.textContent,...style(el)})),
        cards: [...document.querySelectorAll('.content-section .cards > li')].map(el => getComputedStyle(el).backgroundColor),
        quotes: [...document.querySelectorAll('.testimonials blockquote')].map(el => el.textContent),
        logos: [...document.querySelectorAll('.testimonials img.logo')].map(el => ({alt:el.alt,loaded:el.complete && el.naturalWidth>0,src:el.src})),
        graphs: scripts.map(el => JSON.parse(el.textContent)),
        ctas: [...document.querySelectorAll('.hero a')].map(el => ({text:el.textContent,href:el.getAttribute('href')})),
        overflow: document.documentElement.scrollWidth > innerWidth,
        posts: [...document.querySelectorAll('.posts-block .cards')].map(el => { const r=el.getBoundingClientRect(); const a=el.firstElementChild.getBoundingClientRect(); const z=el.lastElementChild.getBoundingClientRect(); return {containerCenter:r.x+r.width/2, cardsCenter:(a.x+z.right)/2,count:el.children.length}; }),
      };
    }, {countSource:count.toString()});
    facts.pages.push({path,width,...result});
    const doc=docs.find(d=>d.slug?.current===path);
    let badgeIndex=0;
    for (const section of doc?.sections ?? []) if(section._type==='pricing') for(const plan of section.plans) {
      const badge=result.badges[badgeIndex++];
      facts.badges.push({path,width,document:doc._id,revision:doc._rev,section:section._key,plan:plan._key,...badge});
    }
    if (['/','/newsletter','/o-mnie','/blog','/szkolenie-i-wdrozenie-asana','/audyt-sprzedazy','/wdrozenie-ai-w-sprzedazy-b2b'].includes(path)) {
      const slug=path==='/'?'home':path.slice(1);
      const selector=path==='/newsletter'||path==='/o-mnie'?'.post-list':path==='/audyt-sprzedazy'?'.pricing':path==='/szkolenie-i-wdrozenie-asana'?'.content-section:has(.cards)':path==='/wdrozenie-ai-w-sprzedazy-b2b'?'.pricing':'main';
      const local=await page.locator(selector).first().screenshot({path:`${out}/new-${slug}-${width}.png`});
      await goto('https://zawlodzki.pl'+path);
      let live;
      const heading=path==='/newsletter'||path==='/o-mnie'?/Ostatnie|Najnowsze|blog/i:path==='/audyt-sprzedazy'||path==='/wdrozenie-ai-w-sprzedazy-b2b'?/Współpraca przejrzysta|Cennik/i:/Po wdrożeniu Asana/;
      const h=page.locator('h2').filter({hasText:heading}).first();
      const pricingLive = path==='/audyt-sprzedazy'||path==='/wdrozenie-ai-w-sprzedazy-b2b';
      const target=pricingLive?page.locator('.pricing-section').first():await h.count()?h.locator('xpath=ancestor::*[self::section or contains(concat(" ",normalize-space(@class)," ")," section ") or contains(@class,"pricing-section")][1]'):page.locator('main').first();
      live=await (await target.count()?target:page.locator('body')).screenshot({path:`${out}/live-${slug}-${width}.png`});
      const compare=await browser.newPage({viewport:{width:width*2,height:1000}});
      await compare.setContent(`<style>body{margin:0;display:flex;align-items:start}img{width:50%;height:auto}</style><img src="data:image/png;base64,${live.toString('base64')}"><img src="data:image/png;base64,${local.toString('base64')}">`);
      const height = await compare.locator('img').evaluateAll(async els => { await Promise.all(els.map(el=>el.decode())); return Math.ceil(Math.max(...els.map(el=>el.getBoundingClientRect().height))); });
      await compare.setViewportSize({width:width*2,height:Math.max(height,1)});
      await compare.screenshot({path:`${out}/compare-${slug}-${width}.png`,fullPage:true}); await compare.close();
      facts.comparisons.push({path,width,selector});
    }
    console.log(width,path);
  }
}
const wrapped=new Set(facts.badges.filter(b=>b.lines>1).map(b=>b.text));
for(const text of wrapped) if(!shortened[text]) console.log('NEEDS SHORTENING',text);
facts.proposals=[...wrapped].map(before=>({before,after:shortened[before]}));
await writeFile(`${out}/facts.json`,JSON.stringify(facts,null,2)+'\n');
} finally { await browser.close(); }
