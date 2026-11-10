// Run after verify-web up/doctor on 8790. No writes to remote services.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core/index.mjs node capture.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const out = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
const sections = {
  header: ['.navbar', '.site-header'],
  hero: ['.hero-section', 'section.hero'],
  logos: ['.testimonials-section', 'section.logo-strip'],
  services: ['.section:has(h2:text("Zacznijmy od miejsca"))', 'section.content-section:has(h2:text("Zacznijmy od miejsca"))'],
  about: ['.feature-section:has(h2:text("Grzegorz Zawłodzki"))', 'section.feature:has(h2:text("Grzegorz Zawłodzki"))'],
  contact: ['.contact-section', 'section.contact'],
  newsletter: ['.cta-section:has(h2:text("Newsletter Sales"))', 'section.newsletter'],
  footer: ['footer', 'footer'],
};
const report = [];
async function ready(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += 650) {
      window.scrollTo(0, y); await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  const reject = page.getByRole('button', { name: /Odrzucam opcjonalne/i });
  if (await reject.count() && await reject.first().isVisible()) await reject.first().click();
  await page.waitForTimeout(500);
}
try {
for (const width of [1280, 375]) {
  for (const [source, origin, index] of [['live', 'https://zawlodzki.pl', 0], ['local', 'http://127.0.0.1:8790', 1]]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    await page.goto(origin, { waitUntil: 'domcontentloaded' }); await ready(page);
    await page.screenshot({ path: `${out}/${source}-home-w${width}.png`, fullPage: true });
    for (const [name, selectors] of Object.entries(sections)) {
      let element = page.locator(selectors[index]).first();
      if (!(await element.count())) throw new Error(`Missing ${source} ${name}`);
      // Live Webflow uses div.feature-section on some sections.
      await shotElement(page, element, `${out}/${source}-${name}-w${width}.png`);
    }
    report.push({ source, path: '/', width, metrics: await metrics(page) });
    await page.close();
  }
  for (const route of ['/blog/bezpieczne-przekazanie-danych', '/szkolenie-i-wdrozenie-pipedrive', '/kontakt', '/o-mnie', '/newsletter']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const response = await page.goto(`http://127.0.0.1:8790${route}`, { waitUntil: 'domcontentloaded' }); await ready(page);
    const label = route.split('/').at(-1);
    await page.screenshot({ path: `${out}/local-route-${label}-w${width}.png`, fullPage: true });
    for (const [name, selector] of Object.entries({ header: '.site-header', footer: 'footer', contact: 'section.contact', newsletter: 'section.newsletter', logos: 'section.logo-strip' })) {
      const elements = page.locator(selector);
      for (let i = 0; i < await elements.count(); i++) await shotElement(page, elements.nth(i), `${out}/local-route-${label}-${name}-${i}-w${width}.png`);
    }
    const result = { source: 'local', path: route, width, status: response.status(), metrics: await metrics(page) };
    report.push(result);
    if (result.status !== 200 || result.metrics.scrollWidth !== width) throw new Error(`Regression: ${JSON.stringify(result)}`);
    await page.close();
  }
  for (const name of Object.keys(sections)) {
    const page = await browser.newPage({ viewport: { width: width * 2, height: 900 } });
    const images = await Promise.all(['live', 'local'].map(async (source) => `data:image/png;base64,${(await fs.readFile(`${out}/${source}-${name}-w${width}.png`)).toString('base64')}`));
    await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:1fr 1fr;font:16px system-ui;background:white}figure{margin:0}figcaption{padding:12px;background:#eee}img{display:block;width:100%;height:auto}</style>${images.map((image,i)=>`<figure><figcaption>${i ? 'Local Worker' : 'Live Webflow'} — ${name} — ${width}px</figcaption><img src="${image}"></figure>`).join('')}`);
    await page.locator('body').screenshot({ path: `${out}/compare-${name}-w${width}.png` }); await page.close();
  }
}
await fs.writeFile(`${out}/render-checks.json`, JSON.stringify(report, null, 2) + '\n');
} finally { await browser.close(); }
async function metrics(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    headerFill: getComputedStyle(document.querySelector('header .logo-mark path') || document.body).fill,
    footerTitles: Array.from(document.querySelectorAll('.column-title')).map((e) => e.textContent),
    brokenImages: Array.from(document.images).filter((e) => e.getBoundingClientRect().width > 0 && (!e.complete || e.naturalWidth === 0)).map((e) => e.src),
    formFields: Array.from(document.querySelectorAll('form[data-lead-form]')).map((form) => ({ id: form.id, hiddenAttribution: form.querySelectorAll('[data-zaw-attribution-fields] input').length, newsletterType: form.querySelector('[name=newsletter]')?.getAttribute('type'), turnstileAppearance: form.querySelector('.cf-turnstile')?.getAttribute('data-appearance'), turnstileHeight: form.querySelector('.cf-turnstile')?.getBoundingClientRect().height, hasToken: Boolean(form.querySelector('[name=cf-turnstile-response]')?.value) })),
  }));
}

async function shotElement(page, element, target) {
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await element.boundingBox();
  await page.screenshot({ path: target, clip: box, fullPage: true, captureBeyondViewport: true });
}
