import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildMeta } from './meta.ts';
import { brandTitle } from './title.ts';

const fixture = (name) => JSON.parse(readFileSync(fileURLToPath(new URL(`./fixtures/${name}.json`, import.meta.url)), 'utf8'));
const prop = (meta, key) => meta.properties.filter(([k]) => k === key).map(([, v]) => v);

test('canonical is www, no trailing slash, home is the bare origin', () => {
  assert.equal(buildMeta(fixture('home')).canonical, 'https://www.zawlodzki.pl');
  assert.equal(buildMeta(fixture('contact')).canonical, 'https://www.zawlodzki.pl/kontakt');
  assert.equal(buildMeta({ ...fixture('contact'), seo: { ...fixture('contact').seo, canonicalOverride: 'https://www.zawlodzki.pl/wspolpraca' } }).canonical, 'https://www.zawlodzki.pl/wspolpraca');
});

test('exactly one og:type: article for posts, website otherwise', () => {
  assert.deepEqual(prop(buildMeta(fixture('post')), 'og:type'), ['article']);
  for (const name of ['home', 'service', 'course', 'contact', 'about']) assert.deepEqual(prop(buildMeta(fixture(name)), 'og:type'), ['website'], name);
});

test('title, description and Twitter tags match the live head', () => {
  const page = fixture('post');
  const meta = buildMeta(page);
  assert.equal(meta.title, 'AI w sprzedaży: od czego zacząć | Grzegorz Zawłodzki');
  assert.deepEqual(Object.fromEntries(meta.names), {
    'twitter:card': 'summary_large_image',
    'twitter:title': meta.title,
    'twitter:description': page.seo.description,
    'twitter:image': page.seo.ogImage.url,
  });
  assert.deepEqual(prop(meta, 'article:published_time'), ['2026-09-01']);
  assert.deepEqual(prop(meta, 'og:title'), [meta.title]);
});

test('the build appends the brand suffix once to the stored bare title', () => {
  assert.equal(brandTitle('Kontakt'), 'Kontakt | Grzegorz Zawłodzki');
  assert.equal(brandTitle(' Kontakt '), 'Kontakt | Grzegorz Zawłodzki');
  assert.equal(brandTitle('Kontakt | Grzegorz Zawłodzki'), 'Kontakt | Grzegorz Zawłodzki');
  assert.equal(brandTitle('Grzegorz Zawłodzki'), 'Grzegorz Zawłodzki');
  for (const name of ['home', 'service', 'course', 'post', 'contact', 'about']) {
    const meta = buildMeta(fixture(name));
    assert.equal(meta.title.match(/\| Grzegorz Zawłodzki/g)?.length, 1, name);
    assert.ok(meta.title.endsWith(' | Grzegorz Zawłodzki'), name);
  }
});

test('no hreflang without a real translation', () => {
  for (const name of ['home', 'service', 'course', 'post', 'contact', 'about']) assert.deepEqual(buildMeta(fixture(name)).alternates, [], name);
});

test('hreflang pairs both ways plus x-default to PL', () => {
  const pl = { ...fixture('contact'), translation: { language: 'en', path: '/contact' } };
  const en = { ...fixture('contact'), language: 'en', path: '/contact', translation: { language: 'pl', path: '/kontakt' } };
  const expected = [
    { hreflang: 'pl', href: 'https://www.zawlodzki.pl/kontakt' },
    { hreflang: 'en', href: 'https://www.zawlodzki.pl/en/contact' },
    { hreflang: 'x-default', href: 'https://www.zawlodzki.pl/kontakt' },
  ];
  assert.deepEqual(buildMeta(pl).alternates, expected);
  assert.deepEqual(buildMeta(en).alternates, expected);
  assert.equal(buildMeta(en).canonical, 'https://www.zawlodzki.pl/en/contact');
  assert.deepEqual(prop(buildMeta(en), 'og:locale:alternate'), ['pl_PL']);
});

test('noindex only when asked', () => {
  assert.equal(buildMeta(fixture('home')).robots, undefined);
  assert.equal(buildMeta({ ...fixture('home'), seo: { ...fixture('home').seo, noindex: true } }).robots, 'noindex');
});
