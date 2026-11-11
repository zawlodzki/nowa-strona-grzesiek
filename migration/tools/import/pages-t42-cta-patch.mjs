import { readFile, writeFile } from 'node:fs/promises';

// Offline planner. No client, credentials, network calls or mutation submission.
const input = process.argv[2];
if (!input) throw new Error('Usage: node pages-t42-cta-patch.mjs export.json [report.json] [patched.json]');
const raw = await readFile(input, 'utf8');
let parsed;
try { parsed = JSON.parse(raw); } catch { parsed = raw.trim().split('\n').map(line => JSON.parse(line)); }
const docs = Array.isArray(parsed) ? parsed : parsed.result;
if (!Array.isArray(docs)) throw new Error('Expected document array, public query result or NDJSON export');
const plan = JSON.parse(await readFile(new URL('../../lanes/design/out/t42-cta/plan.json', import.meta.url), 'utf8'));
const changes = [], skipped = [], mutations = [];
const pathOf = d => d._type === 'post' ? `/blog/${d.slug?.current.replace(/^\/?blog\//, '').replace(/^\//, '')}` : d.slug?.current;
const link = label => ({ _type: 'link', label, href: '/kontakt' });
function visit(value, path, fn) {
  if (!value || typeof value !== 'object') return;
  fn(value, path);
  for (const [key, child] of Object.entries(value)) {
    if (Array.isArray(child)) child.forEach((v, i) => visit(v, `${path}${path ? '.' : ''}${key}[${v?._key ? `_key==${JSON.stringify(v._key)}` : i}]`, fn));
    else if (child && typeof child === 'object') visit(child, `${path}${path ? '.' : ''}${key}`, fn);
  }
}
for (const row of plan.copy) {
  const [page, before, href, after] = row;
  const doc = docs.find(d => pathOf(d) === page && !d._id.startsWith('drafts.'));
  if (!doc) throw new Error(`Missing page ${page}`);
  let found = 0;
  visit(doc, '', (v, path) => {
    if (v._type === 'span' && (v.text === before || v.text === after)) {
      if (v.text === before) {
        changes.push({ page, document: doc._id, path: `${path}.text`, before, after });
        v.text = after;
      }
      found++;
      return;
    }
    if (v.label !== before && v.label !== after) return;
    if (v.href !== href) return;
    found++;
    if (page === '/audyt-sprzedazy' && path.startsWith('sections[') && doc.sections.find(s => path.startsWith(`sections[_key==${JSON.stringify(s._key)}]`))?._type === 'hero') {
      skipped.push({ page, path: `${path}.label`, reason: 'T40 hero overlap', before, after }); return;
    }
    if (v.label === after) return;
    changes.push({ page, document: doc._id, path: `${path}.label`, before, after });
    v.label = after;
  });
  if (!found) throw new Error(`Missing expected CTA on ${page}: ${before}`);
}
for (const [page, kind, anchor, label] of plan.additions) {
  const doc = docs.find(d => pathOf(d) === page && !d._id.startsWith('drafts.'));
  if (!doc) throw new Error(`Missing page ${page}`);
  const key = `t42-${kind}`;
  if (kind === 'pt') {
    const body = doc.body;
    if (!Array.isArray(body)) throw new Error(`Missing body ${page}`);
    if (body.some(b => b._key === key)) continue;
    const at = body.findIndex(b => b.children?.map(s => s.text).join('').trim() === anchor);
    if (at < 0) throw new Error(`Missing heading ${page}: ${anchor}`);
    const contact = docs.find(d => pathOf(d) === '/kontakt');
    if (!contact?._id) throw new Error('Missing contact reference');
    const block = { _key: key, _type: 'block', style: 'normal', markDefs: [{ _key: 'contact', _type: 'internalLink', reference: { _type: 'reference', _ref: contact._id } }], children: [{ _key: 'text', _type: 'span', marks: ['contact'], text: label }] };
    body.splice(at, 0, block);
    changes.push({ page, document: doc._id, path: `body (before ${anchor})`, before: null, after: block });
  } else {
    const sections = doc.sections;
    if (sections.some(s => s._key === key)) continue;
    const at = sections.findIndex(s => (s.heading ?? s.title) === anchor);
    if (at < 0) throw new Error(`Missing section ${page}: ${anchor}`);
    if (kind === 'feature') {
      const section = sections[at];
      if (section._type !== 'feature' || (section.cta && section.cta.label !== label)) throw new Error(`CTA conflict ${page}`);
      if (section.cta?.label === label) continue;
      section.cta = link(label);
      changes.push({ page, document: doc._id, path: `sections[_key==${JSON.stringify(section._key)}].cta`, before: null, after: section.cta });
    } else {
      const block = { _key: key, _type: 'ctaBand', cta: link(label) };
      sections.splice(at, 0, block);
      changes.push({ page, document: doc._id, path: `sections (before ${anchor})`, before: null, after: block });
    }
  }
}
// Guard whole-array replacements by the source revision. Only modified arrays are set.
for (const doc of docs) {
  const own = changes.filter(c => c.document === doc._id);
  if (!own.length) continue;
  if (!doc._rev || !doc._id) throw new Error('Missing id/revision');
  const set = {};
  for (const c of own) { const field = c.path.split(/[. [\]]/)[0]; set[field] = doc[field]; }
  mutations.push({ patch: { id: doc._id, ifRevisionID: doc._rev, set } });
}
const report = JSON.stringify({ dryRun: true, changes, skipped, mutations }, null, 2) + '\n';
if (process.argv[3]) await writeFile(process.argv[3], report); else process.stdout.write(report);
if (process.argv[4]) await writeFile(process.argv[4], JSON.stringify(docs, null, 2) + '\n');
