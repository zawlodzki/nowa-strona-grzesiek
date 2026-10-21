// Run: node --test apps/web/src/worker/redirects.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { REDIRECTS } from './redirects.data.ts';
import { CSV_PATH, generate, OUT_PATH, parseCsv } from './redirects.gen.mjs';
import { legacyRedirect } from './redirects.ts';

const ORIGIN = 'https://www.zawlodzki.pl';
const redirect = (path) => legacyRedirect(new URL(path, ORIGIN));
const csvRows = parseCsv(readFileSync(CSV_PATH, 'utf8')).filter((r) => r.action === 'redirect-301');

function assertRedirect(response, location) {
  assert.ok(response, 'redirects');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), location);
}

test('committed redirects.data.ts matches url-map.csv (rerun redirects.gen.mjs)', () => {
  assert.equal(readFileSync(OUT_PATH, 'utf8'), generate(readFileSync(CSV_PATH, 'utf8')));
});

test('every redirect-301 row in url-map.csv answers 301 at its target', () => {
  assert.ok(csvRows.length > 0);
  for (const { old_path, target } of csvRows) {
    assertRedirect(redirect(old_path.replace('=*', '=2')), `${ORIGIN}${target}`);
  }
});

test('path rules keep the query string', () => {
  assertRedirect(redirect('/konsultacja?utm_source=x&gclid=1'), `${ORIGIN}/wspolpraca?utm_source=x&gclid=1`);
});

test('pagination rule drops only its parameter', () => {
  assertRedirect(redirect('/blog?f95bbc04_page=2'), `${ORIGIN}/blog`);
  assertRedirect(redirect('/blog?utm_source=x&f95bbc04_page=3'), `${ORIGIN}/blog?utm_source=x`);
  assert.equal(redirect('/blog'), null);
  assert.equal(redirect('/blog?utm_source=x'), null);
});

test('uppercase variants and unknown paths fall through', () => {
  assert.equal(redirect('/Konsultacja'), null);
  assert.equal(redirect('/SEARCH'), null);
  assert.equal(redirect('/konsultacja/'), null);
  assert.equal(redirect('/nie-ma-takiej-strony'), null);
});

test('no redirect target is itself redirected', () => {
  for (const { to } of REDIRECTS) assert.equal(redirect(to), null, `${to} is a redirect source`);
});

test('generator rejects shapes it does not understand', () => {
  const header = 'old_path,action,target\n';
  assert.throws(() => generate(`${header}/a?x=1,redirect-301,/b\n`), /old_path shape/);
  assert.throws(() => generate(`${header}/a*,redirect-301,/b\n`), /old_path shape/);
  assert.throws(() => generate(`${header}/a,redirect-301,https://example.com/b\n`), /target/);
  assert.throws(() => generate(`${header}/a,redirect-301,/b\n/a,redirect-301,/c\n`), /more than one/);
  assert.match(generate(`${header}"/a",redirect-301,"/b"\n/keep,keep,\n`), /"path":"\/a","to":"\/b"/);
});
