import { test } from 'node:test';
import assert from 'node:assert/strict';
import { headingSlug, createHeadingIds, createPostHeadingIds, pageHeadingId } from './headings.ts';

test('Polish text, punctuation, markup-free text and empty headings', () => {
  assert.equal(headingSlug('Zażółć GĘŚLĄ jaźń!'), 'zazolc-gesla-jazn');
  assert.equal(headingSlug('  CRM / AI: B2B  '), 'crm-ai-b2b');
  assert.equal(headingSlug('?!'), 'sekcja');
  assert.equal(headingSlug('Łódź café'), 'lodz-cafe');
});
test('page-wide deduplication handles natural numeric suffix collisions', () => {
  const id = createHeadingIds(['kontakt-heading']);
  assert.deepEqual(['Test','Test','Test 2','Test','kontakt heading'].map(id), ['test','test-2','test-2-2','test-3','kontakt-heading-2']);
});
test('page state is isolated and repeatable between builds', () => {
  const a = {}, b = {};
  assert.equal(pageHeadingId(a,'Usługi'), 'uslugi');
  assert.equal(pageHeadingId(a,'Usługi'), 'uslugi-2');
  assert.equal(pageHeadingId(b,'Usługi'), 'uslugi');
});
test('T39 postOutline contract preserves post prefix and duplicate block key', () => {
  const id = createPostHeadingIds();
  assert.equal(id('Zażółć gęślą', 'a'), 'post-zazolc-gesla');
  assert.equal(id('Zażółć gęślą', 'b'), 'post-zazolc-gesla-b');
  assert.equal(id('!!!', 'c'), 'post-sekcja');
});
