import { writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';

test.use({ baseURL: process.env.SPECULATION_BASE_URL || 'http://127.0.0.1:8793' });

test('document rule is valid and consent defaults remain first', async ({ page }) => {
  await page.goto('/');
  const scripts = page.locator('script[type="speculationrules"]');
  await expect(scripts).toHaveCount(1);
  const rules = JSON.parse(await scripts.innerText());
  expect(rules.tag).toBe('zawlodzki-prefetch');
  expect(rules.prerender).toBeUndefined();
  expect(rules.prefetch).toHaveLength(1);
  expect(rules.prefetch[0].eagerness).toBe('moderate');
  expect(rules.prefetch[0].where.and).toContainEqual({ href_matches: '/*' });
  const exclusions = JSON.stringify(rules.prefetch[0].where);
  for (const value of ['/api/*', '/preview/*', '/_preview/*', '/*.md', '/*.txt', '/*.xml', 'nofollow', '_blank', 'download']) {
    expect(exclusions).toContain(value);
  }
  await expect(page.locator('head script').first()).toHaveAttribute('id', 'zawlodzki-consent-default');
});

test('Chrome hover prefetches HTML and excludes unsafe links', async ({ page, context }, testInfo) => {
  // CDP observes real browser requests; Playwright routing disables browser prefetch.
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setBlockedURLs', { urls: ['https://consent.zawlodzki.com/*', 'https://www.googletagmanager.com/*'] });
  const requests: { url: string; headers: Record<string, unknown> }[] = [];
  cdp.on('Network.requestWillBeSent', ({ request }) => requests.push({ url: request.url, headers: request.headers }));
  await page.goto('/');
  await page.evaluate(() => {
    const links = [
      ['/o-mnie?t120=allowed', {}],
      ['/api/form?form=main-contact', {}], ['/api/preview?secret=t120', {}],
      ['/preview/draft', {}], ['/_preview/draft', {}],
      ['/o-mnie.md?proof=1', {}], ['/llms.txt?proof=1', {}], ['/sitemap.xml?proof=1', {}],
      ['/kontakt?t120=nofollow', { rel: 'nofollow' }],
      ['/kontakt?t120=blank', { target: '_blank' }],
      ['/kontakt?t120=download', { download: '' }],
      ['https://example.com/t120', {}],
    ] as const;
    const box = document.createElement('div');
    box.id = 't120-links';
    box.style.cssText = 'position:fixed;top:0;left:0;z-index:999999;background:white';
    links.forEach(([href, attrs], i) => {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = 'T120 probe ' + i;
      a.id = 't120-' + i;
      for (const [key, value] of Object.entries(attrs)) a.setAttribute(key, value);
      box.append(a, document.createElement('br'));
    });
    document.body.append(box);
  });
  const prefetches = () => requests.filter((r) => Object.entries(r.headers).some(([key, value]) => key.toLowerCase() === 'sec-purpose' && String(value).includes('prefetch')));
  await page.locator('#t120-0').hover();
  await expect.poll(() => prefetches().some((r) => r.url.includes('t120=allowed'))).toBe(true);
  for (let i = 1; i < 12; i++) {
    await page.locator('#t120-' + i).hover();
    await page.waitForTimeout(500);
  }
  const proof = { excludedLinksHovered: 11, hoverWaitMs: 500, browser: context.browser()?.version(), prefetches: prefetches(), requests };
  const proofPath = testInfo.outputPath('chrome-network-proof.json');
  writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  await testInfo.attach('chrome-network-proof', { path: proofPath, contentType: 'application/json' });
  expect(prefetches().filter((r) => !r.url.includes('t120=allowed'))).toEqual([]);
});
