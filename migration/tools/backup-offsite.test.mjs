import assert from 'node:assert/strict';
import test from 'node:test';
import {objectName, parseSummary} from './backup-offsite.mjs';

const sha = 'a'.repeat(64);
const line = `documents=163 assets=1510 images=1489 files=21 drafts=2 drafts_included=true sha256=${sha} archive=/tmp/x/8u2zjhvn-production-2026-11-15T03-15-00.000Z.tar.gz`;

test('parses the backup-sanity summary line', () => {
  const summary = parseSummary(line);
  assert.equal(summary.documents, '163');
  assert.equal(summary.drafts_included, 'true');
  assert.equal(summary.sha256, sha);
});

test('rejects a summary without a checksum', () => {
  assert.throws(() => parseSummary(line.replace(/sha256=\S+/, '')), /sha256/);
});

test('names the bundle after the archive', () => {
  assert.equal(
    objectName('sanity/', '/tmp/x/8u2zjhvn-production-2026-11-15T03-15-00.000Z.tar.gz'),
    'sanity/8u2zjhvn-production-2026-11-15T03-15-00.000Z.restic.tar',
  );
});
