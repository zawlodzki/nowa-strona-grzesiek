import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postOutline } from './outline.ts';
import type { PortableText } from '../../../../studio/sanity.types.ts';
const heading = (_key: string, style: 'h2' | 'h3', text: string): PortableText[number] => ({ _key, _type: 'block', style, children: [{ _key: `${_key}-text`, _type: 'span', text, marks: [] }], markDefs: [] });
test('h3 entries nest under the preceding h2 and both levels target the rendered headings', () => {
  const body = [heading('a', 'h2', 'Koszt wdrożenia'), heading('b', 'h3', 'Zespół'), heading('c', 'h3', 'Narzędzia'), heading('d', 'h2', 'Podsumowanie')];
  const { entries, sections } = postOutline(body);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0].children.map(h => h.text), ['Zespół', 'Narzędzia']);
  assert.deepEqual(sections.map(s => s.heading?.id), ['post-koszt-wdrozenia', 'post-zespol', 'post-narzedzia', 'post-podsumowanie']);
  assert.equal(sections[1].heading?.block, body[1]);
});
test('slug IDs survive insertion of unrelated headings and repeated titles have unique targets', () => {
  const body = [heading('a', 'h2', 'Zażółć gęślą jaźń!'), heading('b', 'h3', 'Zażółć gęślą jaźń!')];
  const ids = (value: PortableText) => postOutline(value).sections.flatMap(s => s.heading?.id ?? []);
  assert.deepEqual(ids(body), ['post-zazolc-gesla-jazn', 'post-zazolc-gesla-jazn-b']);
  assert.deepEqual(ids([heading('x', 'h2', 'Nowy temat'), ...body]).slice(1), ids(body));
});
test('an orphan h3 remains navigable and a body without headings retains its content', () => {
  assert.equal(postOutline([heading('a', 'h3', 'Start')]).entries[0].level, 'h3');
  const body: PortableText = [{ _type: 'block', _key: 'intro', style: 'normal', children: [{ _type: 'span', _key: 'text', text: 'Wstęp', marks: [] }], markDefs: [] }];
  assert.deepEqual(postOutline(body), { entries: [], sections: [{ blocks: body }] });
});
