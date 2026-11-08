import {defineLocations, presentationTool} from 'sanity/presentation'

export function documentLocation(language: unknown, path: unknown): string | undefined {
  if (language !== 'pl' && language !== 'en') return
  if (typeof path !== 'string' || !/^(\/|\/[a-z0-9]+(?:[a-z0-9/-]*[a-z0-9])?)$/.test(path) || path.includes('//') || path === '/404') return
  return language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path
}

const locations = defineLocations({
  select: {title: 'title', path: 'slug.current', language: 'language'},
  resolve: (doc) => {
    const href = documentLocation(doc?.language, doc?.path)
    return href
      ? {locations: [{title: typeof doc?.title === 'string' ? doc.title : href, href}]}
      : {locations: [], message: 'Uzupełnij język i poprawny adres strony, aby otworzyć podgląd.', tone: 'caution'}
  },
})

export const presentation = presentationTool({
  previewUrl: {
    initial: process.env.SANITY_STUDIO_PREVIEW_URL || 'https://preview.zawlodzki.pl',
    previewMode: {enable: '/api/preview'},
  },
  resolve: {locations: {page: locations, post: locations}},
})
