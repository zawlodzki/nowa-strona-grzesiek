import { markdownPath } from '../lib/markdown.ts';
import { prefersMarkdown } from './markdown-accept.ts';

type Assets = { fetch(request: Request): Promise<Response> };

const CONDITIONAL_HEADERS = ['If-Match', 'If-None-Match', 'If-Modified-Since', 'If-Unmodified-Since'];
const RANGE_HEADERS = ['Range', 'If-Range'];

function varyOnAccept(response: Response): Response {
  const vary = response.headers.get('Vary')?.split(',').map((value) => value.trim().toLowerCase());
  if (!vary?.includes('accept') && !vary?.includes('*')) response.headers.append('Vary', 'Accept');
  return response;
}

function htmlResponse(asset: Response): Response {
  if (asset.status !== 304 && !asset.headers.get('Content-Type')?.toLowerCase().startsWith('text/html')) return asset;
  if (![200, 206, 304].includes(asset.status)) return asset;
  return varyOnAccept(new Response(asset.body, asset));
}

async function pageRobots(html: Response): Promise<string[]> {
  const directives: string[] = [];
  const header = html.headers.get('X-Robots-Tag');
  if (header) directives.push(header);

  let headEnded = false;
  const rewritten = new HTMLRewriter()
    .on('head', { element: (head) => head.onEndTag(() => { headEnded = true; }) })
    .on('head meta[name="robots"]', { element(meta) {
      const content = meta.getAttribute('content');
      if (content) directives.push(content);
    } })
    .transform(html);
  const reader = rewritten.body?.getReader();
  if (reader) {
    while (!headEnded) {
      if ((await reader.read()).done) return directives;
    }
    await reader.cancel();
  }
  return directives;
}

export async function negotiateMarkdown({
  request,
  assets,
  preservePageRobots,
}: {
  request: Request;
  assets: Assets;
  preservePageRobots: boolean;
}): Promise<Response> {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method) || !/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(url.pathname)) {
    return assets.fetch(request);
  }
  if (!prefersMarkdown(request.headers.get('Accept'))) return htmlResponse(await assets.fetch(request));

  const inspectionHeaders = new Headers(request.headers);
  const ignored = [...CONDITIONAL_HEADERS, ...RANGE_HEADERS];
  for (const name of ignored) inspectionHeaders.delete(name);
  const inspectAsGet = preservePageRobots && request.method === 'HEAD';
  const inspect = inspectAsGet || ignored.some((name) => request.headers.has(name));
  const html = await assets.fetch(inspect
    ? new Request(request, { method: inspectAsGet ? 'GET' : request.method, headers: inspectionHeaders })
    : request);
  const fallback = async () => {
    if (!inspect) return htmlResponse(html);
    await html.body?.cancel();
    return htmlResponse(await assets.fetch(request));
  };
  if (html.status !== 200 || !html.headers.get('Content-Type')?.toLowerCase().startsWith('text/html')) return fallback();

  url.pathname = markdownPath(url.pathname);
  const headers = new Headers(request.headers);
  for (const name of RANGE_HEADERS) headers.delete(name);
  const markdown = await assets.fetch(new Request(url, { method: request.method, headers }));
  if (![200, 304, 412].includes(markdown.status)) {
    await markdown.body?.cancel();
    return fallback();
  }

  const response = new Response(markdown.body, markdown);
  response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  response.headers.set('Cache-Control', 'private, no-store');
  if (preservePageRobots) {
    const directives = await pageRobots(html);
    if (directives.length) response.headers.set('X-Robots-Tag', directives.join(', '));
    else response.headers.delete('X-Robots-Tag');
  } else {
    await html.body?.cancel();
  }
  return varyOnAccept(response);
}
