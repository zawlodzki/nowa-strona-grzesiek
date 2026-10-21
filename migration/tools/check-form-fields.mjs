#!/usr/bin/env node
// Check that every lead form on a rendered page carries exactly the field names Webflow had for that form.
// Usage: node check-form-fields.mjs --url <page-url> | --html <file> [--forms migration/00-inventory/webflow/forms.json]
// Forms are matched by `data-name`, which LeadForm sets to the Webflow form name. Prints names and counts only, never values.
import { readFile } from 'node:fs/promises';

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const url = arg('--url');
const file = arg('--html');
const formsPath = arg('--forms') ?? 'migration/00-inventory/webflow/forms.json';
if (!url === !file) {
  console.error('Pass exactly one of --url <page-url> or --html <file>.');
  process.exit(2);
}

const html = url ? await (await fetch(url)).text() : await readFile(file, 'utf8');
const inventory = JSON.parse(await readFile(formsPath, 'utf8'));

// Webflow's style-guide pages hold demo forms that never went live.
const expected = new Map();
for (const form of inventory.uniqueByNameAndPage) {
  if (form.path.startsWith('/style-guide')) continue;
  const names = Object.keys(form.fields).sort();
  const known = expected.get(form.displayName);
  if (known && known.join() !== names.join()) throw new Error(`forms.json has two field sets for "${form.displayName}".`);
  expected.set(form.displayName, names);
}

const attr = (tag, name) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(([markup]) => ({
  id: attr(markup, 'id'),
  name: attr(markup.slice(0, markup.indexOf('>') + 1), 'data-name'),
  fields: [...markup.matchAll(/<(?:input|textarea|select)\b[^>]*>/g)].map(([tag]) => attr(tag, 'name')).filter(Boolean),
}));

let failed = forms.length === 0;
if (failed) console.log('FAIL no <form> elements found');
for (const form of forms) {
  const want = expected.get(form.name);
  if (!want) {
    console.log(`FAIL #${form.id} data-name="${form.name}" matches no form in forms.json`);
    failed = true;
    continue;
  }
  const got = [...form.fields].sort();
  const missing = want.filter((name) => !got.includes(name));
  const extra = got.filter((name) => !want.includes(name));
  const duplicated = got.filter((name, i) => got.indexOf(name) !== i);
  const hidden = (html.match(new RegExp(`<form\\b[^>]*id="${form.id}"[\\s\\S]*?</form>`))?.[0].match(/type="hidden"/g) ?? []).length;
  const ok = !missing.length && !extra.length && !duplicated.length;
  failed ||= !ok;
  console.log(`${ok ? 'OK  ' : 'FAIL'} #${form.id} "${form.name}": ${got.length}/${want.length} fields, ${hidden} hidden` +
    (missing.length ? `, missing ${missing.join(' ')}` : '') + (extra.length ? `, extra ${extra.join(' ')}` : '') + (duplicated.length ? `, duplicated ${duplicated.join(' ')}` : ''));
}
process.exit(failed ? 1 : 0);
