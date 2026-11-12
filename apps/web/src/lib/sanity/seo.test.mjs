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

test('all visible text testimonials reach the single serialized graph', async () => {
  const { serializeGraph } = await import('../../seo/graph.ts');
  const doc = { ...page, sections: [
    { _type: 'testimonials', items: [{ _ref: 'a' }, { _ref: 'missing' }] },
    { _type: 'testimonials', items: [{ _ref: 'b' }, { _ref: 'image' }, { _ref: 'a' }] },
  ] };
  const value = withEntities({ ...site(), pages: [doc], testimonials: new Map([
    ['a', { _id: 'a', name: 'Anna', quote: 'First <quote>.' }],
    ['b', { _id: 'b', name: 'Bart', quote: 'Second quote.' }],
    ['image', { _id: 'image', name: 'Image only', image: {} }],
  ]) });
  const serialized = serializeGraph(seoPage(value, { kind: 'page', language: 'pl', path: doc.path, page: doc }));
  assert.ok(!serialized.includes('<quote>'));
  const graph = JSON.parse(serialized)['@graph'];
  const reviews = graph.filter(n => n['@type'] === 'Review');
  assert.deepEqual(reviews.map(n => n.reviewBody), ['First <quote>.', 'Second quote.']);
  assert.deepEqual(reviews.map(n => n.author), [{ '@type': 'Person', name: 'Anna' }, { '@type': 'Person', name: 'Bart' }]);
  for (const review of reviews) {
    assert.ok(graph.some(n => n['@id'] === review.itemReviewed['@id']));
    assert.ok(graph.some(n => n['@id'] === review.isPartOf['@id']));
  }
});

test('a service with course fields becomes a Course with its instance, and the home stub points at it', async () => {
  const { serializeGraph } = await import('../../seo/graph.ts');
  const doc = { ...page, _id: 'page-course', path: '/kurs', sections: [{ _type: 'pricing', plans: [{ name: 'Access', price: 2200 }] }] };
  const home = { ...page, _id: 'page-home', path: '/' };
  const plain = { _id: 's1', name: 'Course', description: 'Eight modules.', page: { _ref: doc._id } };
  const course = { educationalLevel: 'Intermediate', audience: 'B2B companies', teaches: ['Process', 'CRM'], instance: { name: 'One year access', courseMode: 'online', courseWorkload: 'PT9H', startDate: '2026-10-01' } };
  const build = (service, target) => {
    const value = withEntities({ ...site(), pages: [doc, home], services: [service], byId: new Map([[doc._id, doc], [home._id, home]]) });
    return JSON.parse(serializeGraph(seoPage(value, { kind: 'page', language: 'pl', path: target.path, page: target })))['@graph'];
  };

  const before = build(plain, doc);
  assert.ok(before.some(n => n['@type'] === 'Service'));
  assert.ok(!before.some(n => n['@type'] === 'Course'));

  const graph = build({ ...plain, course }, doc);
  assert.ok(!graph.some(n => n['@type'] === 'Service'));
  const node = graph.find(n => n['@type'] === 'Course');
  assert.equal(node['@id'], 'https://www.zawlodzki.pl/kurs#course');
  assert.equal(node.isAccessibleForFree, false);
  assert.deepEqual(node.teaches, course.teaches);
  assert.deepEqual(node.audience, { '@type': 'BusinessAudience', name: 'B2B companies' });
  assert.equal(node.hasCourseInstance['@type'], 'CourseInstance');
  assert.equal(node.hasCourseInstance.courseWorkload, 'PT9H');
  assert.deepEqual(node.offers.map(o => o.price), ['2200']);
  assert.equal(graph.find(n => n['@id'] === 'https://www.zawlodzki.pl/kurs#webpage').mainEntity['@id'], node['@id']);

  const stub = build({ ...plain, course }, home).find(n => n['@id'] === 'https://www.zawlodzki.pl/#webpage').mainEntity.itemListElement[0].itemOffered;
  assert.deepEqual([stub['@type'], stub['@id']], ['Course', node['@id']]);
});
