import { permanentCanonicalRedirect } from './canonical';
import { type FormEnv, handleForm } from './form';

const PRODUCTION_HOST = 'www.zawlodzki.pl';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/form') return handleForm(request, env);
    const response = permanentCanonicalRedirect(await env.ASSETS.fetch(request), url);
    if (url.hostname === PRODUCTION_HOST) return response;
    const staged = new Response(response.body, response);
    staged.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return staged;
  },
} satisfies ExportedHandler<Env & FormEnv>;
