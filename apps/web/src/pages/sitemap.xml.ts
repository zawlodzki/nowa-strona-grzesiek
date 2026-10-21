import type { APIRoute } from 'astro';
import { loadDiscovery } from './sitemap/_content.ts';
import { renderSitemapIndex } from './sitemap/_render.ts';

export const GET: APIRoute = async () =>
  new Response(renderSitemapIndex(await loadDiscovery()), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
