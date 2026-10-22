// The route table. Route files only pick their slice of it, so every URL the site serves is decided here.
import type { Language, SitePath } from '../../seo/types.ts';
import { localHref, loadSite, type PageDoc, type PostDoc, type Site } from './site.ts';

export const BLOG_PATH = '/blog';
export const POSTS_PER_PAGE = 12;

// Paths a Sanity page may not take: the blog index renders from posts, and /404 is the static not-found page.
const RESERVED = new Set<string>([BLOG_PATH, '/404']);

interface RouteBase {
  language: Language;
  path: SitePath;
  /** Site-relative URL with the language prefix. */
  href: string;
}

export type Route =
  | (RouteBase & { kind: 'page'; page: PageDoc })
  | (RouteBase & { kind: 'post'; post: PostDoc })
  | (RouteBase & { kind: 'blogIndex'; pageNumber: number; pageCount: number; posts: PostDoc[]; page?: PageDoc });

/** Listing page n of the blog. Page 1 is the index itself; later pages are noindex and live under /blog/strona/n. */
export function blogPagePath(pageNumber: number): SitePath {
  return pageNumber === 1 ? BLOG_PATH : `${BLOG_PATH}/strona/${pageNumber}`;
}

function blogRoutes(site: Site, language: Language): Route[] {
  const posts = site.posts.filter((post) => post.language === language);
  // PL always has a blog index; EN gets one only once it has posts.
  if (language === 'en' && !posts.length) return [];
  const page = site.pages.find((doc) => doc.language === language && doc.path === BLOG_PATH);
  const pageCount = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  return Array.from({ length: pageCount }, (_, i) => {
    const pageNumber = i + 1;
    const path = blogPagePath(pageNumber);
    return {
      kind: 'blogIndex', language, path, href: localHref(language, path), pageNumber, pageCount,
      posts: posts.slice(i * POSTS_PER_PAGE, pageNumber * POSTS_PER_PAGE),
      ...(page && { page }),
    };
  });
}

export function buildRoutes(site: Site): Route[] {
  const routes: Route[] = [];
  for (const language of ['pl', 'en'] as const) {
    for (const page of site.pages) {
      if (page.language !== language || RESERVED.has(page.path)) continue;
      routes.push({ kind: 'page', language, path: page.path, href: localHref(language, page.path), page });
    }
    for (const post of site.posts) {
      if (post.language === language) routes.push({ kind: 'post', language, path: post.path, href: localHref(language, post.path), post });
    }
    routes.push(...blogRoutes(site, language));
  }
  const seen = new Set<string>();
  for (const { href } of routes) {
    if (seen.has(href)) throw new Error(`Two routes claim ${href}`);
    seen.add(href);
  }
  return routes;
}

let pending: Promise<Route[]> | undefined;

export function loadRoutes(): Promise<Route[]> {
  pending ??= loadSite().then(buildRoutes);
  return pending;
}

/** `[...slug]` param for a route: undefined for a language root, the href without its leading slash otherwise. */
export function restParam(href: string, prefix = ''): string | undefined {
  const rest = href.slice(prefix.length).replace(/^\//, '');
  return rest || undefined;
}
