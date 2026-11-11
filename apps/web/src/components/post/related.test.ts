import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relatedPosts } from './related.ts';
import type { PostDoc } from '../../lib/sanity/site.ts';
const post = (_id: string, publishedAt: string, language = 'pl') => ({ _id, publishedAt, language }) as PostDoc;
const current = post('current', '2026-11-11');
const others = [post('old', '2026-01-01'), post('new', '2026-11-01'), post('middle', '2026-06-01'), post('fourth', '2026-02-01'), post('english', '2026-11-10', 'en'), current];
test('empty selection shows the three newest other posts in the same language', () => {
  assert.deepEqual(relatedPosts(current, others).map(p => p._id), ['new', 'middle', 'fourth']);
});
test('CMS selection preserves editorial order, excludes missing/self/other-language references and duplicates', () => {
  const selected = { ...current, relatedPosts: ['old', 'current', 'missing', 'english', 'new', 'old', 'middle', 'fourth'].map(_ref => ({ _type: 'reference' as const, _ref, _key: _ref })) };
  assert.deepEqual(relatedPosts(selected, others).map(p => p._id), ['old', 'new', 'middle']);
});
