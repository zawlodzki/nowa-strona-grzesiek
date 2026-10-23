import type { Language } from '../../seo/types.ts';
import { sanityQuery } from '../../lib/sanity/client.ts';

export type SanityQuery = (groq: string) => Promise<unknown>;

/** `/en` has no trailing slash because `trailingSlash` is `never`. */
export type HomeHref = '/' | '/en';

export interface NavLink {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly current: boolean;
}

export type NavView =
  | { readonly kind: 'none' }
  | { readonly kind: 'ready'; readonly links: readonly NavLink[]; readonly pill: NavLink };

export interface FooterLink {
  readonly key: string;
  readonly label: string;
  readonly href: string;
}

export type Consent =
  | { readonly kind: 'on-link'; readonly link: FooterLink }
  | { readonly kind: 'added'; readonly label: 'Zarządzaj zgodami' };

export interface FooterContent {
  readonly before: readonly FooterLink[];
  readonly consent: Consent;
  readonly after: readonly FooterLink[];
}

export type ChromeView =
  | { readonly kind: 'empty' }
  | {
      readonly kind: 'ready';
      readonly home: HomeHref;
      readonly logoLabel: 'logo Grzegorz Zawłodzki';
      readonly menuLabel: 'Menu';
      readonly navLabel: 'Nawigacja' | 'Navigation';
      readonly footerLabel: 'Stopka' | 'Footer';
      readonly logoCurrent: boolean;
      readonly nav: NavView;
      readonly footer: FooterContent;
    };

