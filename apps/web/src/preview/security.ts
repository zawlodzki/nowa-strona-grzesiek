import { hasPreviewSession } from './session.ts';

export interface PreviewEnvironment {
  SANITY_API_READ_TOKEN: string;
  SANITY_DATASET: string;
  SANITY_STUDIO_URL: string;
  PREVIEW_AUTH_USER: string;
  PREVIEW_AUTH_PASSWORD: string;
}

export function readEnvironment(value: unknown): PreviewEnvironment | undefined {
  if (typeof value !== 'object' || value === null) return;
  const record = value as Record<string, unknown>;
  const keys = ['SANITY_API_READ_TOKEN', 'SANITY_DATASET', 'SANITY_STUDIO_URL', 'PREVIEW_AUTH_USER', 'PREVIEW_AUTH_PASSWORD'] as const;
  for (const key of keys) {
    const field = record[key];
    if (typeof field !== 'string' || !field.trim()) return;
  }
  const config = value as PreviewEnvironment;
  if (!/^[a-z0-9_-]+$/.test(config.SANITY_DATASET) || config.PREVIEW_AUTH_USER.includes(':')) return;
  try {
    const studio = new URL(config.SANITY_STUDIO_URL);
    if (studio.protocol !== 'https:' && !(studio.protocol === 'http:' && studio.hostname === 'localhost')) return;
    if (studio.username || studio.password || studio.search || studio.hash) return;
  } catch { return; }
  return config;
}

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

export async function authorized(request: Request, env: PreviewEnvironment): Promise<boolean> {
  const header = request.headers.get('authorization');
  if (await hasPreviewSession(request, env)) return true;
  if (!header?.startsWith('Basic ')) return false;
  let decoded: string;
  try {
    decoded = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(header.slice(6)), (byte) => byte.charCodeAt(0)));
  } catch { return false; }
  const [received, expected] = await Promise.all([digest(decoded), digest(`${env.PREVIEW_AUTH_USER}:${env.PREVIEW_AUTH_PASSWORD}`)]);
  let difference = 0;
  for (let i = 0; i < received.length; i++) difference |= received[i]! ^ expected[i]!;
  return difference === 0;
}

export function privateResponse(response: Response, studioUrl?: string): Response {
  const result = new Response(response.body, response);
  result.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  result.headers.set('Cache-Control', 'private, no-store, max-age=0');
  result.headers.set('Vary', 'Authorization, Cookie');
  result.headers.set('Referrer-Policy', 'no-referrer');
  result.headers.set('X-Content-Type-Options', 'nosniff');
  const origin = studioUrl ? new URL(studioUrl).origin : undefined;
  const hostedStudio = studioUrl && new URL(studioUrl).hostname.endsWith('.sanity.studio');
  result.headers.set('Content-Security-Policy', `frame-ancestors 'self'${origin ? ` ${origin}` : ''}${hostedStudio ? ' https://www.sanity.io' : ''}`);
  return result;
}

export async function servePreview(request: Request, bindings: unknown, render: (env: PreviewEnvironment) => Promise<Response>): Promise<Response> {
  const env = readEnvironment(bindings);
  if (!env) return privateResponse(new Response('Preview configuration is incomplete.', { status: 503 }));
  if (new URL(request.url).pathname === '/robots.txt') {
    return privateResponse(new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }), env.SANITY_STUDIO_URL);
  }
  if (new URL(request.url).pathname === '/api/preview') {
    if (request.method !== 'GET') return privateResponse(new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET' } }), env.SANITY_STUDIO_URL);
    try { return privateResponse(await render(env), env.SANITY_STUDIO_URL); }
    catch { return privateResponse(new Response('Preview authorization is unavailable.', { status: 502 }), env.SANITY_STUDIO_URL); }
  }
  if (!await authorized(request, env)) {
    return privateResponse(new Response('Preview requires authentication.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Sanity preview", charset="UTF-8"' } }), env.SANITY_STUDIO_URL);
  }
  try {
    if (!['GET', 'HEAD'].includes(request.method)) return privateResponse(new Response('Method not allowed.', { status: 405, headers: { Allow: 'GET, HEAD' } }), env.SANITY_STUDIO_URL);
    return privateResponse(await render(env), env.SANITY_STUDIO_URL);
  } catch {
    return privateResponse(new Response('Preview is temporarily unavailable.', { status: 502 }), env.SANITY_STUDIO_URL);
  }
}
