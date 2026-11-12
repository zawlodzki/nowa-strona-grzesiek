import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkDist } from './check-dist.mjs';

const origin = 'https://www.zawlodzki.pl';
const html = `<title>Title</title><meta name="description" content="Description"><link rel="canonical" href="${origin}"><h1>Hello</h1><script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Person"}]}</script>`;
function fixture(t, changes = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'check-dist-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const files = {
    'index.html': html,
    'sitemap.xml': `<urlset><url><loc>${origin}</loc></url></urlset>`,
    'robots.txt': `Sitemap: ${origin}/sitemap.xml`,
    'map.csv': 'old_path,action,new_path_pl\n/,keep,/\n',
    ...changes,
  };
  for (const [name, value] of Object.entries(files)) {
    if (value === null) continue;
    mkdirSync(join(dir, name, '..'), { recursive: true });
    writeFileSync(join(dir, name), value);
  }
  return (options = {}) => checkDist(dir, { urlMap: join(dir, 'map.csv'), ...options });
}
test('valid output, exclusions, and non-HTML content', (t) => {
  const run = fixture(t, { '404.html': 'error', '_ds/catalog.html': 'catalog', 'index.md': '# Markdown' });
  assert.deepEqual(run().errors, []);
});
const cases = [
  ['missing h1', html.replace('<h1>Hello</h1>', ''), /one h1/],
  ['two h1s', html + '<h1>Duplicate</h1>', /one h1/],
  ['empty title', html.replace('>Title<', '> <'), /title/],
  ['missing title', html.replace('<title>Title</title>', ''), /title/],
  ['empty description', html.replace('content="Description"', 'content=""'), /description/],
  ['missing description', html.replace('name="description"', 'name="other"'), /description/],
  ['missing canonical', html.replace('rel="canonical"', 'rel="other"'), /canonical/],
  ['wrong host', html.replace(`href="${origin}"`, 'href="https://example.com"'), /canonical/],
  ['trailing slash', html.replace(`href="${origin}"`, `href="${origin}/"`), /canonical/],
  ['uppercase path', html.replace(`href="${origin}"`, `href="${origin}/UPPER"`), /canonical/],
  ['duplicate canonical', html + `<link rel="canonical" href="${origin}">`, /canonical/],
  ['missing JSON-LD', html.replace('application/ld+json', 'text/plain'), /one JSON-LD/],
  ['duplicate JSON-LD', html + '<script type="application/ld+json">{}</script>', /one JSON-LD/],
  ['invalid JSON', html.replace('"@graph":', 'broken:'), /invalid JSON/],
  ['non-graph JSON', html.replace('"@graph":', '"items":'), /single @graph/],
  ['array JSON', html.replace('{"@context":"https://schema.org","@graph":[{"@type":"Person"}]}', '[]'), /single @graph/],
  ['nested graph', html.replace('"@type":"Person"', '"@graph":[]'), /nested @graph/],
  ...['SearchAction', 'HowTo', 'https://schema.org/HowTo'].map((type) => [type, html.replace('Person', type), /forbidden/]),
  ['missing alternate', html + `<link rel="alternate" hreflang="en" href="${origin}/en/missing">`, /hreflang/],
];
for (const [name, broken, error] of cases) test(name, (t) => {
  assert.match(fixture(t, { 'index.html': broken })().errors.join('\n'), error);
});
test('valid language pair and script/comment text are accepted', (t) => {
  const links = `<link rel="alternate" hreflang="pl" href="${origin}"><link rel="alternate" hreflang="en" href="${origin}/en/home">`;
  const run = fixture(t, {
    'index.html': html + links + '<!-- <h1>ignored</h1> --><script>const x="<h1>ignored</h1>";</script>',
    'en/home.html': html.replace(`href="${origin}"`, `href="${origin}/en/home"`) + links,
  });
  assert.deepEqual(run().errors, []);
});
for (const [name, changes, error] of [
  ['missing sitemap', { 'sitemap.xml': null }, /missing sitemap/],
  ['missing sitemap target', { 'sitemap.xml': `<loc>${origin}/absent</loc>` }, /loc missing/],
  ['missing child sitemap', { 'sitemap.xml': `<loc>${origin}/sitemap-en.xml</loc>` }, /loc missing/],
  ['missing robots', { 'robots.txt': null }, /must name sitemap/],
  ['wrong robots sitemap', { 'robots.txt': 'Sitemap: https://other.test/sitemap.xml' }, /must name sitemap/],
  ['missing static keep route', { 'map.csv': 'old_path,action,new_path_pl\n/blog,keep,/blog\n' }, /static keep/],
  ['empty dist pages', { 'index.html': null }, /no HTML/],
]) test(name, (t) => assert.match(fixture(t, changes)().errors.join('\n'), error));
test('unpublished content is reported without failing, including quoted CSV', (t) => {
  const result = fixture(t, { 'map.csv': 'old_path,action,new_path_pl,notes\n/post,keep,/post,"one,two"\n' })();
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.reports, ['Unpublished-content keep route absent: /post']);
});
for (const ext of ['css', 'js']) test(`${ext} total gzip budget`, (t) => {
  const run = fixture(t, { [`assets/a.${ext}`]: 'some asset', [`assets/b.${ext}`]: 'another asset' });
  assert.match(run({ budgets: { css: 1000, js: 1000, [ext]: 1 } }).errors.join('\n'), /budget exceeded/);
  assert.deepEqual(run().errors, []);
});
