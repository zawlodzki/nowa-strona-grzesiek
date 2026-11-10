// Accessibility tree + live/local proof for visually-hidden labels and exact placeholders.
import fs from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
const out = new URL('./', import.meta.url).pathname;
const report = [];
try {
  for (const width of [1280, 375]) for (const source of ['live', 'local']) for (const route of ['/', '/kontakt']) {
    const page = await b.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await page.goto((source === 'live' ? 'https://zawlodzki.pl' : 'http://127.0.0.1:8790') + route, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
      await Promise.all(Array.from(document.images).filter(e => e.getBoundingClientRect().width > 0).map(e => e.decode().catch(() => {})));
      window.scrollTo(0, 0);
    });
    const duplicateIds = await page.evaluate(() => { const ids = Array.from(document.querySelectorAll('[id]')).map(e => e.id).filter(Boolean); return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]; });
    if (source === 'local' && duplicateIds.length) throw new Error(`Duplicate ids: ${duplicateIds}`);
    const selectors = source === 'live' ? '.contact-section form, .cta-section:has(.div-block) form' : 'form[data-lead-form]';
    const cdp = await page.context().newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: selectors.split(', ').map(s => `${s} input:not([type=hidden]):not([type=submit]), ${s} textarea`).join(', ') });
    const fields = [];
    for (const nodeId of nodeIds) {
      const { node } = await cdp.send('DOM.describeNode', { nodeId });
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId: node.backendNodeId, fetchRelatives: false });
      const ax = nodes.find(n => n.backendDOMNodeId === node.backendNodeId);
      const { object } = await cdp.send('DOM.resolveNode', { nodeId });
      const result = await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, returnByValue: true, functionDeclaration: `function() {
        const e = this, s = getComputedStyle(e), ph = getComputedStyle(e, '::placeholder');
        const labels = Array.from(e.labels || []);
        const labelText = labels.map(label => label.textContent.trim().replace(/\\s+/g, ' ')).join(' ');
        const form = e.closest('form');
        const rgb = color => { const c = document.createElement('canvas'); c.width = c.height = 1; const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0,0,1,1); return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3); };
        return { form: form.id, id: e.id, name: e.name, type: e.type, placeholder: e.getAttribute('placeholder'), required: e.required, labelText, labels: labels.map(label => ({ for: label.htmlFor, association: label.control === e, class: label.className, width: label.getBoundingClientRect().width, height: label.getBoundingClientRect().height, clipPath: getComputedStyle(label).clipPath, display: getComputedStyle(label).display, visibility: getComputedStyle(label).visibility, ariaHidden: label.getAttribute('aria-hidden') })), visible: e.getBoundingClientRect().width > 0, height: e.getBoundingClientRect().height, padding: s.padding, borderWidth: s.borderWidth, borderColor: rgb(s.borderColor), borderRadius: s.borderRadius, fontSize: s.fontSize, lineHeight: s.lineHeight, placeholderRGB: rgb(ph.color), backgroundRGB: rgb(s.backgroundColor), placeholderOpacity: ph.opacity };
      }` });
      const data = { ...result.result.value, accessibleName: ax?.name?.value ?? '', role: ax?.role?.value ?? '', axIgnored: ax?.ignored ?? true };
      data.placeholderContrast = contrast(data.placeholderRGB, data.backgroundRGB);
      if (source === 'local') {
        if (data.axIgnored || data.accessibleName !== data.labelText || data.labels.length !== 1 || !data.labels[0].association) throw new Error(`Accessible label failure: ${JSON.stringify(data)}`);
        if (data.type === 'checkbox') {
          if (data.labels[0].clipPath !== 'none' || data.labels[0].height <= 1) throw new Error('Consent checkbox label hidden');
        } else {
          if (data.labels[0].for !== data.id || data.labels[0].clipPath !== 'inset(50%)' || data.labels[0].height !== 1 || data.labels[0].width !== 1 || data.labels[0].display === 'none' || data.labels[0].visibility === 'hidden' || data.labels[0].ariaHidden) throw new Error('Field label not screen-reader-only');
          if (data.placeholderContrast < 4.5) throw new Error('Placeholder contrast below 4.5:1');
        }
      }
      fields.push(data);
    }
    const entry = { source, route, width, duplicateIds, fields, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) };
    if (source === 'local' && entry.scrollWidth !== width) throw new Error('Horizontal overflow');
    report.push(entry);
    const contact = page.locator(source === 'live' ? '.contact-section form' : 'section.contact form').first();
    await crop(page, contact, `${source}-labels-contact-${route === '/' ? 'home' : 'kontakt'}-w${width}.png`);
    if (route === '/') {
      const section = page.locator(source === 'live' ? '.cta-section:has(.div-block)' : 'section.newsletter').last();
      const row = section.locator(source === 'live' ? '.div-block' : 'form');
      await crop(page, section, `${source}-labels-newsletter-section-w${width}.png`);
      await crop(page, row, `${source}-labels-newsletter-row-w${width}.png`);
      if (source === 'local') {
        const aligned = await row.evaluate(row => { const a = row.querySelector('[type=email]').getBoundingClientRect(), b = row.querySelector('[type=submit]').getBoundingClientRect(); return Math.abs(a.height - b.height) < .1 && Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < .1; });
        if (!aligned) throw new Error('Newsletter alignment regressed');
      }
    }
    await cdp.detach(); await page.close();
  }
  for (const width of [1280,375]) for (const name of ['contact-home','contact-kontakt','newsletter-section','newsletter-row']) await compare(name,width);
  for (const local of report.filter(r => r.source === 'local')) {
    const live = report.find(r => r.source === 'live' && r.route === local.route && r.width === local.width);
    for (const field of local.fields.filter(f => f.type !== 'checkbox')) {
      const target = live.fields.find(f => f.name === field.name && (field.form.includes('newsletter') ? f.form.includes('Newsletter') : !f.form.includes('Newsletter')));
      for (const key of ['placeholder','required']) if (field[key] !== target[key]) throw new Error(`Live parity: ${key}`);
      if (!field.form.includes('newsletter')) for (const key of ['height','padding','borderWidth','borderRadius','fontSize','lineHeight']) if (field[key] !== target[key]) throw new Error(`Contact ${field.name} ${key}: ${field[key]} vs ${target[key]}`);
    }
  }
  await fs.writeFile(`${out}/labels-accessibility.json`, JSON.stringify(report,null,2)+'\n');
} finally { await b.close(); }
function contrast(a,b) { const luminance = rgb => rgb.map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum + v*[.2126,.7152,.0722][i],0); const x=luminance(a),y=luminance(b); return Number(((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(3)); }
async function crop(page, element, file) { await page.evaluate(()=>window.scrollTo(0,0)); const box=await element.boundingBox(); await page.screenshot({path:`${out}/${file}`,fullPage:true,clip:box,captureBeyondViewport:true}); }
async function compare(name,width) { const page=await b.newPage({viewport:{width:width*2,height:900}}); const images=await Promise.all(['live','local'].map(async source=>`data:image/png;base64,${(await fs.readFile(`${out}/${source}-labels-${name}-w${width}.png`)).toString('base64')}`)); await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;background:white;font:16px system-ui}figure{margin:0}figcaption{padding:12px;background:#eee}img{display:block;max-width:100%;height:auto;margin:auto}</style>${images.map((image,i)=>`<figure><figcaption>${i?'Local Worker':'Live Webflow'} — ${name} — ${width}px</figcaption><img src="${image}"></figure>`).join('')}`); await page.locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode()))); const height=await page.locator('figure').evaluateAll(es=>Math.ceil(Math.max(...es.map(e=>e.querySelector('figcaption').getBoundingClientRect().height+e.querySelector('img').getBoundingClientRect().height)))); await page.screenshot({path:`${out}/compare-labels-${name}-w${width}.png`,fullPage:true,clip:{x:0,y:0,width:width*2,height}}); await page.close(); }
