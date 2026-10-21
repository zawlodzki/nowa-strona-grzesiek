import { REDIRECTS, type RedirectRule } from './redirects.data.ts';

const RULES: ReadonlyMap<string, RedirectRule> = new Map(REDIRECTS.map((rule) => [rule.path, rule]));

/** Legacy Webflow paths from url-map.csv. Exact, case-sensitive match, so uppercase variants stay 404. */
export function legacyRedirect(url: URL): Response | null {
  const rule = RULES.get(url.pathname);
  if (!rule) return null;
  const target = new URL(rule.to, url);
  if (rule.query) {
    const params = new URLSearchParams(url.search);
    if (!params.has(rule.query)) return null;
    params.delete(rule.query);
    target.search = params.toString();
  } else {
    target.search = url.search;
  }
  return Response.redirect(target.toString(), 301);
}
