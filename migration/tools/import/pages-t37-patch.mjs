import { readFile, writeFile } from 'node:fs/promises';

// Emits a mutation for coordinator review. Never sends a mutation to Sanity.
const file = process.argv[2];
if (!file) throw new Error('Usage: node pages-t37-patch.mjs <page.json> [output.json]');
const doc = JSON.parse(await readFile(file, 'utf8'));
if (doc.slug?.current !== '/wdrozenie-ai-w-sprzedazy-b2b') throw new Error('Unexpected page');
const sections = structuredClone(doc.sections);
const logo = sections.find(s => s._key === 'fb0f53241470');
if (logo.intro === logo.title) delete logo.intro;
const problem = sections.find(s => s._key === '8792f6caacf9');
const caption = problem.body.find(b => b._key === 'c1616bf1bade');
if (caption) {
  problem.mediaCaption = caption.children.map(s => s.text).join('');
  problem.body = problem.body.filter(b => b !== caption);
}
const changes = sections.flatMap((s, i) => JSON.stringify(s) === JSON.stringify(doc.sections[i]) ? [] : [{before: doc.sections[i], after: s}]);
const output = {document: doc._id, changes, mutations: changes.length ? [{patch: {id: doc._id, ifRevisionID: doc._rev, set: {sections}}}] : []};
const json = JSON.stringify(output, null, 2) + '\n';
if (process.argv[3]) await writeFile(process.argv[3], json); else process.stdout.write(json);
