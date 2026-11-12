// Run: node --test apps/web/src/worker/cms-redirects.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderRedirects, selectRedirects } from './cms-redirects.mjs';

const site = { served: ['/', '/kontakt', '/blog/post'], contract: ['/search', '/konsultacja'] };
const select = (docs) => selectRedirects(docs, site);

test('a clean rule is kept and rendered as a 301 line', () => {
  const { rules, skipped } = select([{ from: '/stary-adres', to: '/kontakt' }, { from: '/Stara', to: '/blog/post?x=1#y' }]);
  assert.deepEqual(skipped, []);
  assert.equal(renderRedirects(rules), '/stary-adres /kontakt 301\n/Stara /blog/post?x=1#y 301\n');
});

test('rules that would break a page, a contract redirect or the Worker are skipped with a reason', () => {
  const cases = [
    [{ from: '/kontakt', to: '/' }, 'live page'],
    [{ from: '/kontakt/', to: '/' }, 'live page'],
    [{ from: '/', to: '/kontakt' }, 'clean absolute path'],
    [{ from: '/search', to: '/kontakt' }, 'contract redirect'],
    [{ from: '/api/form', to: '/kontakt' }, 'reserved'],
    [{ from: '/_astro/a.css', to: '/kontakt' }, 'reserved'],
    [{ from: '/a b', to: '/kontakt' }, 'clean absolute path'],
    [{ from: '/a?x=1', to: '/kontakt' }, 'clean absolute path'],
    [{ from: '/a/*', to: '/kontakt' }, 'clean absolute path'],
    [{ from: '//evil.example', to: '/kontakt' }, 'clean absolute path'],
    [{ from: '/a', to: 'https://evil.example' }, 'site-relative'],
    [{ from: '/a', to: '//evil.example' }, 'site-relative'],
    [{ from: '/a', to: '/a/' }, 'equals source'],
    [{ from: '/a', to: '/konsultacja' }, 'chain'],
    [{ from: undefined, to: '/kontakt' }, 'clean absolute path'],
  ];
  for (const [doc, reason] of cases) {
    const { rules, skipped } = select([doc]);
    assert.deepEqual(rules, [], JSON.stringify(doc));
    assert.match(skipped[0].reason, new RegExp(reason), JSON.stringify(doc));
  }
});

test('the first of two rules for one source wins, and a chain between CMS rules is dropped', () => {
  const { rules, skipped } = select([{ from: '/a', to: '/kontakt' }, { from: '/a', to: '/blog/post' }, { from: '/b', to: '/a' }]);
  assert.deepEqual(rules, [{ from: '/a', to: '/kontakt' }]);
  assert.deepEqual(skipped.map((s) => s.reason), ['duplicate source, newest kept', 'target is itself redirected (chain)']);
});

test('no rules gives an empty file', () => {
  assert.equal(renderRedirects([]), '');
});
