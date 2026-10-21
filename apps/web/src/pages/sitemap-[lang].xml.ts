import type { APIRoute, GetStaticPaths } from 'astro';
import type { Language } from '../seo/types.ts';
import { loadDiscovery } from './sitemap/_content.ts';
import { renderUrlset, sitemapLanguages } from './sitemap/_render.ts';

export const getStaticPaths = (async () =>
  sitemapLanguages(await loadDiscovery()).map((lang) => ({ params: { lang } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) =>
  new Response(renderUrlset(await loadDiscovery(), params.lang as Language), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
