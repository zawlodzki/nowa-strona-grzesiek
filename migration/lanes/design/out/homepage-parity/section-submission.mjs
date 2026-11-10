// Requires verify-web Worker with only local mock receiver and Cloudflare test bindings.
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const b = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
const results = [];
try {
  for (const [route, id, redirect] of [['/', 'kontakt-form', '/podziekowanie-konsultacja'], ['/', 'newsletter-form', '/podziekowanie-newsletter'], ['/kontakt', 'kontakt-form', '/podziekowanie-konsultacja']]) {
    const p = await b.newPage(); const html = await (await p.goto(`http://127.0.0.1:8790${route}`)).text();
    const staticFields = await p.evaluate(({ html, id }) => { const doc = new DOMParser().parseFromString(html, 'text/html'); const form = doc.getElementById(id); return { total: form.querySelectorAll('[name]').length, hidden: form.querySelectorAll('[data-zaw-attribution-fields] input').length }; }, { html, id });
    const form = p.locator(`#${id}`);
    await form.scrollIntoViewIfNeeded();
    await p.waitForFunction((id) => Boolean(document.querySelector(`#${id} [name=cf-turnstile-response]`)?.value), id);
    const before = await form.evaluate((f) => ({ form: f.dataset.form, fields: Array.from(f.querySelectorAll('[name]')).map((e) => e.name).filter((n) => n !== 'cf-turnstile-response'), hiddenAttribution: f.querySelectorAll('[data-zaw-attribution-fields] input').length, widgetHeight: f.querySelector('.cf-turnstile').getBoundingClientRect().height, newsletterType: f.querySelector('[name=newsletter]').type }));
    if (staticFields.hidden !== 32 || before.widgetHeight !== 0) throw new Error('Attribution or widget visibility regression');
    await form.getByRole('textbox', { name: /E-mail|Adres e-mail/ }).fill('t31-proof@example.com');
    const [response] = await Promise.all([p.waitForResponse((r) => r.url().includes('/api/form?')), form.getByRole('button', { name: /Wyślij zapytanie|Zapisuję się/ }).click()]);
    if (response.status() !== 303) throw new Error(`${id} returned ${response.status()}: ${await response.text()}`);
    await p.waitForURL(`**${redirect}`);
    results.push({ route, staticFields, ...before, status: response.status(), redirect: new URL(p.url()).pathname });
    await p.close();
  }
  const p = await b.newPage(); await p.goto('http://127.0.0.1:8790/');
  await p.locator('#newsletter-email').fill('t31-proof@example.com');
  await p.locator('#newsletter-form').evaluate((form) => { form.action = '/api/form?form=nope'; form.requestSubmit(); });
  await p.waitForFunction(() => document.querySelector('#newsletter-form .status')?.textContent === 'Nieznany formularz.');
  results.push({ case: 'unknown form', statusText: await p.locator('#newsletter-form .status').textContent(), buttonEnabled: await p.locator('#newsletter-form button').isEnabled(), stayedOnPage: new URL(p.url()).pathname === '/' });
  const negative = await p.request.post('http://127.0.0.1:8790/api/form?form=newsletter', { form: { email: 't31-proof@example.com', newsletter: 'on' } });
  if (negative.status() !== 403) throw new Error('Turnstile protection lost');
  results.push({ case: 'missing Turnstile token', status: negative.status() });
  await fs.writeFile(new URL('./section-forms-proof.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
} finally { await b.close(); }
