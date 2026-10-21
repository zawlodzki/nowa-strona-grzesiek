#!/usr/bin/env node
// Compare two crawl.mjs outputs by URL path (host-agnostic, so staging can be compared with production).
// Usage: node diff-crawls.mjs <old-crawl-dir> <new-crawl-dir> [--out diff.csv]
// A row is emitted for every path whose SEO-relevant fields differ, or which exists on only one side.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [oldDir, newDir] = process.argv.slice(2);
const outIdx = process.argv.indexOf('--out');
const OUT = outIdx > 0 ? process.argv[outIdx + 1] : null;

const load = async (d) => {
  const recs = JSON.parse(await readFile(join(d, 'urls.json'), 'utf8'));
  return new Map(recs.map((r) => [new URL(r.url).pathname.replace(/\/$/, '') || '/', r]));
};
const path = (u) => { try { return new URL(u).pathname.replace(/\/$/, '') || '/'; } catch { return u ?? ''; } };

const FIELDS = {
  status: (r) => r.status,
  final_path: (r) => path(r.finalUrl),
  canonical_path: (r) => (r.canonical || []).map(path).join(' '),
  meta_robots: (r) => r.metaRobots || '',
  title: (r) => r.title || '',
  meta_description: (r) => r.metaDescription || '',
  h1: (r) => (r.h1 || []).join(' | '),
  lang: (r) => r.lang || '',
  hreflang: (r) => (r.hreflang || []).join(' '),
  og_title: (r) => r.social?.['og:title'] || '',
  og_image_present: (r) => Boolean(r.social?.['og:image']),
  in_sitemap: (r) => r.inSitemap,
};
const WORD_DELTA = 0.2;

const [a, b] = await Promise.all([load(oldDir), load(newDir)]);
const rows = [];
for (const p of new Set([...a.keys(), ...b.keys()])) {
  const o = a.get(p), n = b.get(p);
  if (!o || !n) { rows.push({ path: p, field: o ? 'MISSING_IN_NEW' : 'NEW_ONLY', old: o?.status ?? '', new: n?.status ?? '' }); continue; }
  for (const [f, get] of Object.entries(FIELDS)) {
    const ov = String(get(o)), nv = String(get(n));
    if (ov !== nv) rows.push({ path: p, field: f, old: ov, new: nv });
  }
  const ow = o.wordCount || 0, nw = n.wordCount || 0;
  if (ow && Math.abs(nw - ow) / ow > WORD_DELTA) rows.push({ path: p, field: 'word_count', old: ow, new: nw });
}
rows.sort((x, y) => x.path.localeCompare(y.path) || x.field.localeCompare(y.field));
const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = ['path,field,old,new', ...rows.map((r) => [r.path, r.field, r.old, r.new].map(esc).join(','))].join('\n') + '\n';
if (OUT) await writeFile(OUT, csv); else process.stdout.write(csv);
const missing = rows.filter((r) => r.field === 'MISSING_IN_NEW').length;
process.stderr.write(`${rows.length} differences, ${missing} paths missing in new\n`);
process.exitCode = missing ? 1 : 0;
