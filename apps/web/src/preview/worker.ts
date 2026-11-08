import { handle } from '@astrojs/cloudflare/handler';
import { servePreview } from './security.ts';

export default {
  fetch(request: Request, env: Parameters<typeof handle>[1], context: Parameters<typeof handle>[2]): Promise<Response> {
    return servePreview(request, env, () => handle(request, env, context)).then((response) => request.method === 'HEAD' ? new Response(null, response) : response);
  },
};
