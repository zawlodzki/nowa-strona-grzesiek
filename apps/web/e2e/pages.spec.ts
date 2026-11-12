import { readFileSync, writeFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import type { APIRequestContext, TestInfo } from '@playwright/test';
import { expect, rejectOptionalConsent, test } from './fixtures';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const BASELINE_FILE = new URL('./axe-baseline.json', import.meta.url);
// Rule id to violating node count per page, as recorded by `pnpm e2e:axe-baseline`. Rules listed here are deferred, every other rule is enforced.
type Baseline = Record<string, Record<string, number>>;
const readBaseline = (): Baseline => JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
const baseline = readBaseline();

async function expectWithinBaseline(label: string, axe: AxeBuilder, testInfo: TestInfo) {
  const results = await axe.withTags(WCAG_TAGS).analyze();
  await testInfo.attach('axe-results', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  const found = Object.fromEntries(results.violations.map((rule) => [rule.id, rule.nodes.length]));
  if (process.env.AXE_RECORD) {
    writeFileSync(BASELINE_FILE, JSON.stringify({ ...readBaseline(), [label]: found }, null, 2) + '\n');
    return;
  }
  const deferred = baseline[label] ?? {};
  expect(Object.keys(found).filter((rule) => !(rule in deferred)), 'axe rules that passed when the baseline was recorded').toEqual([]);
}

// Content comes from the production dataset, so the post is whichever one the blog index links first.
async function firstPost(request: APIRequestContext) {
  const html = await (await request.get('/blog')).text();
  const slug = html.match(/href="(\/blog\/[a-z0-9-]+)"/)?.[1];
  if (!slug) throw new Error('/blog links no post');
  return slug;
}

const PAGES: { label: string; path: string | ((request: APIRequestContext) => Promise<string>) }[] = [
  { label: 'home', path: '/' },
  { label: 'service', path: '/audyt-sprzedazy' },
  { label: 'blog', path: '/blog' },
  { label: 'post', path: firstPost },
  { label: 'contact', path: '/kontakt' },
];

for (const { label, path } of PAGES) {
  test(`${label}: no axe violation outside the recorded baseline`, async ({ page, request }, testInfo) => {
    await page.goto(typeof path === 'string' ? path : await path(request));
    await rejectOptionalConsent(page);
    await expectWithinBaseline(label, new AxeBuilder({ page }), testInfo);
  });

  test(`${label}: no horizontal overflow at 320 px`, async ({ page, request }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(typeof path === 'string' ? path : await path(request));
    await rejectOptionalConsent(page);
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client);
  });
}

test('consent banner: axe violations stay within the recorded baseline', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByTestId('consent-banner-card')).toBeVisible();
  await expectWithinBaseline('consent-banner', new AxeBuilder({ page }).include('[data-testid="consent-banner-card"]'), testInfo);
});
