import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviewSession, hasPreviewSession, previewRedirect, sessionCookieName } from './session.ts';
import { servePreview } from './security.ts';

const env = {
  SANITY_API_READ_TOKEN: 'test-server-token', SANITY_DATASET: 'development',
  SANITY_STUDIO_URL: 'https://studio.example.com', PREVIEW_AUTH_USER: 'editor', PREVIEW_AUTH_PASSWORD: 'test-password',
};
const now = Date.parse('2026-10-22T12:00:00Z');
const request = (cookie = '', origin = 'https://preview.example.com') => new Request(`${origin}/blog/draft`, { headers: { Cookie: cookie } });

test('session is signed, expires after one hour and cannot cross origin or dataset', async () => {
  const cookie = await createPreviewSession(request(), env, now);
  assert.match(cookie, /Path=\/; Max-Age=3600; HttpOnly; Secure; SameSite=None; Partitioned$/);
  assert.equal(await hasPreviewSession(request(cookie), env, now), true);
  assert.equal(await hasPreviewSession(request(cookie), env, now + 3599000), true);
  assert.equal(await hasPreviewSession(request(cookie), env, now + 3600000), false);
  assert.equal(await hasPreviewSession(request(cookie), env, now - 1000), false);
  assert.equal(await hasPreviewSession(request(cookie, 'https://another.example.com'), env, now), false);
  assert.equal(await hasPreviewSession(request(cookie), { ...env, SANITY_DATASET: 'production' }, now), false);
  assert.equal(await hasPreviewSession(request(cookie), { ...env, PREVIEW_AUTH_PASSWORD: 'rotated' }, now), false);
});

test('tampered, malformed and duplicate sessions fail closed', async () => {
  const cookie = (await createPreviewSession(request(), env, now)).split(';')[0]!;
  const tampered = cookie.replace(/\.([A-Za-z0-9_-])/, (_, character) => character === 'A' ? '.B' : '.A');
  const changedExpiry = cookie.replace(/=([0-9]+)/, (_, expires) => `=${Number(expires) - 1}`);
  for (const value of ['', `${sessionCookieName}=invalid`, cookie.replace(/.$/, '!'), tampered, changedExpiry, cookie.replace(/=./, '=0'), `${cookie}; ${cookie}`]) {
    assert.equal(await hasPreviewSession(request(value), env, now), false);
  }
});

test('cookie authorizes protected pages and assets and missing configuration still fails closed', async () => {
  const cookie = await createPreviewSession(request(), env);
  for (const path of ['/', '/_astro/script.js', '/blog/draft']) {
    const incoming = new Request(`https://preview.example.com${path}`, { headers: { Cookie: cookie } });
    const response = await servePreview(incoming, env, async () => new Response('protected'));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), 'protected');
    assert.equal((await servePreview(incoming, { ...env, PREVIEW_AUTH_PASSWORD: '' }, async () => new Response('leak'))).status, 503);
  }
});

test('only the exact GET enable endpoint reaches its own secret validation without Basic auth', async () => {
  const render = async () => new Response('Invalid preview authorization.', { status: 401 });
  const response = await servePreview(new Request('https://preview.example.com/api/preview'), env, render);
  assert.equal(response.status, 401);
  assert.equal(response.headers.has('www-authenticate'), false);
  for (const path of ['/api/preview/', '/api/preview/other']) {
    const response = await servePreview(new Request(`https://preview.example.com${path}`), env, render);
    assert.equal(response.headers.has('www-authenticate'), true);
  }
  for (const method of ['POST', 'HEAD', 'PUT']) {
    const response = await servePreview(new Request('https://preview.example.com/api/preview', { method }), env, async () => { throw new Error('must not render'); });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET');
  }
});

test('redirect accepts local paths and rejects foreign, ambiguous and encoded boundaries', () => {
  const incoming = request();
  for (const value of ['/', '/blog/draft', '/blog/draft?view=mobile#section']) assert.equal(previewRedirect(value, incoming), value);
  for (const value of ['https://evil.example/', 'https://preview.example.com/blog', '//evil.example', '/\\evil.example', '/%5cevil.example', '/%2f%2fevil.example', '/%252f%252fevil.example', '/%0d%0aLocation:evil', '/bad path', '/%zz', '/api/preview?again=1']) {
    assert.equal(previewRedirect(value, incoming), undefined, value);
  }
});
