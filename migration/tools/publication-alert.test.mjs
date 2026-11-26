import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {combine, compare, monitor, send, types, query, workers} from './publication-alert.mjs';

const now = Date.parse('2026-11-12T12:00:00Z');
const deployment = {id: 'deployment-a', created_on: '2026-11-12T10:00:00Z'};
const fresh = {id: 'deployment-p', created_on: '2026-11-12T11:30:00Z'};
const staleOnly = (worker) => compare('2026-11-12T11:00:00Z', deployment, now, 20, worker);
const freshOnly = (worker) => compare('2026-11-12T11:00:00Z', fresh, now, 20, worker);
const stale = () => combine([staleOnly('zawlodzki-web'), freshOnly('zawlodzki-web-production')]);

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
test('either stale Worker alerts and the report names it', () => {
  const production = combine([freshOnly('zawlodzki-web'), staleOnly('zawlodzki-web-production')]);
  assert.equal(production.status, 'alert');
  assert.deepEqual(production.workers.map((w) => w.status), ['ok', 'alert']);
  assert.equal(combine([freshOnly('zawlodzki-web'), freshOnly('zawlodzki-web-production')]).status, 'ok');
});
test('staging-only incident keeps the pre-T128 hash; both stale is a separate incident', () => {
  const legacy = createHash('sha256').update(`zawlodzki-web:${deployment.id}`).digest('hex');
  assert.equal(stale().incident, legacy);
  const both = combine([staleOnly('zawlodzki-web'), staleOnly('zawlodzki-web-production')]);
  assert.notEqual(both.incident, legacy);
  assert.match(both.incident, /^[a-f0-9]{64}$/);
});
test('invalid API timestamps and future values cannot report ok', () => {
  for (const value of [undefined, {}, '', 'bad', '2027-01-01']) assert.throws(() => compare(value, deployment, now));
  assert.throws(() => compare(null, {id: 'a', created_on: 'bad'}, now));
});
test('dry run prints the message and never calls the webhook', async () => {
  const result = await send(stale(), {dryRun: true, fetcher: () => assert.fail('network called')});
  assert.equal(result.sent, false);
  assert.match(result.text, /publication has no later deployment/);
  assert.match(result.text, /^zawlodzki-web: /);
  const production = await send(combine([freshOnly('zawlodzki-web'), staleOnly('zawlodzki-web-production')]), {dryRun: true});
  assert.match(production.text, /^zawlodzki-web-production: /);
});
test('send rejects reports without a known stale Worker', async () => {
  await assert.rejects(send({...stale(), workers: [{worker: 'other', status: 'alert', deployedAt: deployment.created_on}]}));
  await assert.rejects(send({...stale(), workers: undefined}));
  await assert.rejects(send({...stale(), workers: [{worker: 'zawlodzki-web', status: 'ok', deployedAt: deployment.created_on}]}));
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
test('monitor reads public Sanity without auth and the first active deployment of each Worker', async () => {
  const seen = [];
  const report = await monitor({CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'test'}, async (url, init) => {
    if (String(url).includes('sanity.io')) {
      assert.equal(init.headers, undefined);
      assert.equal(new URL(url).searchParams.get('perspective'), 'published');
      return {ok: true, json: async () => ({result: '2026-01-01T00:00:00Z'})};
    }
    assert.equal(init.headers.Authorization, 'Bearer test');
    seen.push(String(url).split('/scripts/')[1]);
    return {ok: true, json: async () => ({success: true, result: {deployments: [deployment]}})};
  });
  assert.equal(report.status, 'ok');
  assert.deepEqual(seen, workers.map((w) => `${w}/deployments`));
  assert.deepEqual(report.workers.map((w) => w.worker), workers);
  assert.equal(types.length, 12);
  assert.match(query, /versions/);
});
test('API failures and missing deployments fail closed', async () => {
  const env = {CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), CLOUDFLARE_API_TOKEN: 'test'};
  await assert.rejects(monitor(env, async () => ({ok: false, status: 403})));
  await assert.rejects(monitor(env, async () => ({ok: true, json: async () => ({result: null, success: true})})));
  const productionMissing = async (url) => String(url).includes('sanity.io')
    ? {ok: true, json: async () => ({result: '2026-01-01T00:00:00Z'})}
    : String(url).includes('zawlodzki-web-production')
      ? {ok: true, json: async () => ({success: true, result: {deployments: []}})}
      : {ok: true, json: async () => ({success: true, result: {deployments: [deployment]}})};
  await assert.rejects(monitor(env, productionMissing));
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
