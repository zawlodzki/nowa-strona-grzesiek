import assert from 'node:assert/strict';
import test from 'node:test';
import { chromeView } from './settings.ts';

const PL_GROQ = '*[_type == "siteSettings" && language == "pl"][0]{ language, nav[]{ _key, label, href }, footer[]{ _key, label, href } }';
const EN_GROQ = '*[_type == "siteSettings" && language == "en"][0]{ language, nav[]{ _key, label, href }, footer[]{ _key, label, href } }';

const twoItem = {
  language: 'pl',
  nav: [
    { _key: 'a', label: 'O mnie', href: '/o-mnie' },
    { _key: 'b', label: 'Bezpłatna konsultacja', href: '/kontakt' },
  ],
  footer: [{ _key: 'c', label: 'Regulamin', href: '/regulamin' }],
};

test('null returns kind empty', async () => {
  let calls = 0;
  const query = async () => {
    calls += 1;
    return null;
  };
  assert.deepEqual(await chromeView('en', '/en', query), { kind: 'empty' });
  assert.deepEqual(await chromeView('en', '/kontakt', query), { kind: 'empty' });
  assert.deepEqual(await chromeView('pl', '/', query), { kind: 'empty' });
  assert.equal(calls, 2);
});

test('a two-item nav puts the first in links and the second in pill, and on /kontakt only the pill is current', async () => {
  const onContact = await chromeView('pl', '/kontakt', async () => twoItem);
  assert.deepEqual(onContact, {
    kind: 'ready',
    home: '/',
    logoLabel: 'logo Grzegorz Zawłodzki',
    menuLabel: 'Menu',
    navLabel: 'Nawigacja',
    footerLabel: 'Stopka',
    logoCurrent: false,
    nav: {
      kind: 'ready',
      links: [{ key: 'a', label: 'O mnie', href: '/o-mnie', current: false }],
      pill: { key: 'b', label: 'Bezpłatna konsultacja', href: '/kontakt', current: true },
    },
    footer: {
      before: [{ key: 'c', label: 'Regulamin', href: '/regulamin' }],
      consent: { kind: 'added', label: 'Zarządzaj zgodami' },
      after: [],
    },
  });
});

test('the same query function on / and /kontakt runs once, and the current flags differ', async () => {
  let calls = 0;
  const query = async () => {
    calls += 1;
    return twoItem;
  };
  const onHome = await chromeView('pl', '/', query);
  const onContact = await chromeView('pl', '/kontakt', query);
  assert.equal(calls, 1);
  assert.equal(onHome.kind, 'ready');
  assert.equal(onContact.kind, 'ready');
  if (onHome.kind !== 'ready' || onContact.kind !== 'ready') return;
  assert.equal(onHome.nav.kind, 'ready');
  assert.equal(onContact.nav.kind, 'ready');
  if (onHome.nav.kind !== 'ready' || onContact.nav.kind !== 'ready') return;
  assert.equal(onHome.nav.links[0]?.current, false);
  assert.equal(onHome.nav.pill.current, false);
  assert.equal(onContact.nav.links[0]?.current, false);
  assert.equal(onContact.nav.pill.current, true);
  assert.equal(onHome.nav.pill.href, onContact.nav.pill.href);
});

test('a pl document requested as en rejects and stays rejected', async () => {
  let calls = 0;
  const query = async () => {
    calls += 1;
    return twoItem;
  };
  await assert.rejects(() => chromeView('en', '/en', query));
  await assert.rejects(() => chromeView('en', '/', query));
  assert.equal(calls, 1);
});

test('a footer without the consent label has added, and before holds every link', async () => {
  const view = await chromeView('pl', '/', async () => ({
    language: 'pl',
    nav: [],
    footer: [
      { _key: 'c', label: 'Regulamin', href: '/regulamin' },
      { _key: 'd', label: 'Blog', href: '/blog' },
    ],
  }));
  assert.equal(view.kind, 'ready');
  if (view.kind !== 'ready') return;
  assert.deepEqual(view.nav, { kind: 'none' });
  assert.deepEqual(view.footer, {
    before: [
      { key: 'c', label: 'Regulamin', href: '/regulamin' },
      { key: 'd', label: 'Blog', href: '/blog' },
    ],
    consent: { kind: 'added', label: 'Zarządzaj zgodami' },
    after: [],
  });
});

