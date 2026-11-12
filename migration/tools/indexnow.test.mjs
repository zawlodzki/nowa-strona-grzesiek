import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INDEXNOW_KEY, keyResponse } from '../../apps/web/src/lib/indexnow.mjs';
import { payloadFor, deployedUrls, submit } from './indexnow.mjs';

const urls = ['https://www.zawlodzki.pl/blog/test', 'https://www.zawlodzki.pl/'];
const enabled = { INDEXNOW_ENABLED: '1', INDEXNOW_DEPLOYMENT: 'production', INDEXNOW_HOST: 'www.zawlodzki.pl', WORKERS_CI: '1', WORKERS_CI_BRANCH: 'main' };

test('key response contains the stable configured key', async () => {
  const response = keyResponse();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await response.text(), INDEXNOW_KEY);
});

test('built sitemap fixture selects rebuilt pages; dry run sends nothing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'indexnow-'));
  try {
    await writeFile(join(dir, 'sitemap.xml'), '<sitemapindex><sitemap><loc>https://www.zawlodzki.pl/sitemap-pl.xml</loc></sitemap></sitemapindex>');
    await writeFile(join(dir, 'sitemap-pl.xml'), `<urlset>${urls.map((u) => `<url><loc>${u}</loc></url>`).join('')}</urlset>`);
    let output;
    await submit(payloadFor(await deployedUrls(dir)), { dryRun: true, env: {}, print: (s) => { output = s; }, fetchImpl: () => assert.fail('network on dry run') });
    assert.deepEqual(JSON.parse(output), { host: 'www.zawlodzki.pl', key: INDEXNOW_KEY, keyLocation: `https://www.zawlodzki.pl/${INDEXNOW_KEY}.txt`, urlList: [...urls].sort() });
  } finally { await rm(dir, { recursive: true }); }
});

test('all unsafe environments refuse before HTTP', async () => {
  for (const override of [{ INDEXNOW_ENABLED: undefined }, { INDEXNOW_ENABLED: 'true' }, { INDEXNOW_DEPLOYMENT: 'staging' }, { INDEXNOW_DEPLOYMENT: 'local' }, { INDEXNOW_HOST: 'localhost' }, { INDEXNOW_HOST: 'preview.zawlodzki.pl' }, { WORKERS_CI: undefined }, { WORKERS_CI_BRANCH: 'feature/test' }, { GITHUB_ACTIONS: 'true' }, { NODE_ENV: 'test' }]) {
    await assert.rejects(submit(payloadFor(urls), { env: { ...enabled, ...override }, fetchImpl: () => assert.fail('network on refused run') }), /refused/);
  }
  for (const url of ['http://localhost:8790/', 'https://preview.zawlodzki.pl/', 'https://www.zawlodzki.pl/?q=1']) assert.throws(() => payloadFor([url]), /production URL/);
  assert.throws(() => payloadFor([]));
});

test('mock records POST and failures propagate without retry', async () => {
  const requests = [];
  let status = 202;
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    requests.push({ method: req.method, body: JSON.parse(body), type: req.headers['content-type'] });
    res.writeHead(status).end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const fetchImpl = (endpoint, options) => {
      assert.equal(endpoint, 'https://api.indexnow.org/indexnow');
      return fetch(`http://127.0.0.1:${server.address().port}/indexnow`, options);
    };
    await submit(payloadFor(urls), { env: enabled, fetchImpl, print: () => {} });
    assert.deepEqual(requests[0], { method: 'POST', body: payloadFor(urls), type: 'application/json' });
    status = 429;
    await assert.rejects(submit(payloadFor(urls), { env: enabled, fetchImpl }), /429/);
    assert.equal(requests.length, 2);
  } finally { await new Promise((r) => server.close(r)); }
});
