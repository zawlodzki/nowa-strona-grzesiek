import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { validatePreviewUrl } from '@sanity/preview-url-secret';
import { urlSearchParamPreviewPathname, urlSearchParamPreviewSecret } from '@sanity/preview-url-secret/constants';
import { readEnvironment } from '../../security.ts';
import { createPreviewSession, previewRedirect } from '../../session.ts';
import { previewClient } from '../../site.ts';

export const GET: APIRoute = async ({ request }) => {
  const config = readEnvironment(env);
  if (!config) return new Response('Preview configuration is incomplete.', { status: 503 });
  const parameters = new URL(request.url).searchParams;
  if (!parameters.get(urlSearchParamPreviewSecret)?.trim()) return new Response('Invalid preview authorization.', { status: 401 });
  const requestedPath = parameters.get(urlSearchParamPreviewPathname);
  if (requestedPath !== null && !previewRedirect(requestedPath, request)) return new Response('Invalid preview redirect.', { status: 400 });
  const result = await validatePreviewUrl(previewClient(config).withConfig({ stega: false }), request.url);
  if (!result.isValid) return new Response('Invalid preview authorization.', { status: 401 });
  const location = previewRedirect(result.redirectTo ?? '/', request);
  if (!location) return new Response('Invalid preview redirect.', { status: 400 });
  return new Response(null, { status: 307, headers: {
    Location: location,
    'Set-Cookie': await createPreviewSession(request, config),
  } });
};
