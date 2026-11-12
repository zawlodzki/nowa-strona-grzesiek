import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from './index.ts';
import { renderRobots } from '../pages/sitemap/_render.ts';

for (const host of ['www.zawlodzki.pl', 'localhost:8791', 'zawlodzki.pl', 'zawlodzki-web.zawlodzki.workers.dev', 'preview.example.com']) {
  test(`Worker robots policy for Host ${host}`, async () => {
    let assetCalls = 0;
    const env = { ASSETS: { fetch: async () => {
      assetCalls++;
      return new Response(renderRobots(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    } } };
    // Wrangler maps the incoming Host header into the request URL.
    const request = new Request(`http://${host}/robots.txt`, { headers: { Host: host } });
    const response = await worker.fetch(request, env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    if (host === 'www.zawlodzki.pl') {
      assert.equal(await response.text(), renderRobots());
      assert.equal(response.headers.get('X-Robots-Tag'), null);
      assert.equal(assetCalls, 1);
    } else {
      const body = await response.text();
      assert.equal(body, 'User-agent: *\nDisallow: /\n');
      assert.doesNotMatch(body, /Sitemap:/i);
      assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
      assert.equal(assetCalls, 0);
    }
  });
}

test('other routes still use assets and retain the staging header', async () => {
  const response = await worker.fetch(new Request('http://localhost:8791/favicon.svg'), {
    ASSETS: { fetch: async () => new Response('asset') },
  });
  assert.equal(await response.text(), 'asset');
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});
