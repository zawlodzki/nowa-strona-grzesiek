import {test} from 'node:test'
import assert from 'node:assert/strict'
import {presentationEditIntent} from './presentation-intent.ts'
// The render suite exercises the real shared location resolver as well.
const locations = {page: {resolve: doc => ({locations: doc?.path && doc?.language ? [{href: doc.language === 'en' ? `/en${doc.path}` : doc.path}, {href: '/ignored'}] : []})}}
test('first location, normalized IDs and missing inputs', () => {
  for (const [documentId, id] of [['drafts.page-1', 'page-1'], ['versions.release.page-1', 'page-1'], ['page-1', 'page-1']]) {
    assert.deepEqual(presentationEditIntent({documentId, documentType: 'page', selected: {path: '/kontakt', language: 'en'}, locations}), {intent: 'edit', params: {id, type: 'page', mode: 'presentation', preview: '/en/kontakt'}})
  }
  for (const selected of [null, {}, {path: '/kontakt'}, {language: 'pl'}]) assert.equal(presentationEditIntent({documentId: 'x', documentType: 'page', selected, locations}), null)
  for (const documentType of ['post', 'toString']) assert.equal(presentationEditIntent({documentId: 'x', documentType, selected: {}, locations}), null)
})
