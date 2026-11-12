import type { APIRoute, GetStaticPaths } from 'astro';
import { loadRoutes, type Route } from '../lib/sanity/routes.ts';
import { loadSite } from '../lib/sanity/site.ts';
import { markdownPath, renderMarkdown } from '../lib/markdown.ts';

export const getStaticPaths = (async () => (await loadRoutes()).map((route) => ({
  params: { slug: markdownPath(route.href).slice(1, -3) }, props: { route },
}))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => new Response(renderMarkdown(props.route as Route, await loadSite()), {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
