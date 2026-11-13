// T54: a page `sectionRef` renders as the block of the referenced reusable section.
// Run: node --test migration/lanes/cms/out/t54-reusable-sections/section-ref.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchSite } from '../../../../../apps/web/src/lib/sanity/site.ts';

const newsletter = { _key: 'shared', _type: 'newsletterSignup', body: 'Raz w tygodniu.', copy: { _type: 'object', heading: 'Sales Atlas', submitLabel: 'Zapisuję się' } };
const inline = { _key: 'inline', _type: 'ctaBand', heading: 'Inline', cta: { _type: 'link', label: 'Kontakt', href: '/kontakt' } };

function raw(sections: unknown[], reusableSections: unknown[] = [{ _id: 'section-newsletter', _type: 'reusableSection', name: 'Newsletter', language: 'pl', section: [newsletter] }]) {
  return {
    pages: [{ _id: 'home', _type: 'page', language: 'pl', title: 'Home', slug: { current: '/' }, seo: { title: 'Home', description: 'Description' }, sections }],
    posts: [], assets: [], logos: [], testimonials: [], services: [], person: null, translations: [], reusableSections,
  };
}
const ref = (key: string, id = 'section-newsletter') => ({ _key: key, _type: 'sectionRef', section: { _type: 'reference', _ref: id } });

test('sectionRef is replaced by the referenced block, keeping the page key and order', async () => {
  const site = await fetchSite(async () => raw([inline, ref('ref-1'), ref('ref-2')]));
  const sections = site.pages[0]?.sections ?? [];
  assert.deepEqual(sections.map((s) => [s._type, s._key]), [['ctaBand', 'inline'], ['newsletterSignup', 'ref-1'], ['newsletterSignup', 'ref-2']]);
  assert.deepEqual(sections[1], { ...newsletter, _key: 'ref-1' });
  assert.notEqual(sections[1], sections[2], 'each reference gets its own copy');
});

test('inlined sections are left untouched', async () => {
  const site = await fetchSite(async () => raw([inline]));
  assert.deepEqual(site.pages[0]?.sections, [inline]);
});

test('a reference to a missing section is skipped with a warning, not a build failure', async (t) => {
  const warn = t.mock.method(console, 'warn', () => {});
  const site = await fetchSite(async () => raw([inline, ref('gone', 'section-unpublished')]));
  assert.deepEqual(site.pages[0]?.sections?.map((s) => s._key), ['inline']);
  assert.match(String(warn.mock.calls[0]?.arguments[0]), /home → section-unpublished/);
});

test('a site query without reusable sections still parses', async () => {
  const { reusableSections: _, ...legacy } = raw([inline]);
  const site = await fetchSite(async () => legacy);
  assert.equal(site.pages[0]?.sections?.length, 1);
});
