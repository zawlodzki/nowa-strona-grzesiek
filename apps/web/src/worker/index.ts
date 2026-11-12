import { permanentCanonicalRedirect } from './canonical.ts';
import { type FormEnv, handleForm } from './form.ts';
import { markdownResponse } from './markdown.ts';
import { legacyRedirect } from './redirects.ts';

import { robotsResponse } from './robots.ts';

const PRODUCTION_HOST = 'www.zawlodzki.pl';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/form') return handleForm(request, env);
    const response = robotsResponse(url) ?? await markdownResponse(request, env.ASSETS) ?? legacyRedirect(url) ?? permanentCanonicalRedirect(await env.ASSETS.fetch(request), url);
    if (url.hostname === PRODUCTION_HOST) return response;
    const staged = new Response(response.body, response);
    staged.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return staged;
  },
} satisfies ExportedHandler<Env & FormEnv>;
