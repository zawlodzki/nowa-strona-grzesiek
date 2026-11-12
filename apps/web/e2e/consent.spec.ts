import { expect, rejectOptionalConsent, test } from './fixtures';
import { CONSENT_ORIGIN, GTM_CONTAINER } from './env';

const LOADER = `${CONSENT_ORIGIN}/assets/cmp-v1.js`;
// GTM is a `necessary` script with alwaysLoad and fires tags on `consent-update` (lanes/tracking/out/consent-qa.md).
// It is the only third-party request allowed before a choice. The guard aborts it, so no tag runs in CI.
const GTM_SCRIPT = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER}`;
const DENIED = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

function dataLayer() {
  return (window as unknown as { dataLayer: ArrayLike<unknown>[] }).dataLayer.map((entry) => Array.from(entry));
}

test('first visit: Consent Mode v2 denies analytics and ads before the loader, and only GTM is requested', async ({ page, outbound, context }) => {
  const c15t = page.waitForRequest(`${CONSENT_ORIGIN}/api/c15t/init`);
  await page.goto('/');

  const order = await page.evaluate((loader) => {
    const inline = document.getElementById('zawlodzki-consent-default');
    const loaders = [...document.scripts].filter((script) => script.src.startsWith(loader));
    return {
      loaders: loaders.length,
      inlineFirst: !!inline && loaders.length > 0 && !!(inline.compareDocumentPosition(loaders[0]) & Node.DOCUMENT_POSITION_FOLLOWING),
    };
  }, LOADER);
  expect(order).toEqual({ loaders: 1, inlineFirst: true });

  await c15t;
  await expect(page.getByTestId('consent-banner-card')).toBeVisible();
  const events = await page.evaluate(dataLayer);
  expect(events[0]).toEqual(['consent', 'default', expect.objectContaining(DENIED)]);
  expect(events.some(([command, kind]) => command === 'consent' && kind === 'update')).toBe(false);

  await page.waitForLoadState('networkidle');
  expect(outbound.blocked).toEqual([GTM_SCRIPT]);
  expect(await context.cookies()).toEqual([]);
});

test('rejecting optional consent keeps analytics and ads denied and requests nothing new', async ({ page, outbound, context }) => {
  await page.goto('/');
  await rejectOptionalConsent(page);
  await page.waitForLoadState('networkidle');

  const updates = (await page.evaluate(dataLayer)).filter(([command, kind]) => command === 'consent' && kind === 'update');
  for (const [, , state] of updates) expect(state).toEqual(expect.objectContaining(DENIED));
  expect(outbound.blocked).toEqual([GTM_SCRIPT]);
  const cookies = (await context.cookies()).map((cookie) => cookie.name);
  expect(cookies.filter((name) => /^(_ga|_gcl|_fbp|_clck|_clsk|_uet)/.test(name))).toEqual([]);
});
