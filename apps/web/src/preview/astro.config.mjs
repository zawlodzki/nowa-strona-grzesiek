import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://preview.zawlodzki.pl',
  root: fileURLToPath(new URL('.', import.meta.url)),
  srcDir: fileURLToPath(new URL('.', import.meta.url)),
  outDir: fileURLToPath(new URL('../../.wrangler/preview', import.meta.url)),
  publicDir: fileURLToPath(new URL('../../public', import.meta.url)),
  output: 'server',
  session: false,
  trailingSlash: 'never',
  adapter: cloudflare({ configPath: fileURLToPath(new URL('../../wrangler.preview.jsonc', import.meta.url)), imageService: 'passthrough' }),
});
