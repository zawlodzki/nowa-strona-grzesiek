// Run: node --test apps/web/src/pages/sitemap/
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadDiscovery, parseDiscovery } from './_content.ts';
import { renderLlms, renderRobots, renderRss, renderSitemapIndex, renderUrlset, sitemapLanguages } from './_render.ts';

const EMPTY = { person: null, docs: [], services: [] };

const page = (path, extra = {}) => ({
  kind: 'page',
  language: 'pl',
  path,
  title: `Strona ${path}`,
  description: `Opis ${path}`,
  lastmod: '2026-01-01T00:00:00.000Z',
  ...extra,
});
const post = (slug, publishedAt, extra = {}) => ({
  kind: 'post',
  language: 'pl',
  path: `/blog/${slug}`,
  title: `Wpis ${slug}`,
  description: `Zajawka ${slug}`,
  lastmod: publishedAt,
  publishedAt,
  ...extra,
});

const SITE = {
  person: { name: 'Grzegorz Zawłodzki', description: 'Doradca\nsprzedaży B2B' },
  docs: [
    page('/'),
    page('/o-mnie', { lastmod: '2026-03-01T00:00:00.000Z' }),
    page('/wdrozenie-crm'),
    post('starszy', '2026-02-01T00:00:00.000Z'),
    post('nowszy', '2026-04-01T00:00:00.000Z', { image: 'https://cdn.sanity.io/images/x/a.png?w=1&h=2' }),
    post('english', '2026-05-01T00:00:00.000Z', { language: 'en' }),
  ],
  services: [
    { name: 'Wdrożenie CRM', description: 'CRM od zera', path: '/wdrozenie-crm', language: 'pl' },
    { name: 'Bez strony', description: 'Pominięta', language: 'pl' },
    { name: 'CRM rollout', description: 'EN', path: '/wdrozenie-crm', language: 'en' },
  ],
};

const locs = (xml) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);

