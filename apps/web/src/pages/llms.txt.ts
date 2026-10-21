import type { APIRoute } from 'astro';
import { loadDiscovery } from './sitemap/_content.ts';
import { renderLlms } from './sitemap/_render.ts';

export const GET: APIRoute = async () =>
  new Response(renderLlms(await loadDiscovery()), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
