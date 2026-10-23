// Run: node --test apps/web/src/seo/
// UPDATE_SNAPSHOTS=1 rewrites __snapshots__/ and PARITY.md. The parity tests need migration/00-inventory.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import entities from '../../../../migration/contracts/entities.json' with { type: 'json' };
import { buildGraph, serializeGraph } from './graph.ts';
import { INTENDED, liveDiff } from './parity.mjs';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const UPDATE = process.env.UPDATE_SNAPSHOTS === '1';
const SAMPLES = ['home', 'service', 'course', 'post', 'contact', 'about'];
const fixture = (name) => JSON.parse(readFileSync(here(`./fixtures/${name}.json`), 'utf8'));
const HAS_INVENTORY = existsSync(here('../../../../migration/00-inventory/live-site/jsonld'));

test('imported entity images replace legacy CDN URLs while preserving entity identities', () => {
  const page = fixture('home');
  page.entityImages = {
    person: { url: 'https://cdn.sanity.io/images/project/production/person.webp', alt: 'Person' },
    organization: { url: 'https://cdn.sanity.io/images/project/production/logo.svg', alt: 'Organization' },
  };
  page.primaryImage = page.entityImages.person;
  page.services = [{ name: 'Example service', path: '/example', description: 'Service description.' }];
  const graph = buildGraph(page)['@graph'];
  assert.equal(graph.find((node) => node['@id'] === entities.person['@id']).image.url, page.entityImages.person.url);
  assert.equal(graph.find((node) => node['@id'] === entities.organization['@id']).logo.url, page.entityImages.organization.url);
  assert.ok(!JSON.stringify(graph).includes('website-files.com'));
  const offered = graph[0].mainEntity.itemListElement[0].itemOffered;
  assert.equal(offered.description, 'Service description.');
  assert.deepEqual(offered.provider, { '@id': entities.organization['@id'] });
});

function walk(value, visit) {
  if (Array.isArray(value)) return value.forEach((v) => walk(v, visit));
  if (value && typeof value === 'object') {
    visit(value);
    Object.values(value).forEach((v) => walk(v, visit));
  }
}

for (const name of SAMPLES) {
  test(`${name}: graph matches snapshot`, () => {
    const file = here(`./__snapshots__/${name}.json`);
    const graph = buildGraph(fixture(name));
    if (UPDATE) writeFileSync(file, `${JSON.stringify(graph, null, 2)}\n`);
    assert.deepEqual(graph, JSON.parse(readFileSync(file, 'utf8')));
  });

  test(`${name}: one @graph, site entities intact, every reference typed`, () => {
    const graph = buildGraph(fixture(name));
    assert.deepEqual(Object.keys(graph), ['@context', '@graph'], 'single document with one @graph');
    const top = new Map(graph['@graph'].map((n) => [n['@id'], n]));
    assert.equal(top.size, graph['@graph'].length, 'no @id defined twice at top level');
    for (const key of ['organization', 'website']) assert.deepEqual(top.get(entities[key]['@id']), entities[key], `${key} as in entities.json`);
    assert.equal(top.get(entities.person['@id']).name, entities.person.name, 'person present');
    assert.match(graph['@graph'][0]['@id'], /#webpage$/, 'WebPage node first');

    const types = new Set();
    walk(graph, (node) => {
      if (node['@type']) types.add(node['@type']);
      if (node['@id'] && Object.keys(node).length === 1) assert.ok(top.has(node['@id']), `reference ${node['@id']} resolves in the graph`);
    });
    for (const banned of ['SearchAction', 'HowTo']) assert.ok(!types.has(banned), `no ${banned}`);
    assert.equal(types.has('FAQPage'), Boolean(fixture(name).faq?.length), 'FAQPage only with visible FAQ');
  });
}

test('FAQPage disappears when the page passes no visible FAQ', () => {
  const page = { ...fixture('service'), faq: undefined };
  assert.ok(!buildGraph(page)['@graph'].some((n) => n['@type'] === 'FAQPage'));
});

test('serialized graph cannot close its script tag', () => {
  const page = { ...fixture('home'), name: 'x</script><script>alert(1)</script>' };
  const json = serializeGraph(page);
  assert.ok(!json.includes('</script'), 'no raw </script');
  assert.equal(JSON.parse(json)['@graph'][0].name, page.name, 'round-trips');
});

test('EN page ids live under /en and keep the shared entity ids', () => {
  const page = { ...fixture('contact'), language: 'en', breadcrumbs: [{ name: 'Home', path: '/' }, { name: 'Contact', path: '/kontakt' }] };
  const graph = buildGraph(page)['@graph'];
  assert.equal(graph[0]['@id'], 'https://www.zawlodzki.pl/en/kontakt#webpage');
  assert.equal(graph[0].inLanguage, 'en');
  assert.equal(graph.find((n) => n['@type'] === 'BreadcrumbList').itemListElement[0].item, 'https://www.zawlodzki.pl/en');
  assert.ok(graph.some((n) => n['@id'] === entities.person['@id']));
});

test('parity: every difference from the live JSON-LD is listed as intended', { skip: !HAS_INVENTORY && 'needs migration/00-inventory' }, () => {
  const rows = SAMPLES.flatMap((name) => liveDiff(name, buildGraph(fixture(name))).map((d) => ({ name, ...d })));
  const unexplained = rows.filter((r) => !r.reason);
  if (UPDATE) {
    const table = rows.map((r) => `| ${r.name} | \`${r.id.replace('https://www.zawlodzki.pl', '')}\` | ${r.change} | ${r.reason ?? '**UNEXPLAINED**'} |`);
    writeFileSync(
      here('./PARITY.md'),
      [
        '# JSON-LD parity with the live site',
        '',
        'Generated by `UPDATE_SNAPSHOTS=1 node --test apps/web/src/seo/` from `migration/00-inventory/live-site/jsonld/`. Each row is a difference between the live graph and `buildGraph()` on the same page. Nodes are compared by `@id` after inlined nodes are lifted to the top level, so a row means a real change in data, not in nesting.',
        '',
        '| Page | Node | Change | Why |',
        '|---|---|---|---|',
        ...table,
        '',
      ].join('\n'),
    );
  }
  assert.deepEqual(unexplained, [], 'unlisted differences');
  const unused = INTENDED.filter((rule) => !rows.some((r) => r.reason === rule.reason));
  assert.deepEqual(unused.map((r) => r.reason), [], 'every intended rule still matches something');
});
