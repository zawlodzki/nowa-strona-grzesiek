// Captures T87 evidence from a running Worker: element screenshots, layout measurements,
// a keyboard pass, the empty-submit error state and one real submit to a local n8n stub.
// Usage, from the repo root:
//   node migration/lanes/web/out/t87-contact-form/capture.mjs --base http://127.0.0.1:8790 --phase after --out <dir>
//   node migration/lanes/web/out/t87-contact-form/capture.mjs --diff <before.jsonl> <after.jsonl>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  options: { base: { type: 'string' }, phase: { type: 'string' }, out: { type: 'string' }, diff: { type: 'boolean' } },
  allowPositionals: true,
});

if (values.diff) {
  const last = (file) => JSON.parse(readFileSync(file, 'utf8').trim().split('\n').at(-1)).body.payload;
  const [before, after] = positionals.map(last);
  const keys = (payload) => Object.keys(payload.data);
  const report = {
    before: { name: before.name, count: keys(before).length },
    after: { name: after.name, count: keys(after).length },
    onlyBefore: keys(before).filter((k) => !keys(after).includes(k)),
    onlyAfter: keys(after).filter((k) => !keys(before).includes(k)),
    sameOrder: JSON.stringify(keys(before)) === JSON.stringify(keys(after)),
  };
  report.identical = report.before.name === report.after.name && report.onlyBefore.length === 0 && report.onlyAfter.length === 0 && report.sameOrder;
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.identical ? 0 : 1);
}

const { chromium } = createRequire(new URL('../../../../../apps/web/package.json', import.meta.url))('@playwright/test');
const { base, phase, out } = values;
mkdirSync(out, { recursive: true });

const CONTACT = [['home', '/'], ['kontakt', '/kontakt'], ['service', '/szkolenie-i-wdrozenie-pipedrive']];
const NEWSLETTER = [['home-band', '/'], ['newsletter', '/newsletter']];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome' });
const results = { phase, shots: [], measures: {}, keyboard: [], error: null, submit: null };

async function open(path, width) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, locale: 'pl-PL' });
  await page.goto(base + path);
  const reject = page.getByTestId('consent-banner-reject-button');
  await reject.click({ timeout: 5000 }).catch(() => {});
  await page.getByTestId('consent-banner-card').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  await page.addStyleTag({ content: 'body > header, .site-header { position: static !important; }' });
  return page;
}

async function shoot(page, selector, file) {
  const el = page.locator(selector).first();
  await el.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await el.screenshot({ path: `${out}/${file}`, animations: 'disabled' });
  results.shots.push(file);
}

for (const [name, path] of CONTACT) {
  for (const width of [390, 768, 1440]) {
    const page = await open(path, width);
    await shoot(page, 'section.contact', `${phase}-contact-${name}-w${width}.png`);
    results.measures[`contact-${name}-w${width}`] = await page.evaluate(() => {
      const box = (el) => el && el.getBoundingClientRect();
      const section = document.querySelector('section.contact');
      const head = box(section.querySelector('.head'));
      const card = box(section.querySelector('.card'));
      const check = box(section.querySelector('.check'));
      const checkbox = box(section.querySelector('.check input'));
      const portrait = section.querySelector('.portrait');
      const details = section.querySelector('.details h3');
      const button = section.querySelector('button[type="submit"]');
      const style = button && getComputedStyle(button);
      const headText = section.querySelector('.head > *');
      const pageEdge = box(document.querySelector('main section.hero .content, main h1') ?? section);
      return {
        headLeft: head && Math.round(head.left),
        headTextAlign: headText && getComputedStyle(headText).textAlign,
        cardLeft: card && Math.round(card.left),
        checkRowHeight: check && Math.round(check.height),
        checkboxSize: checkbox && `${Math.round(checkbox.width)}x${Math.round(checkbox.height)}`,
        portrait: portrait && { size: `${Math.round(box(portrait).width)}x${Math.round(box(portrait).height)}`, radius: getComputedStyle(portrait).borderRadius, besideHeading: Math.abs(box(portrait).top - box(details).top) < box(portrait).height && box(portrait).right <= box(details).left },
        visibleLabels: [...section.querySelectorAll('.field > label')].map((l) => ({ text: l.textContent.trim(), visible: box(l).width > 1 })),
        placeholders: [...section.querySelectorAll('.field > :is(input, textarea)')].map((i) => i.placeholder),
        submit: style && { height: Math.round(box(button).height), weight: style.fontWeight, radius: style.borderRadius, arrow: Boolean(button.querySelector('svg')) },
        pageEdgeLeft: Math.round(pageEdge.left),
      };
    });
    await page.close();
  }
}

for (const [name, path] of NEWSLETTER) {
  for (const width of [390, 1440]) {
    const page = await open(path, width);
    await shoot(page, 'section.newsletter', `${phase}-newsletter-${name}-w${width}.png`);
    await page.close();
  }
}

{
  const page = await open('/kontakt', 390);
  const form = page.locator('form[data-form="main-contact"]');
  await form.locator('input[name="email"]').focus();
  for (let i = 0; i < 8; i += 1) {
    results.keyboard.push(await page.evaluate(() => {
      const el = document.activeElement;
      const style = getComputedStyle(el);
      return {
        control: el.getAttribute('name') ?? el.textContent.trim().slice(0, 40),
        tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type'),
        accessibleLabel: el.labels?.[0]?.textContent.trim() ?? el.getAttribute('aria-label') ?? null,
        focusVisible: el.matches(':focus-visible'),
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
      };
    }));
    await page.keyboard.press('Tab');
  }
  await page.close();
}

{
  const page = await open('/kontakt', 390);
  const form = page.locator('form[data-form="main-contact"]');
  await form.locator('button[type="submit"]').click();
  await page.waitForTimeout(300);
  await shoot(page, 'form[data-form="main-contact"]', `${phase}-contact-error-w390.png`);
  results.error = await page.evaluate(() => {
    const input = document.querySelector('form[data-form="main-contact"] input[name="email"]');
    const described = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent.trim());
    return {
      focused: document.activeElement === input,
      ariaInvalid: input.getAttribute('aria-invalid'),
      describedBy: described,
      borderColor: getComputedStyle(input).borderColor,
    };
  });
  await page.close();
}

{
  const page = await open('/kontakt', 1440);
  const form = page.locator('form[data-form="main-contact"]');
  await form.locator('input[name="email"]').fill(`t87-${phase}@example.com`);
  await form.locator('input[name="phone"]').fill('600100200');
  await form.locator('textarea[name="message"]').fill(`T87 ${phase} payload check`);
  await form.locator('input[name="newsletter"]').check();
  await form.locator('button[type="submit"]').click();
  await page.waitForURL('**/podziekowanie-konsultacja', { timeout: 20000 });
  results.submit = { landed: new URL(page.url()).pathname };
  await page.close();
}

await browser.close();
writeFileSync(`${out}/${phase}-results.json`, `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({ ...results, shots: results.shots.length }, null, 2));
