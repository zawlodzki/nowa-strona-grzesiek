import { readFile } from 'node:fs/promises';
// Build-time GROQ over the live public API. Every page, post and discovery file reads through here.
// Not apicdn: a webhook build starts seconds after a publish or delete, and the CDN can still serve the old result.

const PROJECT_ID = '8u2zjhvn';
const API_VERSION = 'v2025-02-19';

/** `SANITY_DATASET=development pnpm build` renders the importers' dataset; the default is what production serves. */
export const dataset = process.env.SANITY_DATASET || 'production';

export async function sanityQuery(query: string): Promise<unknown> {
  const url = new URL(`https://${PROJECT_ID}.api.sanity.io/${API_VERSION}/data/query/${dataset}`);
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'published');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity query on "${dataset}": HTTP ${response.status} ${await response.text()}`);
  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null || !('result' in body)) throw new Error(`Sanity query on "${dataset}": no result`);
  return applyLocalOverlay(body.result);
}

/** Explicit local build proof only. Fail closed in CI and production builds. */
export async function applyLocalOverlay(result: unknown): Promise<unknown> {
  const file = process.env.T32_LOCAL_DOCUMENTS;
  if (!file) return result;
  if (process.env.CI || process.env.CF_PAGES || process.env.WORKERS_CI || process.env.NODE_ENV === 'production') {
    throw new Error('T32_LOCAL_DOCUMENTS is only allowed in explicit local proof builds');
  }
  if (typeof result !== 'object' || result === null || !('pages' in result) || !Array.isArray(result.pages)) return result;
  const docs = (await readFile(file, 'utf8')).trim().split('\n').map((line) => JSON.parse(line) as { _id: string; _type: string });
  if (docs.some((doc) => doc._type !== 'page')) throw new Error('Local overlay accepts page documents only');
  const byId = new Map(docs.map((doc) => [doc._id, doc]));
  return { ...result, pages: result.pages.map((doc: { _id: string }) => byId.get(doc._id) ?? doc) };
}
