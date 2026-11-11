import { readFile, writeFile } from 'node:fs/promises';

// Read-only planner. It never uploads assets or submits mutations.
const query = '*[_type in ["page", "testimonial"]]';
const response = await fetch(`https://8u2zjhvn.api.sanity.io/v2025-02-19/data/query/production?${new URLSearchParams({ query, perspective: 'published' })}`);
if (!response.ok) throw new Error(`Public query failed: ${response.status}`);
const { result: docs } = await response.json();
const facts = JSON.parse(await readFile('migration/lanes/design/out/t40-asana/facts.json', 'utf8'));
const proposals = new Map(facts.proposals.map(p => [p.before, p.after]));
if ([...proposals.values()].some(v => !v)) throw new Error('Unresolved badge proposal');
const changes = [];
const mutations = [];
const add = (doc, fields) => {
  if (!doc?._id || !doc._rev) throw new Error('Missing document revision');
  const set = {};
  for (const { path, before, after } of fields) {
    changes.push({ document: doc._id, revision: doc._rev, path, before, after, action: JSON.stringify(before) === JSON.stringify(after) ? 'already-correct' : 'patch' });
    if (JSON.stringify(before) !== JSON.stringify(after)) set[path] = after;
  }
  if (Object.keys(set).length) mutations.push({ patch: { id: doc._id, ifRevisionID: doc._rev, set } });
};
for (const doc of docs.filter(d => d._type === 'page')) {
  const fields = [];
  for (const section of doc.sections ?? []) {
    const prefix = `sections[_key=="${section._key}"]`;
    if (section._type === 'pricing') for (const plan of section.plans ?? []) {
      if (proposals.has(plan.name)) fields.push({ path: `${prefix}.plans[_key=="${plan._key}"].name`, before: plan.name, after: proposals.get(plan.name) });
    }
    if (doc.slug?.current === '/audyt-sprzedazy' && section._type === 'hero') {
      fields.push({ path: `${prefix}.cta.label`, before: section.cta?.label, after: 'Umów audyt sprzedaży' });
      fields.push({ path: `${prefix}.cta.href`, before: section.cta?.href, after: '/kontakt' });
    }
  }
  if (fields.length) add(doc, fields);
}
const smmash = docs.find(d => d._id === 'testimonial-c38cec50fbdd326e');
const logo = { _type: 'contentImage', alt: 'logo smmash', asset: { _ref: 'image-1f702fbcbd7648de63bca8acd1161b8c36230e69-349x72-webp', _type: 'reference' } };
add(smmash, [{ path: 'image', before: smmash?.image, after: logo }]);
const output = {
  dryRun: true,
  assetPlan: { action: 'reuse-existing-asset', asset: logo.asset._ref, source: 'https://cdn.sanity.io/images/8u2zjhvn/production/1f702fbcbd7648de63bca8acd1161b8c36230e69-349x72.webp', fallback: 'Only if asset is absent: coordinator downloads the approved logo and uploads it as a Sanity image after explicit approval, then reruns the planner with its returned asset reference. This script performs no uploads.' },
  changes, mutations,
};
const text = JSON.stringify(output, null, 2) + '\n';
if (process.argv[2]) await writeFile(process.argv[2], text); else process.stdout.write(text);
