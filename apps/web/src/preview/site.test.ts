import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchSite } from '../lib/sanity/site.ts';
import { encodeDisplayField } from './site.ts';
import { selectPreviewDocuments } from './selection.ts';

function page(title = 'First draft', slug = '/') {
  return {_id: 'home', _type: 'page', language: 'pl', title, slug: {current: slug}, seo: {title, description: 'Description'}, sections: []};
}
function fixture(title?: string) {
  return {pages: [page(title)], posts: [], assets: [], logos: [], testimonials: [], services: [], person: null, translations: []};
}

test('request readers fetch again and observe draft changes without a process restart', async () => {
  let calls = 0;
  const reader = async () => fixture(`Draft revision ${++calls}`);
  const first = await fetchSite(reader);
  const second = await fetchSite(reader);
  assert.equal(calls, 2);
  assert.equal(first.pages[0]?.title, 'Draft revision 1');
  assert.equal(second.pages[0]?.title, 'Draft revision 2');
});

test('only display text receives visual editing metadata', () => {
  for (const field of ['title', 'heading', 'text', 'description', 'alt', 'caption', 'question', 'label', 'tagline', 'body', 'unit', 'priceNote', 'role', 'company']) assert.equal(encodeDisplayField(['sections', {_key: 'hero'}, field]), true, field);
  for (const field of ['features', 'bullets', 'points', 'badges']) assert.equal(encodeDisplayField(['sections', {_key: 'pricing'}, 'plans', {_key: 'plan'}, field, 0]), true, field);
  assert.equal(encodeDisplayField(['sameAs', 0]), false);
  for (const field of ['_id', '_type', '_ref', '_key', 'current', 'language', 'href', 'url', 'publishedAt', 'variant', 'kind', 'style', 'entity', 'availability']) assert.equal(encodeDisplayField([field]), false, field);
});

test('an incomplete unrelated document does not break a valid preview', async () => {
  const raw = fixture();
  raw.pages.push({...page('Incomplete', '/unfinished'), seo: {title: 'Incomplete', description: ''}});
  const site = await fetchSite(async () => selectPreviewDocuments(raw, '/'));
  assert.equal(site.pages.length, 1);
  assert.equal(site.pages[0]?.path, '/');
  assert.throws(() => selectPreviewDocuments(raw, '/unfinished'), /incomplete required fields/);
});

test('preview retains PL and EN routes and rejects uppercase slugs', async () => {
  const raw = fixture();
  raw.pages.push({...page('English'), _id: 'home-en', language: 'en'});
  raw.pages.push({...page('Invalid', '/Uppercase'), _id: 'bad'});
  const site = await fetchSite(async () => selectPreviewDocuments(raw, '/en'));
  assert.deepEqual(site.pages.map((doc) => site.links[doc._id]), ['/', '/en']);
  assert.throws(() => selectPreviewDocuments(raw, '/Uppercase'), /incomplete required fields/);
});
