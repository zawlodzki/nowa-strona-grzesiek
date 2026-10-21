import type { APIRoute } from 'astro';
import { renderRobots } from './sitemap/_render.ts';

export const GET: APIRoute = () => new Response(renderRobots(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
