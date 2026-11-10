// Contact-only full-width submit proof against live and verify-web's local Worker.
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
const out = new URL('./', import.meta.url).pathname;
const report = [];
try {
  for (const width of [1280, 375]) for (const source of ['live', 'local']) for (const route of ['/', '/kontakt']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await page.goto((source === 'live' ? 'https://zawlodzki.pl' : 'http://127.0.0.1:8790') + route, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => { await document.fonts.ready; for (let y=0; y<document.body.scrollHeight; y+=700) { window.scrollTo(0,y); await new Promise(r=>setTimeout(r,30)); } await Promise.all(Array.from(document.images).filter(e=>e.getBoundingClientRect().width>0).map(e=>e.decode().catch(()=>{}))); window.scrollTo(0,0); });
    const section = page.locator(source === 'live' ? '.contact-section' : 'section.contact').first();
    const contact = await section.locator('form').first().evaluate(form => {
      const button=form.querySelector('[type=submit]'), s=getComputedStyle(button), r=button.getBoundingClientRect();
      const card=form.closest('.card');
      const rgb=color=>{const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3)};
      return { formWidth:form.getBoundingClientRect().width, buttonWidth:r.width, height:r.height, padding:s.padding, radius:s.borderRadius, fontSize:s.fontSize, fontWeight:s.fontWeight, lineHeight:s.lineHeight, fontFamily:s.fontFamily, cardBackground:card?rgb(getComputedStyle(card).backgroundColor):null, expectedCardBackground:card?rgb(getComputedStyle(card).getPropertyValue('--surface-soft')):null };
    });
    if (Math.abs(contact.formWidth-contact.buttonWidth)>.1) throw new Error('Contact submit not full width');
    if (source==='local' && JSON.stringify(contact.cardBackground)!==JSON.stringify(contact.expectedCardBackground)) throw new Error('Grey contact card changed');
    await crop(page,section,`${source}-button-contact-${route==='/'?'home':'kontakt'}-w${width}.png`);
    const newsletter=page.locator(source==='live'?'.cta-section:has(.div-block)':'section.newsletter').last();
    const row=newsletter.locator(source==='live'?'.div-block':'form');
    const newsletterGeometry=await row.evaluate(row=>{const a=row.querySelector('[type=email]').getBoundingClientRect(),b=row.querySelector('[type=submit]').getBoundingClientRect();return{formWidth:row.getBoundingClientRect().width,inputWidth:a.width,buttonWidth:b.width,inputHeight:a.height,buttonHeight:b.height,centerDifference:Math.abs(a.y+a.height/2-b.y-b.height/2),gap:b.x-a.right}});
    if(source==='local'&&(newsletterGeometry.centerDifference>.1||newsletterGeometry.inputHeight!==newsletterGeometry.buttonHeight||newsletterGeometry.gap<-.1||newsletterGeometry.buttonWidth>=newsletterGeometry.formWidth))throw new Error('Newsletter inline layout regressed');
    if(route==='/')await crop(page,row,`${source}-button-newsletter-row-w${width}.png`);
    const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    if(source==='local'&&scrollWidth!==width)throw new Error('Horizontal overflow');
    report.push({source,route,width,contact,newsletter:newsletterGeometry,scrollWidth});
    await page.close();
  }
  for(const local of report.filter(r=>r.source==='local')){
    const live=report.find(r=>r.source==='live'&&r.width===local.width&&r.route===local.route);
    // Both sites fill 100% of their own form column; column layouts are deliberately unchanged.
    for(const property of ['height','padding','radius','fontSize','fontWeight','lineHeight'])if(local.contact[property]!==live.contact[property])throw new Error(`Contact ${property}: ${local.contact[property]} vs ${live.contact[property]}`);
  }
  for(const width of[1280,375])for(const name of['contact-home','contact-kontakt','newsletter-row'])await compare(name,width);
  await fs.writeFile(`${out}/button-computed.json`,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close()}
async function crop(page,element,file){await page.evaluate(()=>window.scrollTo(0,0));const box=await element.boundingBox();await page.screenshot({path:`${out}/${file}`,fullPage:true,clip:box,captureBeyondViewport:true})}
async function compare(name,width){const page=await browser.newPage({viewport:{width:width*2,height:900}});const images=await Promise.all(['live','local'].map(async source=>`data:image/png;base64,${(await fs.readFile(`${out}/${source}-button-${name}-w${width}.png`)).toString('base64')}`));await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;background:white;font:16px system-ui}figure{margin:0}figcaption{padding:12px;background:#eee}img{display:block;max-width:100%;height:auto;margin:auto}</style>${images.map((image,i)=>`<figure><figcaption>${i?'Local Worker':'Live Webflow'} — ${name} — ${width}px</figcaption><img src="${image}"></figure>`).join('')}`);await page.locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));const height=await page.locator('figure').evaluateAll(es=>Math.ceil(Math.max(...es.map(e=>e.querySelector('figcaption').getBoundingClientRect().height+e.querySelector('img').getBoundingClientRect().height))));await page.screenshot({path:`${out}/compare-button-${name}-w${width}.png`,fullPage:true,clip:{x:0,y:0,width:width*2,height}});await page.close()}
