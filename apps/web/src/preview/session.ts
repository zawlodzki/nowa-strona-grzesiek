import type { PreviewEnvironment } from './security.ts';

export const sessionCookieName = '__Host-sanity-preview-session';
const sessionSeconds = 3600;
const encoder = new TextEncoder();

async function sessionKey(env: PreviewEnvironment) {
  return crypto.subtle.importKey('raw', encoder.encode(env.PREVIEW_AUTH_PASSWORD), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function message(expires: number, request: Request, env: PreviewEnvironment) {
  return encoder.encode(JSON.stringify(['sanity-preview-v1', expires, new URL(request.url).origin, env.SANITY_DATASET]));
}

export async function createPreviewSession(request: Request, env: PreviewEnvironment, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + sessionSeconds;
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', await sessionKey(env), message(expires, request, env)));
  const value = `${expires}.${btoa(String.fromCharCode(...signature)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`;
  return `${sessionCookieName}=${value}; Path=/; Max-Age=${sessionSeconds}; HttpOnly; Secure; SameSite=None; Partitioned`;
}

export async function hasPreviewSession(request: Request, env: PreviewEnvironment, now = Date.now()): Promise<boolean> {
  const values = (request.headers.get('cookie') ?? '').split(';').map((part) => part.trim()).filter((part) => part.startsWith(`${sessionCookieName}=`));
  if (values.length !== 1) return false;
  const match = /^([0-9]{10})\.([A-Za-z0-9_-]{43})$/.exec(values[0]!.slice(sessionCookieName.length + 1));
  if (!match) return false;
  const expires = Number(match[1]);
  const current = Math.floor(now / 1000);
  if (expires <= current || expires > current + sessionSeconds) return false;
  try {
    const signature = Uint8Array.from(atob(match[2]!.replaceAll('-', '+').replaceAll('_', '/') + '='), (byte) => byte.charCodeAt(0));
    return await crypto.subtle.verify('HMAC', await sessionKey(env), signature, message(expires, request, env));
  } catch { return false; }
}

export function previewRedirect(value: string, request: Request): string | undefined {
  if (!value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20\x7f]/.test(value)) return;
  let decoded: string;
  try { decoded = decodeURIComponent(value); } catch { return; }
  if (decoded.startsWith('//') || /[\\\x00-\x20\x7f]/.test(decoded) || /%[0-9a-f]{2}/i.test(decoded)) return;
  const url = new URL(value, request.url);
  if (url.origin !== new URL(request.url).origin || url.pathname === '/api/preview') return;
  return url.pathname + url.search + url.hash;
}
