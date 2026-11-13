import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {isSlugUnique, slugConflictQuery} from './slugUnique.ts'

// Evaluate the real GROQ with groq-js, the evaluator Sanity itself ships.
const fromSanity = createRequire(createRequire(import.meta.url).resolve('sanity'))
const {parse, evaluate} = fromSanity('groq-js')

const page = (_id, slug, language = 'pl', _type = 'page') => ({_id, _type, language, slug: {_type: 'slug', current: slug}})
const dataset = [
  page('page-oferta', '/oferta'),
  page('drafts.page-oferta', '/oferta'),
  page('versions.rT93ctalabels.page-oferta', '/oferta'),
  page('page-kontakt', '/kontakt'),
  page('post-en', '/blog/tekst', 'en', 'post'),
]

function context(_id, language = 'pl') {
  return {
    document: {_id, _type: 'page', language},
    getClient: () => ({
      fetch: async (query, params) => (await evaluate(parse(query, {params}), {dataset, params})).get(),
    }),
  }
}
const unique = (slug, _id, language) => isSlugUnique(slug, context(_id, language))

for (const [kind, id] of [
  ['published id', 'page-oferta'],
  ['draft id', 'drafts.page-oferta'],
  ['release version id', 'versions.rT93ctalabels.page-oferta'],
  ['version id in another release', 'versions.rOther.page-oferta'],
]) {
  test(`${kind} does not conflict with its own published, draft or release copies`, async () => {
    assert.equal(await unique('/oferta', id), true)
  })
  test(`${kind} still conflicts with another document's slug`, async () => {
    assert.equal(await unique('/kontakt', id), false)
  })
}

test('a new document in a release conflicts with a published slug', async () => {
  assert.equal(await unique('/oferta', 'versions.rT93ctalabels.page-nowa'), false)
  assert.equal(await unique('/oferta', 'drafts.page-nowa'), false)
})

test('the same slug in another language is not a conflict', async () => {
  assert.equal(await unique('/blog/tekst', 'page-oferta', 'pl'), true)
  assert.equal(await unique('/blog/tekst', 'versions.rT93ctalabels.post-nowy', 'en'), false)
})

test('an unused slug is unique', async () => {
  assert.equal(await unique('/nowa-strona', 'versions.rT93ctalabels.page-oferta'), true)
})

test('no document means not unique', async () => {
  assert.equal(await isSlugUnique('/oferta', {document: undefined, getClient: () => assert.fail('no fetch')}), false)
})

test('the query excludes every version of the document', () => {
  assert.match(slugConflictQuery, /!sanity::versionOf\(\$publishedId\)/)
})
