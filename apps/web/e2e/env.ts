import { fileURLToPath } from 'node:url';

// Ports stay clear of verify-web (8790-8791) so both can run side by side.
export const WORKER_PORT = 8793;
export const BASE_URL = `http://127.0.0.1:${WORKER_PORT}`;
// .wrangler/ is gitignored, so reports, traces and payloads never end up in a commit.
export const OUT_DIR = fileURLToPath(new URL('../.wrangler/e2e', import.meta.url));
export const MOCK_N8N = { port: 8794, url: 'http://127.0.0.1:8794/webhook/mock', file: `${OUT_DIR}/payloads.jsonl` };

// Cloudflare's published always-pass Turnstile test secret, the pair of the site key a build gets without PUBLIC_TURNSTILE_SITE_KEY.
export const TURNSTILE_PASS_SECRET = '1x0000000000000000000000000000000AA';

// Host of the live n8n webhook (migration/PLAN.md). Tests must never reach it.
export const PRODUCTION_N8N_HOST = 'flows.zawlodzki.com';

export const CONSENT_ORIGIN = 'https://consent.zawlodzki.com';
// The only origins a test page may reach besides the Worker: content images, the consent loader and Turnstile.
export const ALLOWED_ORIGINS = new Set([BASE_URL, 'https://cdn.sanity.io', CONSENT_ORIGIN, 'https://challenges.cloudflare.com']);

export const GTM_CONTAINER = 'GTM-P5V3CJ5';
