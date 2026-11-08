import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const origin = process.env.PREVIEW_ORIGIN || 'http://127.0.0.1:8791';
const config = process.env.PREVIEW_ENV_FILE ? parseEnv(await readFile(process.env.PREVIEW_ENV_FILE, 'utf8')) : process.env;
assert.ok(config.PREVIEW_AUTH_USER && config.PREVIEW_AUTH_PASSWORD, 'Provide local preview credentials through PREVIEW_ENV_FILE or environment.');
const authorization = `Basic ${Buffer.from(`${config.PREVIEW_AUTH_USER}:${config.PREVIEW_AUTH_PASSWORD}`).toString('base64')}`;
const get = (path, authenticated = false, options = {}) => fetch(new URL(path, origin), {redirect: 'manual', ...options, headers: {...(authenticated ? {Authorization: authorization} : {}), ...options.headers}});
function privateHeaders(response) {
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
  assert.match(response.headers.get('cache-control') || '', /private, no-store/);
}
async function probe(path, status, authenticated = false, options) {
  const response = await get(path, authenticated, options);
  assert.equal(response.status, status, `${path} status`);
  privateHeaders(response);
  console.log(`${authenticated ? 'authorized' : 'anonymous'} ${options?.method || 'GET'} ${path} ${status} noindex private,no-store`);
  return response;
}
await probe('/', 401);
const invalidSession = await probe('/api/preview', 401);
assert.equal(invalidSession.headers.has('www-authenticate'), false);
await probe('/api/preview?sanity-preview-secret=invalid&sanity-preview-pathname=%2F%2Fevil.example', 400);
const robots = await probe('/robots.txt', 200);
assert.match(await robots.text(), /Disallow: \//);
const home = await probe('/', 200, true);
const html = await home.text();
assert.match(html, /<meta name="robots" content="noindex/);
const asset = html.match(/<script[^>]*src="(\/_astro\/[^" ]+)"/u)?.[1];
assert.ok(asset, 'Rendered page references a built asset.');
await probe(asset, 401);
const script = await probe(asset, 200, true);
if (config.SANITY_API_READ_TOKEN) {
  assert.equal(html.includes(config.SANITY_API_READ_TOKEN), false, 'Read token is absent from rendered HTML.');
  assert.equal((await script.text()).includes(config.SANITY_API_READ_TOKEN), false, 'Read token is absent from browser JavaScript.');
}
await probe('/t19-missing-route', 404, true);
await probe('/BLOG', 404, true);
await probe('/api/form', 405, true, {method: 'POST'});
const head = await probe('/', 200, true, {method: 'HEAD'});
assert.equal(await head.text(), '');
console.log('Running preview Worker checks passed.');
