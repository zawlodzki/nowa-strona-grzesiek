// Compares every contact form and newsletter section between two `apps/web` builds.
// Usage: node compare-forms.mjs <baseline-dist> <candidate-dist>
// Exits 1 when any page's form markup differs, or when a page with a form exists in only one build.
import {readFileSync, readdirSync} from 'node:fs'
import {join, relative} from 'node:path'

const [baseDir, newDir] = process.argv.slice(2)
if (!baseDir || !newDir) throw new Error('usage: node compare-forms.mjs <baseline-dist> <candidate-dist>')

const pages = (dir) => readdirSync(dir, {recursive: true}).filter((file) => file.endsWith('.html')).map((file) => join(dir, file))
const sections = (html) => [...html.matchAll(/<section\b[^>]*class="[^"]*\b(contact|newsletter)\b[^"]*"[\s\S]*?<\/section>/g)].map((match) => match[0])

const collect = (dir) => new Map(pages(dir).flatMap((file) => {
  const found = sections(readFileSync(file, 'utf8'))
  return found.length ? [[relative(dir, file), found]] : []
}))

const base = collect(baseDir)
const next = collect(newDir)
let failures = 0
for (const page of [...new Set([...base.keys(), ...next.keys()])].sort()) {
  const a = base.get(page) ?? []
  const b = next.get(page) ?? []
  const same = a.length === b.length && a.every((section, index) => section === b[index])
  if (!same) failures++
  const kinds = b.map((section) => (section.match(/class="[^"]*\b(contact|newsletter)\b/) ?? [])[1]).join('+')
  console.log(`${same ? 'SAME' : 'DIFF'}  ${page}  ${kinds || '(missing)'}`)
}
console.log(`${base.size} baseline pages, ${next.size} candidate pages with forms, ${failures} differing`)
process.exit(failures ? 1 : 0)
