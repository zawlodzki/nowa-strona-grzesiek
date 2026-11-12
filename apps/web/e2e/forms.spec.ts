import { deliveries, expect, guardOutbound, rejectOptionalConsent, test } from './fixtures';
import { PRODUCTION_N8N_HOST } from './env';

// Only this file submits forms. Its tests run in order in one worker, so the receiver's line count is exact.
test.describe.configure({ mode: 'default' });

// The fields the n8n flow reads besides the visible ones. Renaming one silently breaks lead attribution.
const ATTRIBUTION_FIELDS = [
  'first_touch_source', 'first_touch_medium', 'first_touch_campaign', 'first_touch_content', 'first_touch_landing_page',
  'first_touch_referrer_domain', 'first_touch_timestamp', 'last_touch_source', 'last_touch_medium', 'last_touch_campaign',
  'last_touch_content', 'last_touch_landing_page', 'last_touch_referrer_domain', 'last_touch_timestamp', 'utm_id', 'utm_term',
  'previous_page', 'current_page', 'cta_id', 'form_name', 'session_page_count', 'conversion_timestamp', 'gclid', 'gbraid',
  'wbraid', 'msclkid', 'fbclid', 'li_fat_id', 'attribution_measurement_consent', 'attribution_marketing_consent',
  'attribution_policy_id', 'attribution_schema_version',
];

// Webflow form names and thank-you paths the n8n flow and the live site already use.
const FORMS = [
  { key: 'main-contact', page: '/kontakt', webflowName: 'main-contact-form', thanks: '/podziekowanie-konsultacja' },
  { key: 'newsletter', page: '/kontakt', webflowName: 'Newsletter bottom CTA form', thanks: '/podziekowanie-newsletter' },
];

for (const form of FORMS) {
  test(`${form.key} form delivers the Webflow envelope to n8n and lands on the thank-you page`, async ({ page }) => {
    const email = `e2e-${form.key}-${Date.now()}@example.com`;
    await page.goto(form.page);
    await rejectOptionalConsent(page);
    const el = page.locator(`form[data-form="${form.key}"]`);
    await expect(el.locator('[name="cf-turnstile-response"]')).toHaveValue(/.+/);
    await el.locator('input[name="email"]').fill(email);
    await el.locator('button[type="submit"]').click();

    await page.waitForURL(form.thanks);
    await expect.poll(() => deliveries().filter((d) => d.body.payload.data.email === email)).toHaveLength(1);
    const [{ body, contentType }] = deliveries().filter((d) => d.body.payload.data.email === email);
    expect(contentType).toBe('application/json');
    expect(body.triggerType).toBe('form_submission');
    expect(body.payload.name).toBe(form.webflowName);
    for (const field of ATTRIBUTION_FIELDS) expect(typeof body.payload.data[field], field).toBe('string');
    expect(body.payload.schema.map((f) => f.fieldName)).toEqual(Object.keys(body.payload.data));
  });

  for (const [label, value] of [['empty', ''], ['invalid', 'not-an-email']]) {
    test(`${form.key} form with an ${label} e-mail posts nothing`, async ({ page }) => {
      const posts: string[] = [];
      page.on('request', (request) => new URL(request.url()).pathname === '/api/form' && posts.push(request.url()));
      const before = deliveries().length;
      await page.goto(form.page);
      await rejectOptionalConsent(page);
      const el = page.locator(`form[data-form="${form.key}"]`);
      await el.locator('input[name="email"]').fill(value);
      await el.locator('button[type="submit"]').click();

      await expect(el.locator('input[name="email"]:invalid')).toHaveCount(1);
      await page.waitForTimeout(500);
      expect(posts).toEqual([]);
      expect(deliveries().length).toBe(before);
      expect(page.url()).toContain(form.page);
    });
  }
}

test(`the outbound guard stops and reports a request to ${PRODUCTION_N8N_HOST}`, async ({ browser }) => {
  const context = await browser.newContext();
  const log = await guardOutbound(context);
  const page = await context.newPage();
  await page.goto('/');
  const reached = await page.evaluate(
    (url) => fetch(url, { method: 'POST', mode: 'no-cors', body: '{}' }).then(() => true, () => false),
    `https://${PRODUCTION_N8N_HOST}/webhook/e2e-guard-probe`,
  );
  await context.close();
  expect(reached).toBe(false);
  expect(log.n8n).toEqual([`https://${PRODUCTION_N8N_HOST}/webhook/e2e-guard-probe`]);
});