test('empty content still yields valid documents', () => {
  assert.deepEqual(sitemapLanguages(EMPTY), ['pl']);
  assert.deepEqual(locs(renderSitemapIndex(EMPTY)), ['https://www.zawlodzki.pl/sitemap-pl.xml']);
  assert.doesNotMatch(renderSitemapIndex(EMPTY), /<lastmod>/);
  assert.match(renderUrlset(EMPTY, 'pl'), /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">\n<\/urlset>/);
  assert.doesNotMatch(renderRss(EMPTY), /<item>|<pubDate>/);
  assert.equal(renderLlms(EMPTY), '# Grzegorz Zawłodzki\n');
});

test('sitemap index lists EN only when EN documents exist, with the newest lastmod per language', () => {
  const index = renderSitemapIndex(SITE);
  assert.deepEqual(locs(index), ['https://www.zawlodzki.pl/sitemap-pl.xml', 'https://www.zawlodzki.pl/sitemap-en.xml']);
  assert.match(index, /sitemap-pl.xml<\/loc><lastmod>2026-04-01T00:00:00.000Z</);
  assert.match(index, /sitemap-en.xml<\/loc><lastmod>2026-05-01T00:00:00.000Z</);
});

test('urlset is sorted, has no trailing slashes and adds /blog once posts exist', () => {
  assert.deepEqual(locs(renderUrlset(SITE, 'pl')), [
    'https://www.zawlodzki.pl',
    'https://www.zawlodzki.pl/blog',
    'https://www.zawlodzki.pl/blog/nowszy',
    'https://www.zawlodzki.pl/blog/starszy',
    'https://www.zawlodzki.pl/o-mnie',
    'https://www.zawlodzki.pl/wdrozenie-crm',
  ]);
  assert.match(renderUrlset(SITE, 'pl'), /\/blog<\/loc><lastmod>2026-04-01T00:00:00.000Z</);
  assert.deepEqual(locs(renderUrlset(SITE, 'en')), ['https://www.zawlodzki.pl/en/blog', 'https://www.zawlodzki.pl/en/blog/english']);
});

test('a /blog page document replaces the synthetic entry', () => {
  const site = { ...SITE, docs: [...SITE.docs, page('/blog', { lastmod: '2025-01-01T00:00:00.000Z' })] };
  const xml = renderUrlset(site, 'pl');
  assert.equal(locs(xml).filter((loc) => loc.endsWith('/blog')).length, 1);
  assert.match(xml, /\/blog<\/loc><lastmod>2025-01-01T00:00:00.000Z</);
});

test('XML output escapes markup in every text and URL', () => {
  const site = {
    ...EMPTY,
    docs: [post('a&b', '2026-01-01T00:00:00.000Z', { title: 'R&D <script>', description: '"cytat" \'x\'', image: 'https://cdn.x/a.png?w=1&h=2' })],
  };
  const rss = renderRss(site);
  assert.match(rss, /<title>R&amp;D &lt;script&gt;<\/title>/);
  assert.match(rss, /<description>&quot;cytat&quot; &apos;x&apos;<\/description>/);
  assert.match(rss, /url="https:\/\/cdn.x\/a.png\?w=1&amp;h=2"/);
  assert.match(renderUrlset(site, 'pl'), /<loc>https:\/\/www.zawlodzki.pl\/blog\/a&amp;b<\/loc>/);
  assert.doesNotMatch(rss + renderUrlset(site, 'pl'), /&(?!amp;|lt;|gt;|quot;|apos;)/);
});

test('RSS lists PL posts only, newest first, with RFC 822 dates and media for images', () => {
  const rss = renderRss(SITE);
  const items = [...rss.matchAll(/<item>.*?<\/item>/g)].map((m) => m[0]);
  assert.equal(items.length, 2);
  assert.match(items[0], /<link>https:\/\/www.zawlodzki.pl\/blog\/nowszy<\/link><guid isPermaLink="true">https:\/\/www.zawlodzki.pl\/blog\/nowszy<\/guid>/);
  assert.match(items[0], /<pubDate>Wed, 01 Apr 2026 00:00:00 GMT<\/pubDate>/);
  assert.match(items[0], /<media:content url="[^"]+" medium="image"\/><media:thumbnail url="[^"]+"\/>/);
  assert.doesNotMatch(items[1], /media:/);
  assert.match(rss, /<channel>\n<title>Grzegorz Zawłodzki<\/title>\n<link>https:\/\/www.zawlodzki.pl<\/link>/);
  assert.match(rss, /<atom:link href="https:\/\/www.zawlodzki.pl\/blog\/rss.xml" rel="self"/);
});

test('llms.txt groups PL services, other pages and posts, and skips services without a page', () => {
  assert.equal(
    renderLlms(SITE),
    [
      '# Grzegorz Zawłodzki',
      '',
      '> Doradca sprzedaży B2B',
      '',
      '## Usługi',
      '',
      '- [Wdrożenie CRM](https://www.zawlodzki.pl/wdrozenie-crm): CRM od zera',
      '',
      '## Strony',
      '',
      '- [Strona /o-mnie](https://www.zawlodzki.pl/o-mnie): Opis /o-mnie',
      '',
      '## Blog',
      '',
      '- [Wpis nowszy](https://www.zawlodzki.pl/blog/nowszy): Zajawka nowszy',
      '- [Wpis starszy](https://www.zawlodzki.pl/blog/starszy): Zajawka starszy',
      '',
    ].join('\n'),
  );
});

test('robots.txt allows everything and points at the sitemap index', () => {
  assert.equal(renderRobots(), 'User-agent: *\nAllow: /\n\nSitemap: https://www.zawlodzki.pl/sitemap.xml\n');
});

const raw = (doc) => ({
  kind: 'post',
  language: 'pl',
  path: '/blog/x',
  title: 'X',
  description: 'Opis',
  lastmod: '2026-04-01T10:00:00Z',
  publishedAt: '2026-04-01T10:00:00Z',
  image: null,
  ...doc,
});

test('parseDiscovery normalizes dates and drops null optionals', () => {
  const parsed = parseDiscovery({
    person: null,
    docs: [raw({}), raw({ kind: 'page', path: '/', publishedAt: null })],
    services: [{ name: 'S', description: 'D', path: null, language: 'pl' }],
  });
  assert.deepEqual(parsed.docs, [
    { kind: 'post', language: 'pl', path: '/blog/x', title: 'X', description: 'Opis', lastmod: '2026-04-01T10:00:00.000Z', publishedAt: '2026-04-01T10:00:00.000Z' },
    { kind: 'page', language: 'pl', path: '/', title: 'X', description: 'Opis', lastmod: '2026-04-01T10:00:00.000Z' },
  ]);
  assert.deepEqual(parsed.services, [{ name: 'S', description: 'D', language: 'pl' }]);
});

test('parseDiscovery fails on a bad shape instead of returning less', () => {
  const docs = (doc) => ({ person: null, docs: [raw(doc)], services: [] });
  assert.throws(() => parseDiscovery(null), /result/);
  assert.throws(() => parseDiscovery({ person: null, docs: null, services: [] }), /docs/);
  assert.throws(() => parseDiscovery(docs({ language: 'de' })), /language/);
  assert.throws(() => parseDiscovery(docs({ path: 'blog/x' })), /path/);
  assert.throws(() => parseDiscovery(docs({ path: '/blog/x/' })), /path/);
  assert.throws(() => parseDiscovery(docs({ path: null })), /path/);
  assert.throws(() => parseDiscovery(docs({ title: ' ' })), /title/);
  assert.throws(() => parseDiscovery(docs({ lastmod: 'wczoraj' })), /lastmod/);
  assert.throws(() => parseDiscovery(docs({ publishedAt: null })), /publishedAt/);
  assert.throws(() => parseDiscovery(docs({ kind: 'service' })), /kind/);
});

test('loadDiscovery fails the build when Sanity does not answer', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('down', { status: 503 });
  try {
    await assert.rejects(loadDiscovery(), /HTTP 503/);
  } finally {
    globalThis.fetch = realFetch;
  }
});
