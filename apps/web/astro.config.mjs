// @ts-check
import { defineConfig } from 'astro/config';
import { cmsRedirects } from './src/worker/cms-redirects.mjs';

export default defineConfig({
  site: 'https://www.zawlodzki.pl',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [cmsRedirects(), {
    name: 'block-catalog',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({
          pattern: '/_ds/blocks-a',
          entrypoint: new URL('./src/pages/_ds/blocks-a.astro', import.meta.url),
        });
      },
    },
  }],
});
