import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownPath, portableText, sectionsMarkdown, renderMarkdown } from './markdown.ts';
import type { Route } from './sanity/routes.ts';
import type { Site } from './sanity/site.ts';
const site = { links: { page: '/kontakt' }, images: { img: { src: 'https://example.com/image.jpg' } }, logos: new Map(), testimonials: new Map(), posts: [] } as unknown as Site;

test('paths include home, nested and EN routes', () => {
  assert.equal(markdownPath('/'), '/index.md');
  assert.equal(markdownPath('/en'), '/en.md');
  assert.equal(markdownPath('/blog/post'), '/blog/post.md');
});
test('Portable Text retains headings, marks, links, images, lists and quotes', () => {
  const body = portableText([
    { _type: 'block', _key: 'a', style: 'h2', children: [{ _type: 'span', _key: 's', text: 'Heading', marks: ['strong'] }] },
    { _type: 'block', _key: 'b', listItem: 'number', children: [{ _type: 'span', _key: 's', text: 'Contact', marks: ['ref'] }], markDefs: [{ _type: 'internalLink', _key: 'ref', reference: { _type: 'reference', _ref: 'page' } }] },
    { _type: 'image', _key: 'c', asset: { _type: 'reference', _ref: 'img' }, alt: 'Diagram' },
    { _type: 'block', _key: 'd', style: 'blockquote', children: [{ _type: 'span', _key: 's', text: 'Quote' }] },
  ], site);
  assert.match(body, /## \*\*Heading\*\*/);
  assert.match(body, /1\. \[Contact\]\(https:\/\/www.zawlodzki.pl\/kontakt\)/);
  assert.match(body, /!\[Diagram\]\(https:\/\/example.com\/image.jpg\)/);
  assert.match(body, /> Quote/);
});
test('tables escape pipes and code fences preserve embedded backticks', () => {
  const result = portableText([{ _type: 'table', _key: 't', hasHeader: true, rows: [{ _type: 'tableRow', _key: 'r', cells: ['A|B'] }] }, { _type: 'codeBlock', _key: 'c', code: '```' }], site);
  assert.match(result, /A\\\|B/);
  assert.match(result, /````\n```\n````/);
});
test('sections retain tab and pricing content and exclude form configuration', () => {
  const result = sectionsMarkdown([
    { _type: 'tabs', _key: 't', heading: 'Options', items: [{ _type: 'tabItem', _key: 'i', title: 'One', summary: 'Summary' }] },
    { _type: 'pricing', _key: 'p', plans: [{ _type: 'pricePlan', _key: 'i', name: 'Plan', price: 100, currency: 'PLN', features: ['Support'] }] },
    { _type: 'contactForm', _key: 'c', heading: 'Contact', intro: 'Talk to me', formId: 'main-contact' },
  ], site, 'pl');
  for (const part of ['## Options', '### One', 'Summary', '100 PLN', '- Support', 'Talk to me']) assert.ok(result.includes(part));
  assert.ok(!result.includes('main-contact'));
});
test('page output includes title, description and canonical HTML URL', () => {
  const result = renderMarkdown({ kind: 'page', href: '/', language: 'pl', path: '/', page: { title: 'Home', seo: { description: 'Description' }, sections: [] } } as unknown as Route, site);
  assert.match(result, /^# Home\n\nDescription\n\nCanonical: https:\/\/www.zawlodzki.pl\//);
});
