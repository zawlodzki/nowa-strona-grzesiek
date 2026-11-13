import {getPublishedId, type SlugIsUniqueValidator} from 'sanity'

// A document's draft (`drafts.<id>`) and its versions in content releases
// (`versions.<releaseId>.<id>`) share the slug of the published document, so
// `sanity::versionOf` excludes all of them. Any other page or post with the
// same slug and language is a conflict.
export const slugConflictQuery =
  '!defined(*[_type in ["page", "post"] && language == $language && slug.current == $slug && !sanity::versionOf($publishedId)][0]._id)'

export const isSlugUnique: SlugIsUniqueValidator = async (slug, context) => {
  const document = context.document
  if (!document) return false
  return context.getClient({apiVersion: '2026-10-21'}).fetch<boolean>(slugConflictQuery, {
    slug,
    language: document.language,
    publishedId: getPublishedId(document._id),
  })
}
