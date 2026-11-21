// T125: split the data side of one preview render into query, stega encoding and parsing.
// Run from apps/web: node --experimental-strip-types ../../migration/lanes/web/out/T125/measure-data.ts <before|after> [href] [runs]
// `before` sends the full site query T19 used; `after` sends the route-scoped preview query.
// Without SANITY_API_READ_TOKEN it reads the public dataset with the published perspective, which has the same shape and size.
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fetchSite } from '../../../../../apps/web/src/lib/sanity/site.ts';
import { buildRoutes } from '../../../../../apps/web/src/lib/sanity/routes.ts';
import { encodeDisplayField, previewQuery, routeDocument } from '../../../../../apps/web/src/preview/site.ts';
import { selectPreviewDocuments } from '../../../../../apps/web/src/preview/selection.ts';

// Resolve the client from apps/web so this script uses the exact version the preview Worker ships.
const web = createRequire(new URL('../../../../../apps/web/package.json', import.meta.url));
const { createClient } = await import(pathToFileURL(web.resolve('@sanity/client')).href);
const { stegaEncodeSourceMap } = await import(pathToFileURL(web.resolve('@sanity/client/stega')).href);

const mode = process.argv[2];
if (mode !== 'before' && mode !== 'after') throw new Error('First argument must be before or after.');
const href = process.argv[3] ?? '/blog/aplikacje-ktore-sprawdzilem-w-4-biznesach';
const runs = Number(process.argv[4] ?? 5);
const token = process.env.SANITY_API_READ_TOKEN;
const dataset = process.env.SANITY_DATASET ?? 'development';
const studioUrl = 'https://zawlodzki.sanity.studio';
const client = createClient({ projectId: '8u2zjhvn', dataset, apiVersion: '2025-02-19', token, useCdn: false, perspective: token ? 'drafts' : 'published' });
const ms = (start: number) => Math.round((performance.now() - start) * 10) / 10;

let siteQuery = '';
await fetchSite(async (q) => { siteQuery = q; return { pages: [], posts: [], assets: [], logos: [], testimonials: [], services: [], person: null, translations: [] }; });
const query = mode === 'after' ? previewQuery(siteQuery) : siteQuery;
const params = mode === 'after' ? routeDocument(href) : {};

const rows: Record<string, number | string>[] = [];
for (let i = 0; i < runs; i++) {
  let start = performance.now();
  const response = await client.fetch(query, params, { filterResponse: false, resultSourceMap: 'withKeyArraySelector' });
  const queryMs = ms(start);
  const bytes = JSON.stringify(response.result).length;
  start = performance.now();
  const encoded = stegaEncodeSourceMap(response.result, response.resultSourceMap, { enabled: true, studioUrl, filter: ({ sourcePath }) => encodeDisplayField(sourcePath) });
  const stegaMs = ms(start);
  start = performance.now();
  const selected = selectPreviewDocuments(encoded, href);
  const selectMs = ms(start);
  start = performance.now();
  const site = await fetchSite(async () => selected);
  const parseMs = ms(start);
  start = performance.now();
  const route = buildRoutes(site).find((item) => item.href === href);
  const routesMs = ms(start);
  if (!route) throw new Error(`No route for ${href}`);
  rows.push({ run: i + 1, queryMs, resultKB: Math.round(bytes / 1024), sourceMapKB: Math.round(JSON.stringify(response.resultSourceMap).length / 1024), stegaMs, selectMs, parseMs, routesMs, pages: site.pages.length, posts: site.posts.length });
}
console.log(`mode=${mode} href=${href} dataset=${dataset} perspective=${token ? 'drafts' : 'published'} node=${process.version}`);
console.table(rows);
