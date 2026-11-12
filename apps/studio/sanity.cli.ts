import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {projectId: '8u2zjhvn', dataset: process.env.SANITY_STUDIO_DATASET || 'production'},
  deployment: {appId: 'rlo059cofkfg52kmdzfljxr8', autoUpdates: false},
  typegen: {
    path: '../web/src/**/*.{ts,tsx,js,jsx,astro}',
    schema: './schema.json',
    generates: './sanity.types.ts',
  },
})
