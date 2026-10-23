import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';

test('canonical sitemap and page links are fetched only from the target origin', async (t) => {
  const requests = [];
  const bodies = new Map([
    ['/sitemap.xml', '<sitemapindex><sitemap><loc>https://canonical.invalid/sitemap-pl.xml</loc></sitemap></sitemapindex>'],
    ['/sitemap-pl.xml', '<urlset><url><loc>https://canonical.invalid/kept</loc></url><url><loc>https://external.invalid/excluded</loc></url></urlset>'],
    ['/', '<html><head><title>Home</title></head><body><h1>Home</h1><a href="https://canonical.invalid/deep">Deep</a></body></html>'],
    ['/kept', '<html><head><title>Kept</title></head><body><h1>Kept</h1></body></html>'],
    ['/deep', '<html><head><title>Deep</title></head><body><h1>Deep</h1></body></html>'],
  ]);
  const server = createServer((request, response) => {
    requests.push(request.url);
    const body = bodies.get(request.url);
    response.writeHead(body ? 200 : 404, { 'content-type': request.url.endsWith('.xml') ? 'application/xml' : 'text/html' });
    response.end(body ?? 'Not found');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const scratch = await mkdtemp(join(tmpdir(), 'crawl-target-'));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(scratch, { recursive: true, force: true });
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  await promisify(execFile)(process.execPath, ['migration/tools/crawl.mjs', '--origin', origin, '--canonical-origin', 'https://canonical.invalid', '--out', scratch]);
  const records = JSON.parse(await readFile(join(scratch, 'urls.json'), 'utf8'));
  assert.deepEqual(records.map((record) => new URL(record.url).pathname).sort(), ['/', '/deep', '/kept']);
  assert.ok(records.every((record) => new URL(record.url).origin === origin && record.status === 200));
  assert.equal(records.find((record) => record.url.endsWith('/kept')).inSitemap, true);
  assert.ok(requests.includes('/sitemap-pl.xml'));
  assert.ok(!requests.includes('/excluded'));
});
