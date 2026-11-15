import {test} from 'node:test'
import assert from 'node:assert/strict'
import {registerHooks, createRequire} from 'node:module'
import {writeFileSync, readFileSync} from 'node:fs'
import ts from '../../node_modules/typescript/lib/typescript.js'
import React, {useState} from 'react'
import {renderToString} from 'react-dom/server'

let unstable = false
const calls = []
const evidence = []
globalThis.__T123 = {value: null, navigateIntent: (...args) => calls.push(args)}
const require = createRequire(import.meta.url)
const sanityPath = require.resolve('sanity')
const hooks = registerHooks({
  resolve(specifier, context, next) {
    if (['sanity', 'sanity/router', 'sanity/structure', 'sanity/presentation'].includes(specifier)) return {url: `mock:${specifier}`, shortCircuit: true}
    if (specifier.startsWith('.') && context.parentURL?.includes('/studio/') && !/\.[a-z]+$/.test(specifier)) return next(`${specifier}.ts`, context)
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.startsWith('mock:')) return {format: 'module', shortCircuit: true, source: `export const defineDocumentFieldAction=x=>x, definePlugin=x=>()=>x, defineLocations=x=>x, presentationTool=x=>x; export const useRouter=()=>({navigateIntent:globalThis.__T123.navigateIntent}); export const useDocumentPane=()=>({value:globalThis.__T123.value});`}
    if (url.includes('/open-in-presentation.tsx')) {
      let source = readFileSync(new URL(url.split('?')[0]), 'utf8')
      if (unstable) source = source.replace('    onAction,', '    onAction: () => onAction(),')
      return {format: 'module', shortCircuit: true, source: ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX}}).outputText}
    }
    return next(url, context)
  },
})
const {openInPresentation, openInPresentationPlugin} = await import('./components/open-in-presentation.tsx')
// Sanity 6.20 FieldActionsResolver uses react-fast-compare followed by a
// render-phase state update. Functions compare by reference. No form provider.
const deepEqual = require(require.resolve('react-fast-compare', {paths: [sanityPath]}))
function render(action, props) {
  let renders = 0, result
  function Resolver() {
    if (++renders > 10) throw new Error('render budget exceeded')
    const node = action.useAction(props)
    const [previous, setPrevious] = useState(null)
    if (!deepEqual(previous, node)) setPrevious(node)
    result = node
    return null
  }
  renderToString(React.createElement(Resolver))
  assert.equal(renders, 2)
  return result
}
test('pane header renders within budget, navigates post/page, follows edits and hides invalid/nested actions', () => {
  for (const [documentType, language, path, preview] of [['post', 'pl', '/blog/test', '/blog/test'], ['page', 'en', '/kontakt', '/en/kontakt'], ['page', 'pl', '/', '/']]) {
    globalThis.__T123.value = {title: 'Fixture', language, slug: {current: path}}
    const props = {documentType, documentId: 'drafts.fixture', path: []}
    const item = render(openInPresentation, props)
    assert.equal(item.hidden, false)
    assert.equal(item.renderAsButton, true)
    item.onAction()
    if (process.env.T123_EVIDENCE) evidence.push({documentType, language, path, title: item.title, intent: calls.at(-1)})
    assert.deepEqual(calls.pop(), ['edit', {id: 'fixture', type: documentType, mode: 'presentation', preview}])
    assert.equal(render(openInPresentation, {...props, path: ['title']}).hidden, true)
    globalThis.__T123.value = {language}
    const hidden = render(openInPresentation, props)
    assert.equal(hidden.hidden, true)
    hidden.onAction()
    assert.equal(calls.length, 0)
  }
  if (process.env.T123_EVIDENCE) writeFileSync(process.env.T123_EVIDENCE, JSON.stringify(evidence, null, 2))
  const resolve = openInPresentationPlugin().document.unstable_fieldActions
  assert.equal(resolve([], {documentType: 'person'}).length, 0)
  assert.equal(resolve([openInPresentation], {documentType: 'post'}).length, 1)
})
test('negative control: identical resolver rejects unstable onAction', async () => {
  unstable = true
  const {openInPresentation: broken} = await import('./components/open-in-presentation.tsx?unstable')
  assert.throws(() => render(broken, {documentType: 'post', documentId: 'fixture', path: []}), /render budget exceeded/)
})
