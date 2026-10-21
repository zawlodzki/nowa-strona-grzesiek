import assert from 'node:assert/strict'
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'

const read = (relative) => JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8'))
const contract = read('../../../migration/contracts/blocks.json')
const schema = read('../schema.json')
const types = new Map(schema.map((type) => [type.name, type]))
const sections = types.get('page').attributes.sections.value.of.of.map((item) => item.rest.name)
assert.deepEqual(sections, contract.blocks.map((block) => block.type))
for (const block of contract.blocks) {
  const attributes = types.get(block.type).value.attributes
  assert.deepEqual(Object.keys(attributes).filter((name) => name !== '_type').sort(), Object.keys(block.fields).sort(), block.type)
}
const portableMembers = types.get('portableText').value.of.of
const names = portableMembers.map((member) => member.rest?.name ?? member.attributes?._type?.value.value)
assert.deepEqual(names, ['block', ...Object.keys(contract.portableText.objects)])
const styles = portableMembers[0].attributes.style.value.of.map((style) => style.value)
assert.deepEqual(styles, contract.portableText.styles)
console.log('PASS contract blocks, fields, Portable Text members and styles')

const baseline = {
  _id: 't07-schema-check', _type: 'page', _rev: 'test',
  _createdAt: '2026-10-21T12:00:00Z', _updatedAt: '2026-10-21T12:00:00Z',
  language: 'pl', title: 'Próba schematu', slug: {_type: 'slug', current: '/t07-schema-check'},
  seo: {_type: 'seo', title: 'Próba schematu', description: 'Dokument do lokalnej walidacji z pliku.'},
  sections: [{_key: 'rich', _type: 'richText', body: [{
    _key: 'paragraph', _type: 'block', style: 'normal', markDefs: [],
    children: [{_key: 'span', _type: 'span', marks: [], text: 'Próba'}],
  }]}],
}
const cases = [
  ['language', (doc) => {doc.language = 'de'}, ['language']],
  ['seo-title', (doc) => {doc.seo.title = 'x'.repeat(61)}, ['seo', 'title']],
  ['seo-description', (doc) => {doc.seo.description = 'x'.repeat(161)}, ['seo', 'description']],
  ['uppercase-path', (doc) => {doc.slug.current = '/UPPERCASE'}, ['slug']],
  ['missing-alt', (doc) => {doc.sections[0].body = [{_key: 'image', _type: 'image'}]}, ['sections', {_key: 'rich'}, 'body', {_key: 'image'}, 'alt']],
  ['unknown-diagram', (doc) => {doc.sections = [{_key: 'feature', _type: 'feature', heading: 'Test', body: baseline.sections[0].body, mediaSide: 'left', media: {_type: 'media', kind: 'diagram', key: 'unknown'}}]}, ['sections', {_key: 'feature'}, 'media']],
]
const docs = [baseline, {...structuredClone(baseline), _id: 't07-schema-check-en', language: 'en'}]
for (const [name, mutate] of cases) {
  const doc = structuredClone(baseline)
  doc._id = `t07-${name}`
  mutate(doc)
  docs.push(doc)
}
const scratch = mkdtempSync(join(tmpdir(), 't07-schema-'))
try {
  const file = join(scratch, 'fixtures.ndjson')
  writeFileSync(file, docs.map((doc) => JSON.stringify(doc)).join('\n') + '\n')
  const result = spawnSync('pnpm', ['exec', 'sanity', 'documents', 'validate', '--file', file, '--yes', '--format', 'ndjson'], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8',
    env: {...process.env, SANITY_STUDIO_DATASET: 'development'},
  })
  assert.equal(result.status, 1, result.stderr)
  const reports = result.stdout.split('\n').filter((line) => line.startsWith('{')).map((line) => JSON.parse(line))
  for (const id of ['t07-schema-check', 't07-schema-check-en']) {
    assert.equal(reports.some((report) => report.documentId === id), false, `${id} must validate cleanly`)
  }
  for (const [name, , expectedPath] of cases) {
    const report = reports.find((entry) => entry.documentId === `t07-${name}`)
    assert.ok(report, `${name} must fail`)
    assert.ok(report.markers.some((marker) => JSON.stringify(marker.path).startsWith(JSON.stringify(expectedPath).slice(0, -1))), `${name} must fail at ${JSON.stringify(expectedPath)}`)
    console.log(`PASS rejects ${name}`)
  }
  console.log('PASS PL and EN documents validate from files; no dataset writes')
} finally {
  rmSync(scratch, {recursive: true, force: true})
}
