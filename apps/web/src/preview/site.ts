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

export function loadPreviewSite(env: PreviewEnvironment, href: string) {
  const client = previewClient(env);
  return fetchSite(async (query) => {
    let result: unknown;
    try { result = await client.fetch<unknown>(query); }
    catch { throw new PreviewUnavailableError('Sanity preview is unavailable.'); }
    return selectPreviewDocuments(result, href);
  });
}
