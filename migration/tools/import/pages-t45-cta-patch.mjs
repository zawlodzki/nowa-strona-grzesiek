import { readFile, writeFile } from 'node:fs/promises';

// Offline only. Emits revision-guarded proposals; never submits mutations.
if (!process.argv[2]) throw new Error('Usage: node pages-t45-cta-patch.mjs export.json [report.json]');
const raw = await readFile(process.argv[2], 'utf8');
let parsed;
try { parsed = JSON.parse(raw); } catch { parsed = raw.trim().split('\n').map(line => JSON.parse(line)); }
const docs = Array.isArray(parsed) ? parsed : parsed.result;
if (!Array.isArray(docs)) throw new Error('Expected documents, query result or NDJSON');
const course = docs.filter(d => d._type === 'page' && d.slug?.current === '/kurs-ai-w-sprzedazy' && !d._id?.startsWith('drafts.'));
if (course.length !== 1) throw new Error('Expected exactly one published course');
const doc = course[0];
if (!doc._id || !doc._rev || !Array.isArray(doc.sections)) throw new Error('Missing id, revision or sections');
const tabs = doc.sections.filter(s => s._type === 'tabs');
const changes = [], mutations = [];
const link = { _type: 'link', label: 'Zapytaj o pracę na Twoim CRM', href: '/kontakt' };
for (const section of tabs) {
  if (!section._key || doc.sections.filter(s => s._key === section._key).length !== 1) throw new Error('Ambiguous section key');
  const set = {};
  for (const item of section.items ?? []) {
    if (!item._key || section.items.filter(i => i._key === item._key).length !== 1) throw new Error('Ambiguous tab key');
    if (item.secondaryCta) {
      if (item.secondaryCta.label === link.label && item.secondaryCta.href === link.href) continue;
      throw new Error('Existing secondary CTA conflicts with proposal');
    }
    const path = `sections[_key==${JSON.stringify(section._key)}].items[_key==${JSON.stringify(item._key)}].secondaryCta`;
    set[path] = link;
    changes.push({ path, before: null, after: link });
  }
  if (Object.keys(set).length) mutations.push({ patch: { id: doc._id, ifRevisionID: doc._rev, set } });
}
const report = { dryRun: true, applied: false, document: doc._id, revision: doc._rev, tabs: tabs.length,
  sections: doc.sections.map(s => ({ key: s._key, type: s._type, heading: s.heading })),
  finding: tabs.length ? 'Proposal only. Human review required before any write.' : 'No tabs in current course. No patch proposed; converting the program is outside T45.',
  intendedSecondaryCta: link, changes, mutations };
const output = JSON.stringify(report, null, 2) + '\n';
if (process.argv[3]) await writeFile(process.argv[3], output); else process.stdout.write(output);
