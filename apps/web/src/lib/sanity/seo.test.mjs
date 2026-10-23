import assert from 'node:assert/strict';
import { test } from 'node:test';
import { seoPage } from './seo.ts';

const page = { _id: 'page-example', language: 'pl', path: '/example', title: 'Example', seo: { title: 'Example', description: 'Description.' }, sections: [] };
const site = () => ({ pages: [], posts: [], services: [], byId: new Map(), translations: new Map(), logos: new Map(), testimonials: new Map(), links: {}, images: {} });
const withEntities = (value) => ({
  ...value,
  person: { image: { asset: { _ref: 'person-image' } } },
  organization: { logo: { asset: { _ref: 'organization-image' } } },
  images: { 'person-image': { src: 'https://cdn.sanity.io/person.webp' }, 'organization-image': { src: 'https://cdn.sanity.io/logo.svg' } },
});

test('the empty project can still build its synthetic blog index', () => {
  const result = seoPage(site(), { kind: 'blogIndex', language: 'pl', path: '/blog', pageNumber: 1, posts: [] });
  assert.equal(result.kind, 'blogIndex');
  assert.equal(result.entityImages, undefined);
});

test('real content cannot silently fall back to legacy entity images', () => {
  const value = { ...site(), pages: [page] };
  assert.throws(() => seoPage(value, { kind: 'page', language: 'pl', path: page.path, page }), /entity images are missing/);
  const result = seoPage(withEntities(value), { kind: 'page', language: 'pl', path: page.path, page });
  assert.equal(result.entityImages.person.url, 'https://cdn.sanity.io/person.webp');
});

test('an unmodified post uses its publication date as dateModified', () => {
  const post = { ...page, _id: 'post-example', path: '/blog/example', publishedAt: '2026-10-21T12:00:00Z', body: [] };
  const result = seoPage(withEntities({ ...site(), posts: [post] }), { kind: 'post', language: 'pl', path: post.path, post });
  assert.equal(result.post.dateModified, post.publishedAt);
});
