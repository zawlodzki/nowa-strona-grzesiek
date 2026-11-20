import {test} from 'node:test'
import assert from 'node:assert/strict'
import {registerHooks, createRequire} from 'node:module'
import {readFileSync} from 'node:fs'
import ts from '../../node_modules/typescript/lib/typescript.js'
import React, {useState} from 'react'
import {renderToString} from 'react-dom/server'

let unstable = false
globalThis.__T124 = {value: null}
const require = createRequire(import.meta.url)
const sanityPath = require.resolve('sanity')
registerHooks({
  resolve(specifier, context, next) {
    if (['sanity', 'sanity/structure'].includes(specifier)) return {url: `mock:${specifier}`, shortCircuit: true}
    if (specifier.startsWith('.') && context.parentURL?.includes('/studio/') && !/\.[a-z]+$/.test(specifier)) return next(`${specifier}.ts`, context)
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.startsWith('mock:')) return {format: 'module', shortCircuit: true, source: `export const defineDocumentInspector=x=>x, definePlugin=x=>()=>x, DocumentInspectorHeader=()=>null; export const useDocumentPane=()=>({formState:{value:globalThis.__T124.value}});`}
    if (url.includes('/editorial-markers.tsx')) {
      let source = readFileSync(new URL(url.split('?')[0]), 'utf8')
      if (unstable) source = source.replace('    icon: WarningOutlineIcon,', '    icon: () => WarningOutlineIcon({}),')
      return {format: 'module', shortCircuit: true, source: ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX}}).outputText}
    }
    return next(url, context)
  },
})
const deepEqual = require(require.resolve('react-fast-compare', {paths: [sanityPath]}))
function render(useMenuItem) {
  let renders = 0, result
  function Resolver() {
    if (++renders > 10) throw new Error('render budget exceeded')
    const item = useMenuItem()
    const [previous, setPrevious] = useState(null)
    if (!deepEqual(previous, item)) setPrevious(item)
    result = item
    return null
  }
  renderToString(React.createElement(Resolver))
  assert.equal(renders, 2)
  return result
}
const block = (text) => ({_key: 'b', _type: 'block', children: [{_type: 'span', text}]})

test('header item has a stable icon and turns caution only when markers exist', async () => {
  const {editorialMarkersPlugin} = await import('./components/editorial-markers.tsx')
  const inspectors = editorialMarkersPlugin().document.inspectors
  const [inspector] = inspectors([], {documentType: 'post'})
  assert.equal(inspectors([], {documentType: 'person'}).length, 0)

  globalThis.__T124.value = {_type: 'post', body: [block('Plain text')]}
  const clean = render(inspector.useMenuItem)
  assert.ok(clean.icon, 'header button needs an icon or it renders 0 px wide')
  assert.equal(clean.showAsAction, true)
  assert.equal(clean.tone, undefined)

  globalThis.__T124.value = {_type: 'post', body: [block('[[TODO: dopisać]]')]}
  assert.equal(render(inspector.useMenuItem).tone, 'caution')
})

test('negative control: identical resolver rejects an inline icon', async () => {
  unstable = true
  globalThis.__T124.value = {_type: 'post', body: []}
  const {editorialMarkersPlugin} = await import('./components/editorial-markers.tsx?unstable')
  const [inspector] = editorialMarkersPlugin().document.inspectors([], {documentType: 'post'})
  assert.throws(() => render(inspector.useMenuItem), /render budget exceeded/)
})
