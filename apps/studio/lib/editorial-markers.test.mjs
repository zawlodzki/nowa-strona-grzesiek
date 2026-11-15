import {test} from 'node:test'
import assert from 'node:assert/strict'
import {scanEditorialMarkers as scan, scanDocumentEditorialMarkers as documentScan, editorialMarkerMessage} from './editorial-markers.ts'

const block = (text, _key = 'b') => ({_key, _type: 'block', children: [{_type: 'span', text}]})
test('canonical, multiline, repeated and legacy markers preserve order and keyed block paths', () => {
  const hits = scan([block('[[TODO: jeden]] [[TODO: dwa\ntrzy]] [DO UZUPEŁNIENIA] [TWÓJ KONKRET: tekst] [ETYKIETA: tekst] [PCOS]')], ['body'])
  assert.deepEqual(hits.map(({kind, label, text}) => [kind, label, text]), [
    ['canonical', 'TODO', 'jeden'], ['canonical', 'TODO', 'dwa\ntrzy'],
    ['legacy', 'DO UZUPEŁNIENIA', ''], ['legacy', 'TWÓJ KONKRET', 'tekst'], ['legacy', 'ETYKIETA', 'tekst'],
  ])
  assert.ok(hits.every(({path}) => JSON.stringify(path) === JSON.stringify(['body', {_key: 'b'}])))
})
test('generic nested fields include captions, table cells and links, excluding metadata', () => {
  const hits = scan([{_key: 'x', _type: '[[TODO: ignored]]', caption: '[[TODO: podpis]]', rows: [{cells: ['[[TODO: komórka]]']}], link: {href: '[[TODO: url]]'}}])
  assert.deepEqual(hits.map(x => x.text), ['podpis', 'komórka', 'url'])
})
test('empty, invalid, plain and incomplete inputs do not warn', () => {
  for (const value of [undefined, null, {}, '[[TODO: text]]', [], [block('[PCOS] [Mixed Case: text] [[TODO: unfinished')]]) {
    assert.deepEqual(scan(value), [])
    assert.equal(editorialMarkerMessage(value), true)
  }
})
test('unkeyed block uses index and scanner does not mutate input', () => {
  const input = [block('[[TODO: x]]', '')]
  const copy = structuredClone(input)
  assert.deepEqual(scan(input, ['body'])[0].path, ['body', 0])
  assert.deepEqual(input, copy)
})
test('post covers body and FAQ answers only with complete navigation paths', () => {
  const hits = documentScan({_type: 'post', title: '[[TODO: ignored]]', body: [block('[[TODO: body]]')], faq: [
    {_key: 'f', q: '[[TODO: ignored]]', a: [block('[[TODO: answer]]')]},
    {a: [block('[[TODO: unkeyed faq]]')]},
  ]})
  assert.deepEqual(hits.map(x => x.path), [
    ['body', {_key: 'b'}], ['faq', {_key: 'f'}, 'a', {_key: 'b'}], ['faq', 1, 'a', {_key: 'b'}],
  ])
})
test('pages including legal pages scan all section shapes and open the section', () => {
  const doc = {_type: 'page', slug: {current: '/regulamin'}, sections: [{_key: 's', _type: 'richText', body: [block('[[TODO: legal]]')]}]}
  assert.deepEqual(documentScan(doc)[0].path, ['sections', {_key: 's'}])
  assert.deepEqual(documentScan({...doc, _type: 'person'}), [])
})
test('warning counts all markers and bounds its example', () => {
  const result = editorialMarkerMessage([block('[[TODO: '+ 'a'.repeat(200) +']] [[TODO: second]]')])
  assert.match(result, /\(2\)/)
  assert.ok(result.length < 180)
})
