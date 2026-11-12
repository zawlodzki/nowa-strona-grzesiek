import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {verifyArchive} from './backup-sanity.mjs';

const expected = {documents: 2, drafts: 1, images: 1, files: 1};

async function fixture(t, {draft = true, image = true} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'sanity-backup-test-'));
  t.after(() => rm(root, {recursive: true, force: true}));
  const source = join(root, 'production-export');
  const archive = join(root, 'sample.tar.gz');
  await mkdir(join(source, 'images'), {recursive: true});
  await mkdir(join(source, 'files'));
  const documents = [{_id: 'post', _type: 'post'}, {_id: draft ? 'drafts.post' : 'other', _type: 'post'}];
  await writeFile(join(source, 'data.ndjson'), documents.map(document => JSON.stringify(document)).join('\n') + '\n');
  await writeFile(join(source, 'files', 'example.pdf'), 'PDF fixture');
  if (image) await writeFile(join(source, 'images', 'example.png'), 'PNG fixture');
  execFileSync('tar', ['-czf', archive, '-C', root, 'production-export']);
  return archive;
}

test('counts archived documents, drafts and asset files independently', async t => {
  assert.deepEqual(await verifyArchive(await fixture(t), expected), expected);
});

test('rejects an archive with a missing asset binary', async t => {
  await assert.rejects(verifyArchive(await fixture(t, {image: false}), expected), /0 images. Expected 1/);
});

test('rejects an archive with a missing draft even when the total matches', async t => {
  await assert.rejects(verifyArchive(await fixture(t, {draft: false}), expected), /0 drafts. Expected 1/);
});

test('rejects a corrupt archive', async t => {
  const archive = await fixture(t);
  await writeFile(archive, 'not a tarball');
  await assert.rejects(verifyArchive(archive, expected), /Could not read the Sanity archive/);
});

test('refuses to write a backup anywhere inside a checkout', () => {
  const script = fileURLToPath(new URL('./backup-sanity.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [script, join(import.meta.dirname, 'unused-backup')], {encoding: 'utf8'});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Choose a backup directory outside Git/);
});
