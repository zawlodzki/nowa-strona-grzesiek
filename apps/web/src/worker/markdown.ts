export async function markdownResponse(request: Request, assets: { fetch(request: Request): Promise<Response> }): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!/\.md\/?$/.test(url.pathname)) return undefined;
  if (url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return new Response(null, { status: 301, headers: { Location: url.href, 'X-Robots-Tag': 'noindex' } });
  }
  const asset = await assets.fetch(request);
  const response = new Response(asset.body, asset);
  if (asset.status === 200) response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  response.headers.set('X-Robots-Tag', 'noindex');
  return response;
}
