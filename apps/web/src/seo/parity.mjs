// Diffs buildGraph() output against the live JSON-LD for one sample page.
import { isDeepStrictEqual } from 'node:util';
import { SAMPLES, liveJsonLd } from './fixtures/derive.mjs';

/** Live ids that the new graph renames on purpose. Applied before diffing so the rest compares by node. */
const RENAMED_IDS = { 'https://www.zawlodzki.pl/blog/ai-w-sprzedazy': 'https://www.zawlodzki.pl/blog/ai-w-sprzedazy#article' };

/** Every expected difference, matched against `<id> <change>`. A row with no match fails the test. */
export const INTENDED = [
  { match: /#website `potentialAction` removed/, reason: 'SearchAction dropped (decision 6)' },
  { match: /#website `publisher` .*#organization.*→.*#person/, reason: 'Person is the primary entity (decision 3)' },
  { match: /#article `publisher` .*#organization.*→.*#person/, reason: 'Person is the primary entity (decision 3)' },
  { match: /\/#webpage `about` .*#organization.*→.*#person/, reason: 'Home is about the Person (decision 3)' },
  { match: /#website `inLanguage` "pl-PL" →/, reason: 'entities.json lists both site languages' },
  { match: /#person `email` "mailto:/, reason: 'entities.json stores a plain email, as ContactPoint does' },
  { match: /#webpage `description` /, reason: 'WebPage.description is seo.description; Webflow kept a second hand-written copy' },
  { match: /#webpage `mainEntity` added/, reason: 'Service page names its Service as main entity, like the course page' },
  { match: /\/o-mnie#webpage `about` added/, reason: 'ProfilePage is about the Person' },
  { match: /#service `url` added/, reason: 'Service node carries its page URL, as the stubs already did' },
  { match: /#course `termsOfService` removed/, reason: 'Not a Course property; validator.schema.org warns on it' },
  { match: /#article `image` "/, reason: 'Post image is an ImageObject (dimensions once assets move to Sanity, T17)' },
  { match: /#article `mainEntityOfPage` "/, reason: 'BlogPosting points at <url>#webpage by @id' },
  { match: /\/blog\/[^ ]+#webpage node added/, reason: 'Posts get a WebPage node with breadcrumb' },
  { match: /\/blog#blog node added/, reason: 'Typed Blog stub instead of a dangling @id' },
  { match: /\(blank BreadcrumbList\) node removed|\/blog\/[^ ]+#breadcrumb node added/, reason: 'Post breadcrumb gets <url>#breadcrumb and is referenced from the WebPage' },
];

/** Lifts every inlined node with an @id (plus data) to the top level, so both sides compare per @id. */
function index(blocks) {
  const nodes = new Map();
  const lift = (value) => {
    if (Array.isArray(value)) return value.map(lift);
    if (!value || typeof value !== 'object') return value;
    const out = Object.fromEntries(Object.entries(value).filter(([k]) => k !== '@context').map(([k, v]) => [k, lift(v)]));
    if (typeof out['@id'] === 'string') out['@id'] = RENAMED_IDS[out['@id']] ?? out['@id'];
    if (out['@id'] && Object.keys(out).length > 1) {
      nodes.set(out['@id'], { ...nodes.get(out['@id']), ...out });
      return { '@id': out['@id'] };
    }
    return out;
  };
  for (const block of blocks) for (const node of block['@graph'] ?? [block]) {
    const lifted = lift(node);
    if (!lifted['@id']) nodes.set(`(blank ${lifted['@type']})`, lifted);
  }
  return nodes;
}

const short = (v) => {
  const s = JSON.stringify(v);
  return s.length > 90 ? `${s.slice(0, 87)}...` : s;
};

export function liveDiff(name, graph) {
  const live = index(liveJsonLd(SAMPLES[name].file));
  const ours = index([graph]);
  const rows = [];
  for (const id of new Set([...live.keys(), ...ours.keys()])) {
    const a = live.get(id);
    const b = ours.get(id);
    if (!b) rows.push({ id, change: `node removed (${a['@type']})` });
    else if (!a) rows.push({ id, change: `node added (${b['@type']})` });
    else
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (isDeepStrictEqual(a[key], b[key])) continue;
        if (!(key in b)) rows.push({ id, change: `\`${key}\` removed, was ${short(a[key])}` });
        else if (!(key in a)) rows.push({ id, change: `\`${key}\` added: ${short(b[key])}` });
        else rows.push({ id, change: `\`${key}\` ${short(a[key])} → ${short(b[key])}` });
      }
  }
  return rows.map((row) => ({ ...row, reason: INTENDED.find((r) => r.match.test(`${row.id} ${row.change}`))?.reason }));
}
