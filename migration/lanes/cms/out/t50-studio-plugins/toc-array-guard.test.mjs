import {test} from 'node:test'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import vm from 'node:vm'

// Exercise the exact helper shipped in the patched package, without loading React.
const archive = fileURLToPath(new URL('./sanity-plugin-table-of-contents-2.0.0-t50.tgz', import.meta.url))
const runtime = execFileSync('tar', ['-xOf', archive, 'package/dist/index.js'], {encoding: 'utf8'})
const start = runtime.indexOf('function isPortableTextNew(value) {')
const end = runtime.indexOf('\nfunction getTitle(', start)
assert.ok(start >= 0 && end > start, 'find the shipped predicate')
const isPortableText = vm.runInNewContext(
  runtime.slice(start, end) + '\nisPortableTextNew',
  {isRecord: (value) => value !== null && typeof value === 'object' && !Array.isArray(value)},
)

for (const [name, value] of [
  ['undefined', undefined], ['null', null], ['text body', 'Service description'],
  ['object', {body: []}], ['array-like object', {0: {}, length: 1}],
  ['number', 12], ['boolean', false],
]) {
  test('non-array ' + name + ' is not Portable Text', () => {
    assert.equal(isPortableText(value), false)
  })
}

test('empty and section arrays remain non-Portable Text', () => {
  assert.equal(isPortableText([]), false)
  assert.equal(isPortableText([{_type: 'ctaBand', body: 'plain text'}]), false)
})

test('Portable Text headings remain recognized', () => {
  assert.equal(isPortableText([{
    _type: 'block', _key: 'heading', style: 'h2',
    children: [{_type: 'span', text: 'Heading'}], markDefs: [],
  }]), true)
})

test('malformed blocks do not crash or become Portable Text', () => {
  assert.equal(isPortableText([null, undefined, 'text', {}, {_type: 'block', children: null}]), false)
})
