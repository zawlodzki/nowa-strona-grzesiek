export function robotsResponse(url: URL): Response | undefined {
  if (url.pathname !== '/robots.txt' || url.hostname === 'www.zawlodzki.pl') return;
  return new Response('User-agent: *\nDisallow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