test('a footer with the label in the middle has on-link, the label is in neither array, and a later twin stays in after', async () => {
  const view = await chromeView('pl', '/', async () => ({
    language: 'pl',
    nav: [{ _key: 'pill', label: 'Bezpłatna konsultacja', href: '/kontakt' }],
    footer: [
      { _key: '1', label: 'Regulamin', href: '/regulamin' },
      { _key: '2', label: '  Zarządzaj zgodami  ', href: '/polityka-prywatnosci' },
      { _key: '3', label: 'Blog', href: '/blog' },
      { _key: '4', label: 'Zarządzaj zgodami', href: '/duplikat' },
    ],
  }));
  assert.equal(view.kind, 'ready');
  if (view.kind !== 'ready') return;
  assert.deepEqual(view.nav, {
    kind: 'ready',
    links: [],
    pill: { key: 'pill', label: 'Bezpłatna konsultacja', href: '/kontakt', current: false },
  });
  assert.deepEqual(view.footer.before, [{ key: '1', label: 'Regulamin', href: '/regulamin' }]);
  assert.deepEqual(view.footer.consent, {
    kind: 'on-link',
    link: { key: '2', label: 'Zarządzaj zgodami', href: '/polityka-prywatnosci' },
  });
  assert.deepEqual(view.footer.after, [
    { key: '3', label: 'Blog', href: '/blog' },
    { key: '4', label: 'Zarządzaj zgodami', href: '/duplikat' },
  ]);
});

test('mailto is not current', async () => {
  const view = await chromeView('pl', '/', async () => ({
    language: 'pl',
    nav: [
      { _key: 'm', label: 'Poczta', href: ' mailto:a@zawlodzki.pl ' },
      { _key: 'b', label: 'Bezpłatna konsultacja', href: '/kontakt' },
    ],
    footer: [{ _key: 'c', label: 'Regulamin', href: '/regulamin' }],
  }));
  assert.equal(view.kind, 'ready');
  if (view.kind !== 'ready') return;
  assert.equal(view.nav.kind, 'ready');
  if (view.nav.kind !== 'ready') return;
  assert.deepEqual(view.nav.links[0], { key: 'm', label: 'Poczta', href: 'mailto:a@zawlodzki.pl', current: false });
  assert.equal(view.nav.pill.current, false);
});

test('/ is current only for pathname /', async () => {
  const raw = {
    language: 'pl',
    nav: [
      { _key: 'root', label: 'Start', href: '/' },
      { _key: 'b', label: 'Bezpłatna konsultacja', href: '/kontakt' },
    ],
    footer: [{ _key: 'c', label: 'Regulamin', href: '/regulamin' }],
  };
  for (const pathname of ['/kontakt', '/o-mnie', '/en', '/blog']) {
    const view = await chromeView('pl', pathname, async () => raw);
    assert.equal(view.kind, 'ready');
    if (view.kind !== 'ready') return;
    assert.equal(view.nav.kind, 'ready');
    if (view.nav.kind !== 'ready') return;
    assert.equal(view.nav.links[0]?.current, false, pathname);
  }
  const home = await chromeView('pl', '/', async () => raw);
  assert.equal(home.kind, 'ready');
  if (home.kind !== 'ready') return;
  assert.equal(home.nav.kind, 'ready');
  if (home.nav.kind !== 'ready') return;
  assert.equal(home.nav.links[0]?.current, true);
  assert.equal(home.nav.pill.current, false);
  assert.equal(home.logoCurrent, true);
});

test('static build pathnames ending in .html match the public path', async () => {
  const raw = {
    language: 'pl',
    nav: [
      { _key: 'a', label: 'O mnie', href: '/o-mnie' },
      { _key: 'b', label: 'Bezpłatna konsultacja', href: '/kontakt' },
    ],
    footer: [{ _key: 'c', label: 'Regulamin', href: '/regulamin' }],
  };
  const home = await chromeView('pl', '/index.html', async () => raw);
  const contact = await chromeView('pl', '/kontakt.html', async () => raw);
  const post = await chromeView('pl', '/blog/bezpieczne-przekazanie-danych.html', async () => raw);
  assert.equal(home.kind, 'ready');
  assert.equal(contact.kind, 'ready');
  assert.equal(post.kind, 'ready');
  if (home.kind !== 'ready' || contact.kind !== 'ready' || post.kind !== 'ready') return;
  assert.equal(home.logoCurrent, true);
  assert.equal(contact.logoCurrent, false);
  assert.equal(post.logoCurrent, false);
  if (contact.nav.kind !== 'ready' || home.nav.kind !== 'ready') return;
  assert.equal(home.nav.pill.current, false);
  assert.equal(contact.nav.links[0]?.current, false);
  assert.equal(contact.nav.pill.current, true);
  if (post.nav.kind !== 'ready') return;
  assert.equal(post.nav.links[0]?.current, false);
  assert.equal(post.nav.pill.current, false);
});

