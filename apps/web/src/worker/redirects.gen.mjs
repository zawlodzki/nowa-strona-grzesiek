// Run: node apps/web/src/worker/redirects.gen.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CSV_PATH = fileURLToPath(new URL('../../../../migration/contracts/url-map.csv', import.meta.url));
export const OUT_PATH = fileURLToPath(new URL('./redirects.data.ts', import.meta.url));

const PATH = String.raw`\/[A-Za-z0-9._~\/-]*`;
const PATH_ONLY = new RegExp(`^(${PATH})$`);
const PATH_WITH_PARAM = new RegExp(`^(${PATH})\\?([A-Za-z0-9_-]+)=\\*$`);

/** RFC 4180: quoted fields may hold commas, newlines and doubled quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++;
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') row.push(field), (field = '');
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field), rows.push(row), (row = []), (field = '');
    } else field += c;
  }
  if (quoted) throw new Error('url-map.csv: unterminated quoted field');
  if (field || row.length) row.push(field), rows.push(row);
  const [header, ...records] = rows;
  return records.map((cells, n) => {
    if (cells.length !== header.length) throw new Error(`url-map.csv row ${n + 2}: ${cells.length} cells, header has ${header.length}`);
    return Object.fromEntries(header.map((key, i) => [key, cells[i]]));
  });
}

export function toRules(records) {
  const rules = records
    .filter((r) => r.action === 'redirect-301')
    .map(({ old_path, target }) => {
      if (!PATH_ONLY.test(target)) throw new Error(`url-map.csv: unsupported redirect target ${JSON.stringify(target)} for ${old_path}`);
      const plain = PATH_ONLY.exec(old_path);
      if (plain) return { path: plain[1], to: target };
      const withParam = PATH_WITH_PARAM.exec(old_path);
      if (withParam) return { path: withParam[1], query: withParam[2], to: target };
      throw new Error(`url-map.csv: unsupported old_path shape ${JSON.stringify(old_path)}`);
    });
  const seen = new Set();
  for (const { path } of rules) {
    if (seen.has(path)) throw new Error(`url-map.csv: more than one redirect-301 row for ${path}`);
    seen.add(path);
  }
  return rules;
}

export function generate(csvText) {
  const rules = toRules(parseCsv(csvText));
  const lines = rules.map((rule) => `  ${JSON.stringify(rule)},`);
  return `// Generated from migration/contracts/url-map.csv. Do not edit.
// Regenerate: node apps/web/src/worker/redirects.gen.mjs

export interface RedirectRule {
  readonly path: string;
  /** Query parameter that must be present; the redirect drops it. */
  readonly query?: string;
  readonly to: string;
}

export const REDIRECTS: readonly RedirectRule[] = [
${lines.join('\n')}
];
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(OUT_PATH, generate(readFileSync(CSV_PATH, 'utf8')));
}
