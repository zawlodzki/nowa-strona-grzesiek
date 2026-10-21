// Run: node --test apps/web/src/worker/form.test.ts
import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { startMockReceiver } from './form-mock-receiver.mjs';
import { FORMS, handleForm } from './form.ts';

const PASS_TOKEN = 'human';
const realFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input);
  if (!url.startsWith('https://challenges.cloudflare.com/')) return realFetch(input, init);
  const token = (init?.body as FormData).get('response');
  return Response.json({ success: token === PASS_TOKEN });
};

let n8n: { url: string; received: { body: any }[]; close: () => Promise<void> };
let failingN8n: typeof n8n;
before(async () => {
  n8n = await startMockReceiver();
  failingN8n = await startMockReceiver({ status: 500 });
});
after(async () => {
  await n8n.close();
  await failingN8n.close();
});
beforeEach(() => (n8n.received.length = 0));

function submit(form: string, fields: Record<string, string>, webhook = n8n.url, method = 'POST') {
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) body.set(name, value);
  const request = new Request(`http://127.0.0.1/api/form?form=${form}`, method === 'POST' ? { method, body } : { method });
  return handleForm(request, { N8N_FORM_WEBHOOK: webhook, TURNSTILE_SECRET_KEY: 'test-secret' });
}

test('contact form forwards every Webflow field and redirects to the thank-you page', async () => {
  const response = await submit('landing-contact', {
    email: ' ola@example.com ',
    message: 'Wdrożenie Pipedrive',
    newsletter: 'on',
    gclid: 'abc123',
    'cf-turnstile-response': PASS_TOKEN,
    injected: 'dropped',
  });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), '/podziekowanie-konsultacja');

  assert.equal(n8n.received.length, 1);
  const { triggerType, payload } = n8n.received[0].body;
  assert.equal(triggerType, 'form_submission');
  assert.equal(payload.name, 'Landing Contact Form');
  assert.deepEqual(Object.keys(payload.data), FORMS['landing-contact'].fields.map(([name]) => name));
  assert.equal(Object.keys(payload.data).length, 37);
  assert.equal(payload.data.email, 'ola@example.com');
  assert.equal(payload.data.newsletter, 'true');
  assert.equal(payload.data['marketing-emails'], 'false');
  assert.equal(payload.data.gclid, 'abc123');
  assert.equal(payload.data.utm_id, '');
  assert.ok(!('cf-turnstile-response' in payload.data), 'turnstile token is not forwarded');
  assert.ok(!('injected' in payload.data), 'fields outside the form are not forwarded');
});

test('newsletter form redirects to the newsletter thank-you page', async () => {
  const response = await submit('newsletter', { email: 'ola@example.com', newsletter: 'on', 'cf-turnstile-response': PASS_TOKEN });
  assert.equal(response.headers.get('Location'), '/podziekowanie-newsletter');
  assert.equal(n8n.received[0].body.payload.name, 'Newsletter bottom CTA form');
  assert.equal(Object.keys(n8n.received[0].body.payload.data).length, 34);
});

test('failed or missing Turnstile is rejected and nothing reaches n8n', async () => {
  assert.equal((await submit('main-contact', { email: 'ola@example.com', 'cf-turnstile-response': 'bot' })).status, 403);
  assert.equal((await submit('main-contact', { email: 'ola@example.com' })).status, 403);
  assert.equal(n8n.received.length, 0);
});

test('invalid requests are rejected before n8n', async () => {
  assert.equal((await submit('main-contact', { email: 'not-an-email', 'cf-turnstile-response': PASS_TOKEN })).status, 400);
  assert.equal((await submit('unknown', { email: 'ola@example.com', 'cf-turnstile-response': PASS_TOKEN })).status, 404);
  assert.equal((await submit('main-contact', {}, n8n.url, 'GET')).status, 405);
  assert.equal(n8n.received.length, 0);
});

test('n8n failure is reported instead of the thank-you redirect', async () => {
  const response = await submit('main-contact', { email: 'ola@example.com', 'cf-turnstile-response': PASS_TOKEN }, failingN8n.url);
  assert.equal(response.status, 502);
  const unreachable = await submit('main-contact', { email: 'ola@example.com', 'cf-turnstile-response': PASS_TOKEN }, 'http://127.0.0.1:9/');
  assert.equal(unreachable.status, 502);
});
