import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyLocalOverlay } from '../../lib/sanity/client.ts';
test('local overlay is opt-in and forbidden in CI', async () => {
  const oldFile = process.env.T32_LOCAL_DOCUMENTS;
  const oldCI = process.env.CI;
  try {
    delete process.env.T32_LOCAL_DOCUMENTS;
    const value = { pages: [] };
    assert.equal(await applyLocalOverlay(value), value);
    process.env.T32_LOCAL_DOCUMENTS = '/must-not-be-read';
    process.env.CI = 'true';
    await assert.rejects(applyLocalOverlay(value), /only allowed/);
  } finally {
    if (oldFile === undefined) delete process.env.T32_LOCAL_DOCUMENTS; else process.env.T32_LOCAL_DOCUMENTS = oldFile;
    if (oldCI === undefined) delete process.env.CI; else process.env.CI = oldCI;
  }
});
