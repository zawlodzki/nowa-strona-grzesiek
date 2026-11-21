import { createClient } from '@sanity/client';
import { fetchSite } from '../lib/sanity/site.ts';
import { selectPreviewDocuments } from './selection.ts';
import type { PreviewEnvironment } from './security.ts';

const DISPLAY_FIELDS = new Set(['title', 'heading', 'subheading', 'text', 'label', 'description', 'excerpt', 'alt', 'caption', 'question', 'answer', 'q', 'a', 'name', 'quote', 'tagline', 'body', 'unit', 'priceNote', 'role', 'company']);
const DISPLAY_ARRAYS = new Set(['features', 'bullets', 'points', 'badges']);

export function encodeDisplayField(path: (string | number | { _key: string })[]): boolean {
  const field = path.at(-1);
  return typeof field === 'string' ? DISPLAY_FIELDS.has(field) : typeof field === 'number' && DISPLAY_ARRAYS.has(String(path.at(-2)));
}

export class PreviewUnavailableError extends Error {}

export function previewClient(env: PreviewEnvironment) {
  return createClient({
    projectId: '8u2zjhvn', dataset: env.SANITY_DATASET,
    apiVersion: '2025-02-19', token: env.SANITY_API_READ_TOKEN,
    useCdn: false, perspective: 'drafts',
    stega: { enabled: true, studioUrl: env.SANITY_STUDIO_URL, filter: ({ sourcePath }) => encodeDisplayField(sourcePath) },
  });
}

const PAGES = '"pages": *[_type == "page"]';
const POSTS = '"posts": *[_type == "post"]';

/**
 * The site query with full content only for the documents behind one route. Other pages lose their sections, other posts keep
 * one body block and no FAQ: those fields render only on their own route, and the first block keeps the incomplete-document check.
 * Links, cards, related posts and every other key of the production query stay unchanged.
 */
export function previewQuery(siteQuery: string): string {
  if (!siteQuery.includes(PAGES) || !siteQuery.includes(POSTS)) throw new Error('The site query no longer selects pages and posts the way the preview expects.');
  const elsewhere = '!(language == $language && slug.current == $path)';
  return siteQuery
    .replace(PAGES, `${PAGES}{..., ${elsewhere} => {"sections": []}}`)
    .replace(POSTS, `${POSTS}{..., ${elsewhere} => {"body": body[0...1], "faq": []}}`);
}

/** The language and document slug a preview route renders. Blog listing pages render the page at `/blog`. */
export function routeDocument(href: string): { language: 'pl' | 'en'; path: string } {
  const english = href === '/en' || href.startsWith('/en/');
  const path = english ? href.slice(3) || '/' : href;
  return { language: english ? 'en' : 'pl', path: /^\/blog\/strona\/\d+$/.test(path) ? '/blog' : path };
}

export function loadPreviewSite(env: PreviewEnvironment, href: string) {
  const client = previewClient(env);
  return fetchSite(async (query) => {
    let result: unknown;
    try { result = await client.fetch<unknown>(previewQuery(query), routeDocument(href)); }
    catch { throw new PreviewUnavailableError('Sanity preview is unavailable.'); }
    return selectPreviewDocuments(result, href);
  });
}
