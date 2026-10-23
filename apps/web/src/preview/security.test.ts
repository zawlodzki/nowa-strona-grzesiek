import assert from 'node:assert/strict';
import test from 'node:test';
import { servePreview, readEnvironment } from './security.ts';

const bindings = {
  SANITY_API_READ_TOKEN: 'test-server-token', SANITY_DATASET: 'development',
  SANITY_STUDIO_URL: 'https://studio.example.com', PREVIEW_AUTH_USER: 'editor', PREVIEW_AUTH_PASSWORD: 'test-password',
};
const request = (path = '/', init: RequestInit = {}) => new Request(`https://preview.example.com${path}`, init);
const auth = { Authorization: `Basic ${btoa('editor:test-password')}` };
function privateHeaders(response: Response) {
  assert.match(response.headers.get('cache-control') ?? '', /private, no-store/);
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/);
  assert.equal(response.headers.get('vary'), 'Authorization, Cookie');
}

test('missing or invalid configuration fails closed before rendering', async () => {
  for (const config of [{}, { ...bindings, SANITY_API_READ_TOKEN: '' }, { ...bindings, SANITY_STUDIO_URL: 'javascript:bad' }]) {
    let called = false;
    const response = await servePreview(request('/', {headers: auth}), config, async () => { called = true; return new Response('draft'); });
    assert.equal(response.status, 503);
    assert.equal(called, false);
    privateHeaders(response);
  }
  assert.ok(readEnvironment(bindings));
});

test('every unauthenticated URL including assets is rejected before rendering', async () => {
  for (const path of ['/', '/_astro/page.js', '/blog/draft', '/api/form']) {
    for (const authorization of [undefined, 'Basic !!!', `Basic ${btoa('editor:wrong')}`]) {
      let called = false;
      const response = await servePreview(request(path, {headers: authorization ? {Authorization: authorization} : {}}), bindings, async () => { called = true; return new Response('draft'); });
      assert.equal(response.status, 401);
      assert.equal(called, false);
      assert.match(response.headers.get('www-authenticate') ?? '', /Basic/);
      privateHeaders(response);
    }
  }
});

test('robots disallows the entire site without authentication', async () => {
  const response = await servePreview(request('/robots.txt'), bindings, async () => { throw new Error('must not run'); });
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'User-agent: *\nDisallow: /\n');
  privateHeaders(response);
});

test('successful, missing and failed pages keep private headers and allow only Studio framing', async () => {
  for (const status of [200, 404, 422]) {
    const response = await servePreview(request('/', {headers: auth}), bindings, async () => new Response('page', {status}));
    assert.equal(response.status, status);
    assert.equal(response.headers.get('content-security-policy'), "frame-ancestors 'self' https://studio.example.com");
    privateHeaders(response);
  }
  const response = await servePreview(request('/', {headers: auth}), bindings, async () => { throw new Error(bindings.SANITY_API_READ_TOKEN); });
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes(bindings.SANITY_API_READ_TOKEN), false);
  privateHeaders(response);
});

test('preview refuses form submissions before any side effect', async () => {
  const response = await servePreview(request('/api/form', {method: 'POST', headers: auth}), bindings, async () => { throw new Error('must not run'); });
  assert.equal(response.status, 405);
  privateHeaders(response);
});