// Same grammar as the studio `link.href` rule. This task cannot import that file.
const HREF = /^(\/(?!\/)[^\s]*|#[^\s]+|https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9 -]+)$/;

const CONSENT_LABEL = 'Zarządzaj zgodami';
const LOGO_LABEL = 'logo Grzegorz Zawłodzki' as const;

const COPY = {
  pl: { home: '/', menuLabel: 'Menu', navLabel: 'Nawigacja', footerLabel: 'Stopka' },
  en: { home: '/en', menuLabel: 'Menu', navLabel: 'Navigation', footerLabel: 'Footer' },
} as const satisfies Record<Language, {
  home: HomeHref;
  menuLabel: 'Menu';
  navLabel: 'Nawigacja' | 'Navigation';
  footerLabel: 'Stopka' | 'Footer';
}>;

type StoredLink = {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly path: string | null;
};

type StoredNav =
  | { readonly kind: 'none' }
  | { readonly kind: 'ready'; readonly links: readonly StoredLink[]; readonly pill: StoredLink };

type StoredConsent =
  | { readonly kind: 'on-link'; readonly link: StoredLink }
  | { readonly kind: 'added'; readonly label: typeof CONSENT_LABEL };

type StoredDocument = {
  readonly language: Language;
  readonly nav: StoredNav;
  readonly footer: {
    readonly before: readonly StoredLink[];
    readonly consent: StoredConsent;
    readonly after: readonly StoredLink[];
  };
};

const cache = new WeakMap<SanityQuery, Map<Language, Promise<StoredDocument | null>>>();

export async function chromeView(language: Language, pathname: string, query: SanityQuery = sanityQuery): Promise<ChromeView> {
  const parsed = await load(language, query);
  return parsed === null ? { kind: 'empty' } : viewOf(parsed, pathname);
}

function load(language: Language, query: SanityQuery): Promise<StoredDocument | null> {
  let byLanguage = cache.get(query);
  if (byLanguage === undefined) {
    byLanguage = new Map();
    cache.set(query, byLanguage);
  }
  const cached = byLanguage.get(language);
  if (cached !== undefined) return cached;
  // Stored before the query settles so a second caller shares this promise, including a rejection.
  const pending = Promise.resolve()
    .then(() => query(groqFor(language)))
    .then((raw) => parseDocument(raw, language));
  byLanguage.set(language, pending);
  return pending;
}

function groqFor(language: Language): string {
  switch (language) {
    case 'pl':
      return '*[_type == "siteSettings" && language == "pl"][0]{ language, nav[]{ _key, label, href }, footer[]{ _key, label, href } }';
    case 'en':
      return '*[_type == "siteSettings" && language == "en"][0]{ language, nav[]{ _key, label, href }, footer[]{ _key, label, href } }';
    default: {
      const unexpected: never = language;
      throw new Error(`siteSettings: unsupported language ${unexpected}`);
    }
  }
}

function parseDocument(raw: unknown, language: Language): StoredDocument | null {
  if (raw === null) return null;
  const record = readRecord(raw, 'siteSettings');
  if (record.language !== language) fail(`language is ${JSON.stringify(record.language)}, expected ${language}`);
  return {
    language,
    nav: partitionNav(readLinks(record.nav, 'nav')),
    footer: partitionFooter(readLinks(record.footer, 'footer')),
  };
}

function partitionNav(links: readonly StoredLink[]): StoredNav {
  const pill = links.at(-1);
  if (pill === undefined) return { kind: 'none' };
  return { kind: 'ready', links: links.slice(0, -1), pill };
}

function partitionFooter(links: readonly StoredLink[]): StoredDocument['footer'] {
  const match = links.findIndex((link) => link.label === CONSENT_LABEL);
  if (match === -1) return { before: links, consent: { kind: 'added', label: CONSENT_LABEL }, after: [] };
  const link = links[match];
  if (link === undefined) fail('footer consent item is missing');
  return { before: links.slice(0, match), consent: { kind: 'on-link', link }, after: links.slice(match + 1) };
}

function readLinks(value: unknown, list: string): StoredLink[] {
  if (!Array.isArray(value)) fail(`${list} is missing`);
  const keys = new Set<string>();
  return value.map((item) => {
    const record = readRecord(item, `${list} item`);
    const key = readKey(record._key, list);
    if (keys.has(key)) fail(`${list} repeats _key ${JSON.stringify(key)}`);
    keys.add(key);
    const href = readHref(record.href, list);
    return { key, label: readLabel(record.label, list), href, path: equalityPath(href) };
  });
}

function readRecord(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(`${message} is not a document`);
  return value as Record<string, unknown>;
}

function readKey(value: unknown, list: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(`${list} item is missing _key`);
  return value;
}

function readLabel(value: unknown, list: string): string {
  if (typeof value !== 'string') fail(`${list} item is missing a label`);
  const label = value.trim();
  if (!/\S/.test(label)) fail(`${list} item has a blank label`);
  return label;
}

function readHref(value: unknown, list: string): string {
  if (typeof value !== 'string') fail(`${list} item is missing an href`);
  const href = value.trim();
  if (!HREF.test(href)) fail(`${list} item href ${JSON.stringify(href)} does not match the link grammar`);
  return href;
}

function equalityPath(href: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURI(href);
  } catch {
    fail(`href ${JSON.stringify(href)} cannot be decoded`);
  }
  if (href.charAt(0) === '#') return null;
  if (href.slice(0, 7) === 'mailto:') return null;
  if (href.slice(0, 4) === 'tel:') return null;
  if (href.slice(0, 8) === 'https://' || href.slice(0, 7) === 'http://') {
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      fail(`href ${JSON.stringify(href)} is not a URL`);
    }
    if (url.hostname !== 'zawlodzki.pl' && url.hostname !== 'www.zawlodzki.pl') return null;
    return stripTrailingSlash(url.pathname);
  }
  const path = decoded.split(/[?#]/, 1)[0] ?? decoded;
  return stripTrailingSlash(path);
}

function requestPath(pathname: string): string {
  let decoded: string;
  try {
    decoded = decodeURI(pathname);
  } catch {
    fail(`pathname ${JSON.stringify(pathname)} cannot be decoded`);
  }
  // Static build pathnames are the HTML files (`/kontakt.html`, `/index.html`). The Worker serves the path without that suffix.
  let path = stripTrailingSlash(decoded);
  if (path.endsWith('.html')) path = path.slice(0, -'.html'.length);
  if (path === '/index' || path === '') return '/';
  return path;
}

function stripTrailingSlash(path: string): string {
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function viewOf(parsed: StoredDocument, pathname: string): ChromeView {
  const page = requestPath(pathname);
  const copy = COPY[parsed.language];
  return {
    kind: 'ready',
    home: copy.home,
    logoLabel: LOGO_LABEL,
    menuLabel: copy.menuLabel,
    navLabel: copy.navLabel,
    footerLabel: copy.footerLabel,
    logoCurrent: page === copy.home,
    nav: parsed.nav.kind === 'none'
      ? { kind: 'none' }
      : {
          kind: 'ready',
          links: parsed.nav.links.map((link) => navLink(link, page)),
          pill: navLink(parsed.nav.pill, page),
        },
    footer: {
      before: parsed.footer.before.map(footerLink),
      consent: parsed.footer.consent.kind === 'added'
        ? parsed.footer.consent
        : { kind: 'on-link', link: footerLink(parsed.footer.consent.link) },
      after: parsed.footer.after.map(footerLink),
    },
  };
}

function navLink(link: StoredLink, page: string): NavLink {
  return {
    key: link.key,
    label: link.label,
    href: link.href,
    current: link.path !== null && link.path === page,
  };
}

function footerLink(link: StoredLink): FooterLink {
  return { key: link.key, label: link.label, href: link.href };
}

function fail(message: string): never {
  throw new Error(`siteSettings: ${message}`);
}
