import type { APIRoute } from 'astro';
import { loadDiscovery } from '../sitemap/_content.ts';
import { renderRss } from '../sitemap/_render.ts';

export const GET: APIRoute = async () =>
  new Response(renderRss(await loadDiscovery()), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
