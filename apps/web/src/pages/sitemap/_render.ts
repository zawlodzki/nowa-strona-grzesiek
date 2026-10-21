import type { Language, SitePath } from '../../seo/types.ts';
import { ORIGIN, pageUrl } from '../../seo/url.ts';
import type { Discovery, DiscoveryDoc, DiscoveryService } from './_content.ts';

const BLOG_PATH: SitePath = '/blog';
const DEFAULT_NAME = 'Grzegorz Zawłodzki';
const RSS_DESCRIPTION = 'Nowe technologie w sprzedaży B2B';
const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

type Post = Extract<DiscoveryDoc, { kind: 'post' }>;
type LinkedService = DiscoveryService & { path: SitePath };
type Entry = { loc: string; lastmod?: string };

const XML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

function xml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => XML_ESCAPES[c]);
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function newest(dates: string[]): string | undefined {
  return dates.reduce<string | undefined>((max, date) => (max === undefined || date > max ? date : max), undefined);
}

function postsNewestFirst(discovery: Discovery, language: Language): Post[] {
  return discovery.docs
    .filter((doc): doc is Post => doc.kind === 'post' && doc.language === language)
    .sort((a, b) => compare(b.publishedAt, a.publishedAt));
}

/** PL always; EN only once it has documents, so the index never lists an empty child. */
export function sitemapLanguages(discovery: Discovery): Language[] {
  return discovery.docs.some((doc) => doc.language === 'en') ? ['pl', 'en'] : ['pl'];
}

// No hreflang alternates yet: EN pairs arrive with T25.
function entries(discovery: Discovery, language: Language): Entry[] {
  const docs = discovery.docs.filter((doc) => doc.language === language);
  const result: Entry[] = docs.map((doc) => ({ loc: pageUrl(language, doc.path), lastmod: doc.lastmod }));
  const posts = docs.filter((doc) => doc.kind === 'post');
  if (posts.length > 0 && !docs.some((doc) => doc.kind === 'page' && doc.path === BLOG_PATH)) {
    result.push({ loc: pageUrl(language, BLOG_PATH), lastmod: newest(posts.map((post) => post.lastmod)) });
  }
  return result.sort((a, b) => compare(a.loc, b.loc));
}

function urlElement(tag: 'url' | 'sitemap', { loc, lastmod }: Entry): string {
  return `<${tag}><loc>${xml(loc)}</loc>${lastmod ? `<lastmod>${xml(lastmod)}</lastmod>` : ''}</${tag}>`;
}

export function renderSitemapIndex(discovery: Discovery): string {
  const children = sitemapLanguages(discovery).map((language) =>
    urlElement('sitemap', {
      loc: `${ORIGIN}/sitemap-${language}.xml`,
      lastmod: newest(discovery.docs.filter((doc) => doc.language === language).map((doc) => doc.lastmod)),
    }),
  );
  return [XML_DECLARATION, '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...children, '</sitemapindex>', ''].join('\n');
}

export function renderUrlset(discovery: Discovery, language: Language): string {
  const urls = entries(discovery, language).map((entry) => urlElement('url', entry));
  return [XML_DECLARATION, '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
}

function rssItem(post: Post): string {
  const link = xml(pageUrl('pl', post.path));
  const image = post.image && xml(post.image);
  return [
    '<item>',
    `<title>${xml(post.title)}</title>`,
    `<link>${link}</link>`,
    `<guid isPermaLink="true">${link}</guid>`,
    `<description>${xml(post.description)}</description>`,
    `<pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
    ...(image ? [`<media:content url="${image}" medium="image"/>`, `<media:thumbnail url="${image}"/>`] : []),
    '</item>',
  ].join('');
}

/** PL only: the feed keeps the live `/blog/rss.xml` path, which has always been the Polish blog. */
export function renderRss(discovery: Discovery): string {
  const posts = postsNewestFirst(discovery, 'pl');
  const latest = posts[0]?.publishedAt;
  return [
    XML_DECLARATION,
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">',
    '<channel>',
    `<title>${xml(DEFAULT_NAME)}</title>`,
    `<link>${ORIGIN}</link>`,
    `<description>${xml(RSS_DESCRIPTION)}</description>`,
    '<language>pl</language>',
    ...(latest ? [`<pubDate>${new Date(latest).toUTCString()}</pubDate>`] : []),
    `<atom:link href="${ORIGIN}/blog/rss.xml" rel="self" type="application/rss+xml"/>`,
    ...posts.map(rssItem),
    '</channel>',
    '</rss>',
    '',
  ].join('\n');
}

function inline(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function link(title: string, url: string, description: string): string {
  return `- [${inline(title).replace(/[[\]]/g, '\\$&')}](${url}): ${inline(description)}`;
}

function section(heading: string, lines: string[]): string[] {
  return lines.length > 0 ? ['', `## ${heading}`, '', ...lines] : [];
}

export function renderLlms(discovery: Discovery): string {
  const { person } = discovery;
  const services = discovery.services
    .filter((service): service is LinkedService => service.language === 'pl' && service.path !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  const servicePaths = new Set(services.map((service) => service.path));
  const pages = discovery.docs
    .filter((doc) => doc.kind === 'page' && doc.language === 'pl' && doc.path !== '/' && !servicePaths.has(doc.path))
    .sort((a, b) => compare(a.path, b.path));
  return [
    `# ${inline(person?.name ?? DEFAULT_NAME)}`,
    ...(person ? ['', `> ${inline(person.description)}`] : []),
    ...section('Usługi', services.map((service) => link(service.name, pageUrl('pl', service.path), service.description))),
    ...section('Strony', pages.map((page) => link(page.title, pageUrl('pl', page.path), page.description))),
    ...section('Blog', postsNewestFirst(discovery, 'pl').map((post) => link(post.title, pageUrl('pl', post.path), post.description))),
    '',
  ].join('\n');
}

export function renderRobots(): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${ORIGIN}/sitemap.xml`, ''].join('\n');
}
