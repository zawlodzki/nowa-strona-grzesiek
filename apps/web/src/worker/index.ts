import { permanentCanonicalRedirect } from './canonical';

const PRODUCTION_HOST = 'www.zawlodzki.pl';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = permanentCanonicalRedirect(await env.ASSETS.fetch(request), url);
    if (url.hostname === PRODUCTION_HOST) return response;
    const staged = new Response(response.body, response);
    staged.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return staged;
  },
} satisfies ExportedHandler<Env>;
