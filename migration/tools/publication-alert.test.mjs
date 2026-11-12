import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compare, monitor, send, types, query} from './publication-alert.mjs';

const now = Date.parse('2026-11-12T12:00:00Z');
const deployment = {id: 'deployment-a', created_on: '2026-11-12T10:00:00Z'};
const stale = () => compare('2026-11-12T11:00:00Z', deployment, now);

test('caught up, empty dataset, grace period and exact threshold are ok', () => {
  for (const date of [null, '2026-11-12T09:00:00Z', deployment.created_on, '2026-11-12T11:50:00Z', '2026-11-12T11:40:00Z']) {
    assert.equal(compare(date, deployment, now).status, 'ok');
  }
});
test('stale content alerts even if published seconds after the previous deploy', () => {
  assert.equal(stale().status, 'alert');
  assert.equal(compare('2026-11-12T10:00:01Z', deployment, now).status, 'alert');
});
test('incident remains stable across edits until a new deployment', () => {
  assert.equal(stale().incident, compare('2026-11-12T11:10:00Z', deployment, now).incident);
  assert.notEqual(stale().incident, compare('2026-11-12T11:00:00Z', {...deployment, id: 'deployment-b'}, now).incident);
});
test('invalid API timestamps and future values cannot report ok', () => {
  for (const value of [undefined, {}, '', 'bad', '2027-01-01']) assert.throws(() => compare(value, deployment, now));
  assert.throws(() => compare(null, {id: 'a', created_on: 'bad'}, now));
});
test('dry run prints the message and never calls the webhook', async () => {
  const result = await send(stale(), {dryRun: true, fetcher: () => assert.fail('network called')});
  assert.equal(result.sent, false);
  assert.match(result.text, /publication has no later deployment/);
});
test('send posts only timestamps, incident and fixed worker name; fails on rejection', async () => {
  const fetcher = async (url, init) => {
    assert.equal(url.href, 'https://example.invalid/alert');
    assert.equal(init.method, 'POST');
    assert.deepEqual(Object.keys(JSON.parse(init.body)), ['text']);
    return {ok: true};
  };
  assert.deepEqual(await send(stale(), {dryRun: false, webhook: 'https://example.invalid/alert', fetcher}), {sent: true});
  await assert.rejects(send(stale(), {dryRun: false, webhook: 'https://example.invalid', fetcher: async () => ({ok: false, status: 500})}));
  await assert.rejects(send(stale(), {dryRun: false, webhook: 'http://example.invalid'}));
});
test('monitor reads public Sanity without auth and uses first active deployment', async () => {
  const report = await monitor({CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'test'}, async (url, init) => {
    if (String(url).includes('sanity.io')) {
      assert.equal(init.headers, undefined);
      assert.equal(new URL(url).searchParams.get('perspective'), 'published');
      return {ok: true, json: async () => ({result: '2026-01-01T00:00:00Z'})};
    }
    assert.equal(init.headers.Authorization, 'Bearer test');
    return {ok: true, json: async () => ({success: true, result: {deployments: [deployment]}})};
  });
  assert.equal(report.status, 'ok');
  assert.equal(types.length, 12);
  assert.match(query, /versions/);
});
test('API failures and missing deployments fail closed', async () => {
  const env = {CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'test'};
  await assert.rejects(monitor(env, async () => ({ok: false, status: 403})));
  await assert.rejects(monitor(env, async () => ({ok: true, json: async () => ({result: null, success: true})})));
});
test('CLI dry run succeeds without webhook configuration', async () => {
  const {mkdtemp, writeFile, rm} = await import('node:fs/promises');
  const {tmpdir} = await import('node:os');
  const {join} = await import('node:path');
  const {spawnSync} = await import('node:child_process');
  const dir = await mkdtemp(join(tmpdir(), 'publication-alert-'));
  try {
    const path = join(dir, 'report.json');
    await writeFile(path, JSON.stringify(stale()));
    const result = spawnSync(process.execPath, ['migration/tools/publication-alert.mjs', 'send', path, '--dry-run'], {encoding: 'utf8', env: {PATH: process.env.PATH}});
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).dryRun, true);
  } finally { await rm(dir, {recursive: true}); }
});
