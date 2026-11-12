import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownResponse } from './markdown.ts';
const assets = { fetch: async () => new Response('# Page', { headers: { 'Content-Type': 'text/plain' } }) };
test('Markdown assets get content type and production noindex', async () => {
  const response = await markdownResponse(new Request('https://www.zawlodzki.pl/page.md'), assets);
  assert.equal(response?.status, 200);
  assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  assert.equal(await response.text(), '# Page');
});
test('slash normalization preserves query and bypasses asset canonicalization', async () => {
  const response = await markdownResponse(new Request('https://example.com/page.md/?x=1'), { fetch: async () => { throw Error('must not fetch'); } });
  assert.equal(response?.status, 301);
  assert.equal(response.headers.get('Location'), 'https://example.com/page.md?x=1');
});
test('HTML routing stays outside Markdown helper and unknown assets stay 404', async () => {
  assert.equal(await markdownResponse(new Request('https://example.com/page'), assets), undefined);
  const response = await markdownResponse(new Request('https://example.com/unknown.md'), { fetch: async () => new Response('Not found', { status: 404 }) });
  assert.equal(response?.status, 404);
});
