import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const input = process.argv[2];
if (!input) throw new Error('Usage: node pages-t42-verify.mjs export.json');
const dir = await mkdtemp(join(tmpdir(), 't42-check-'));
const planner = new URL('./pages-t42-cta-patch.mjs', import.meta.url).pathname;
const run = (...args) => spawnSync(process.execPath, [planner, ...args], { encoding: 'utf8' });
try {
  const report = join(dir, 'report.json'), patched = join(dir, 'patched.json');
  const first = run(input, report, patched);
  assert.equal(first.status, 0, first.stderr);
  const result = JSON.parse(await readFile(report, 'utf8'));
  assert(result.mutations.length > 0, 'Use a fresh unpatched snapshot');
  for (const { patch } of result.mutations) {
    assert(patch.id && patch.ifRevisionID);
    assert(Object.keys(patch.set).every(key => ['sections', 'body'].includes(key)));
  }
  const second = run(patched);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(JSON.parse(second.stdout).mutations, []);
  const docs = JSON.parse(await readFile(patched, 'utf8'));
  const blog = docs.find(d => d._type === 'post' && d.slug?.current.replace(/^\/?blog\//, '').replace(/^\//, '') === 'ai-w-sprzedazy');
  assert.equal(blog.body.filter(b => b._key === 't42-pt').length, 1);
  assert.equal(blog.body.find(b => b._key === 't42-pt').markDefs[0].reference._ref, docs.find(d => d.slug?.current === '/kontakt')._id);
  const bad = join(dir, 'bad.json');
  await writeFile(bad, '[]');
  assert.notEqual(run(bad).status, 0, 'Missing required pages must fail');
  const snapshot = JSON.parse(await readFile(input, 'utf8'));
  for (const d of Array.isArray(snapshot) ? snapshot : snapshot.result) delete d._rev;
  await writeFile(bad, JSON.stringify(snapshot));
  assert.notEqual(run(bad).status, 0, 'Missing revisions must fail');
  console.log(JSON.stringify({ pass: true, changes: result.changes.length, documents: result.mutations.length, secondRunMutations: 0, missingPageRejected: true, missingRevisionRejected: true }));
} finally { await rm(dir, { recursive: true, force: true }); }