test('an absolute zawlodzki.pl URL is current for its pathname, and one trailing slash is ignored', async () => {
  const raw = {
    language: 'pl',
    nav: [
      { _key: 'abs', label: 'Kontakt', href: 'https://www.zawlodzki.pl/kontakt/' },
      { _key: 'apex', label: 'Oferta', href: 'http://zawlodzki.pl/oferta' },
      { _key: 'foreign', label: 'Obcy', href: 'https://example.com/kontakt' },
      { _key: 'slash', label: 'Usługi', href: '/uslugi/' },
      { _key: 'hash', label: 'Skok', href: '#kontakt' },
      { _key: 'tel', label: 'Telefon', href: 'tel:+48 600 000 000' },
      { _key: 'pill', label: 'Bezpłatna konsultacja', href: '/kontakt' },
    ],
    footer: [{ _key: 'c', label: 'Regulamin', href: '/regulamin' }],
  };
  const onContact = await chromeView('pl', '/kontakt', async () => raw);
  assert.equal(onContact.kind, 'ready');
  if (onContact.kind !== 'ready') return;
  assert.equal(onContact.nav.kind, 'ready');
  if (onContact.nav.kind !== 'ready') return;
  const byHref = new Map(onContact.nav.links.map((link) => [link.href, link.current]));
  assert.equal(byHref.get('https://www.zawlodzki.pl/kontakt/'), true);
  assert.equal(byHref.get('http://zawlodzki.pl/oferta'), false);
  assert.equal(byHref.get('https://example.com/kontakt'), false);
  assert.equal(byHref.get('/uslugi/'), false);
  assert.equal(byHref.get('#kontakt'), false);
  assert.equal(byHref.get('tel:+48 600 000 000'), false);
  assert.equal(onContact.nav.pill.current, true);

  const onOffer = await chromeView('pl', '/oferta/', async () => raw);
  assert.equal(onOffer.kind, 'ready');
  if (onOffer.kind !== 'ready') return;
  assert.equal(onOffer.nav.kind, 'ready');
  if (onOffer.nav.kind !== 'ready') return;
  assert.equal(onOffer.nav.links.find((link) => link.href === 'http://zawlodzki.pl/oferta')?.current, true);
  assert.equal(onOffer.nav.links.find((link) => link.href === 'https://www.zawlodzki.pl/kontakt/')?.current, false);

  const onServices = await chromeView('pl', '/uslugi', async () => raw);
  assert.equal(onServices.kind, 'ready');
  if (onServices.kind !== 'ready') return;
  assert.equal(onServices.nav.kind, 'ready');
  if (onServices.nav.kind !== 'ready') return;
  const services = onServices.nav.links.find((link) => link.key === 'slash');
  assert.equal(services?.href, '/uslugi/');
  assert.equal(services?.current, true);
});

test('english copy uses /en and an empty nav stays none', async () => {
  const view = await chromeView('en', '/en', async () => ({ language: 'en', nav: [], footer: [] }));
  assert.deepEqual(view, {
    kind: 'ready',
    home: '/en',
    logoLabel: 'logo Grzegorz Zawłodzki',
    menuLabel: 'Menu',
    navLabel: 'Navigation',
    footerLabel: 'Footer',
    logoCurrent: true,
    nav: { kind: 'none' },
    footer: { before: [], consent: { kind: 'added', label: 'Zarządzaj zgodami' }, after: [] },
  });
});

test('a malformed document rejects', async () => {
  const bad = [
    [],
    { language: 'pl' },
    { language: 'pl', nav: {}, footer: [] },
    { language: 'pl', nav: [{ _key: 'a', label: ' ', href: '/a' }], footer: [] },
    { language: 'pl', nav: [{ _key: 'a', label: 'A', href: 'javascript:alert(1)' }], footer: [] },
    { language: 'pl', nav: [{ _key: 'a', label: 'A', href: '/%' }], footer: [] },
    {
      language: 'pl',
      nav: [
        { _key: 'a', label: 'A', href: '/a' },
        { _key: 'a', label: 'B', href: '/b' },
      ],
      footer: [],
    },
    { language: 'en', nav: [], footer: [] },
  ];
  for (const raw of bad) {
    await assert.rejects(() => chromeView('pl', '/', async () => raw));
  }
});

test('a thrown query stays cached for that function and language', async () => {
  let calls = 0;
  const query = async () => {
    calls += 1;
    throw new Error('HTTP 500');
  };
  await assert.rejects(() => chromeView('pl', '/', query));
  await assert.rejects(() => chromeView('pl', '/kontakt', query));
  assert.equal(calls, 1);
});

test('a different query function does not reuse another function cache', async () => {
  let first = 0;
  let second = 0;
  const one = async () => {
    first += 1;
    return null;
  };
  const other = async () => {
    second += 1;
    return null;
  };
  await chromeView('pl', '/', one);
  await chromeView('pl', '/', one);
  await chromeView('pl', '/', other);
  assert.equal(first, 1);
  assert.equal(second, 1);
});

test('the query embeds the language literal and does not ask for defaultSeo', async () => {
  let seen = '';
  await chromeView('pl', '/', async (groq) => {
    seen = groq;
    return null;
  });
  assert.equal(seen, PL_GROQ);
  await chromeView('en', '/en', async (groq) => {
    seen = groq;
    return null;
  });
  assert.equal(seen, EN_GROQ);
});
