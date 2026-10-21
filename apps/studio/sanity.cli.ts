import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: '8u2zjhvn', dataset: process.env.SANITY_STUDIO_DATASET || 'production'},
  typegen: {
    path: '../web/src/**/*.{ts,tsx,js,jsx,astro}',
    schema: './schema.json',
    generates: './sanity.types.ts',
  },
})
