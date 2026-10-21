// Workers static assets canonicalize `/path/` and `/path.html` with a 307.
// The Webflow site answered these with 301, so keep the permanent status for SEO.
export function permanentCanonicalRedirect(response: Response, requestUrl: URL): Response {
  if (response.status !== 307 && response.status !== 308) return response;
  const location = response.headers.get('Location');
  if (!location) return response;
  const target = new URL(location, requestUrl);
  if (target.origin !== requestUrl.origin) return response;
  return Response.redirect(target.toString(), 301);
}
