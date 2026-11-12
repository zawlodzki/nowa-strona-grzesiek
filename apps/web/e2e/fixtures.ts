import { readFileSync } from 'node:fs';
import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import { ALLOWED_ORIGINS, CONSENT_ORIGIN, MOCK_N8N, PRODUCTION_N8N_HOST } from './env';

export type OutboundLog = { n8n: string[]; blocked: string[] };

// Every request off the Worker is aborted unless its origin is allowed. Analytics never leave CI,
// and the c15t backend, which answers 403 to origins it does not know, is replaced by a 503 that sends the loader offline.
export async function guardOutbound(context: BrowserContext): Promise<OutboundLog> {
  const log: OutboundLog = { n8n: [], blocked: [] };
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === PRODUCTION_N8N_HOST) {
      log.n8n.push(url.href);
      return route.abort('blockedbyclient');
    }
    if (url.origin === CONSENT_ORIGIN && url.pathname.startsWith('/api/c15t/')) return route.fulfill({ status: 503 });
    if (ALLOWED_ORIGINS.has(url.origin)) return route.continue();
    log.blocked.push(url.href);
    return route.abort('blockedbyclient');
  });
  return log;
}

export const test = base.extend<{ outbound: OutboundLog }>({
  outbound: [
    async ({ context }, use) => {
      const log = await guardOutbound(context);
      await use(log);
      expect(log.n8n, `requests to ${PRODUCTION_N8N_HOST}`).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export type Delivery = {
  path: string;
  contentType: string;
  body: { triggerType: string; payload: { name: string; data: Record<string, string>; schema: { fieldName: string; fieldType: string }[] } };
};

export function deliveries(): Delivery[] {
  let lines: string;
  try {
    lines = readFileSync(MOCK_N8N.file, 'utf8');
  } catch {
    return [];
  }
  return lines.split('\n').filter(Boolean).map((line) => JSON.parse(line));
}

// The c15t banner is a modal over the page. A visitor answers it first, so the tests do too, with the choice that keeps consent denied.
export async function rejectOptionalConsent(page: Page) {
  await page.getByTestId('consent-banner-reject-button').click();
  await expect(page.getByTestId('consent-banner-card')).toBeHidden();
}
