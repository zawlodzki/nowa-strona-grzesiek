// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.zawlodzki.pl',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
});
