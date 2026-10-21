// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.zawlodzki.pl',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [{
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
