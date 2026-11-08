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
  return body.result;
}
