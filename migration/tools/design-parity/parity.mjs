import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const WIDTH_KIND = Symbol('widthKind');
const VERDICT = Symbol('verdict');

const TAGS = Object.freeze(['match', 'intended', 'chrome', 'lag', 'defect']);
const REASONS = Object.freeze(['missing-region', 'style', 'pixel', 'chrome-after-t27', 'assertion']);
const RANK = Object.freeze(['defect', 'chrome', 'intended', 'lag', 'match']);
const ENDS = new Set([390, 1440]);
const BREAKS = new Set([767, 479, 384]);
const EDGES = Object.freeze(['header', 'footer']);
const ORIGINS = Object.freeze(['live', 'local', 'staging']);
const SUBJECTS = Object.freeze(['local', 'staging']);
const VERDICT_KEYS = Object.freeze(['tag', 'path', 'plane', 'width', 'slot', 'edge', 'rule', 'origin', 'reason', 'regionCount', 'sbs']);
const SWALLOW_COVERAGE = 0.8;

export const SHOTS = Object.freeze([1280, 375]);
export const SLOTS = Object.freeze([
  Object.freeze({ id: 'live-local', left: 'live', right: 'local', bearing: 'load' }),
  Object.freeze({ id: 'live-staging', left: 'live', right: 'staging', bearing: 'load' }),
  Object.freeze({ id: 'local-staging', left: 'local', right: 'staging', bearing: 'lag' }),
]);

export class CoverageError extends Error {
  constructor(missing) {
    super(`coverage missing ${missing.length} keys`);
    this.name = 'CoverageError';
    this.reason = 'coverage';
    this.missing = Object.freeze(missing.map(key => Object.freeze({ ...key })));
  }
}

function brandWidth(kind, px) {
  const width = { px };
  Object.defineProperty(width, WIDTH_KIND, { value: kind });
  return Object.freeze(width);
}

export function shotWidth(px) {
  if (typeof px !== 'number' || !SHOTS.includes(px)) throw new Error(`shot width ${px}`);
  return brandWidth('shot', px);
}

export function endsWidth(px) {
  if (typeof px !== 'number' || !ENDS.has(px)) throw new Error(`ends width ${px}`);
  return brandWidth('ends', px);
}

export function breakWidth(px) {
  if (typeof px !== 'number' || !BREAKS.has(px)) throw new Error(`break width ${px}`);
  return brandWidth('break', px);
}

export function assertShot(width) {
  if (!width || width[WIDTH_KIND] !== 'shot') throw new Error('expected a shot width');
  return width;
}

function widthPx(value, kind) {
  if (value && value[WIDTH_KIND] === kind) return value.px;
  if (kind === 'shot') return assertShot(shotWidth(value)).px;
  if (kind === 'ends') return endsWidth(value).px;
  return breakWidth(value).px;
}

function slotById(id) {
  const slot = SLOTS.find(item => item.id === id);
  if (!slot) throw new Error(`unknown slot ${id}`);
  return slot;
}

function requirePath(path) {
  if (typeof path !== 'string' || path === '') throw new Error('path');
  if (path !== '/' && (!path.startsWith('/') || path.endsWith('/'))) throw new Error(`path ${path}`);
  return path;
}

function rejectColorText(value) {
  const lower = value.toLowerCase();
  if (lower.includes('oklch') || lower.includes('rgb(')) throw new Error('unconverted color');
}

function storeProp(value) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('prop');
    return value;
  }
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') throw new Error('prop');
  rejectColorText(value);
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) return trimmed.toLowerCase();
  return trimmed;
}

function copyBox(box) {
  if (!box || ['x', 'y', 'w', 'h'].some(key => !Number.isFinite(box[key]))) throw new Error('box');
  if (box.w < 0 || box.h < 0) throw new Error('box');
  return { x: box.x, y: box.y, w: box.w, h: box.h };
}

function copyRegion(region) {
  if (!region || (region.kind !== 'inner' && region.kind !== 'height' && region.kind !== 'missing')) {
    throw new Error('region kind');
  }
  if (typeof region.block !== 'string' || region.block === '') throw new Error('region block');
  const box = copyBox(region);
  return { block: region.block, kind: region.kind, x: box.x, y: box.y, w: box.w, h: box.h };
}

function copySample(sample) {
  if (!sample || !sample.props || typeof sample.props !== 'object') throw new Error('sample');
  const props = {};
  for (const [key, value] of Object.entries(sample.props)) props[key] = storeProp(value);
  return { box: sample.box == null ? null : copyBox(sample.box), props };
}

function copyShotBoxes(value) {
  if (value == null) return {};
  if (typeof value !== 'object') throw new Error('shotBoxes');
  const boxes = {};
  for (const [key, list] of Object.entries(value)) {
    const width = shotWidth(Number(key)).px;
    if (!Array.isArray(list)) throw new Error('shotBoxes');
    boxes[width] = list.map(copyBox);
  }
  return boxes;
}

function copyStrip(strip) {
  if (!strip || typeof strip.h !== 'number' || !Number.isFinite(strip.h) || strip.h < 0) throw new Error('strip h');
  if (typeof strip.empty !== 'boolean') throw new Error('strip empty');
  if (typeof strip.hash !== 'string' || strip.hash === '') throw new Error('strip hash');
  return { h: strip.h, empty: strip.empty, hash: strip.hash };
}

function stripsDiffer(left, right) {
  if (left.empty !== right.empty) return true;
  if (left.empty && right.empty) return false;
  return left.hash !== right.hash;
}

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

export function pixelFact(fields) {
  if (!fields || (fields.plane != null && fields.plane !== 'pixels')) throw new Error('plane');
  const slot = slotById(fields.slot);
  if (!Array.isArray(fields.regions)) throw new Error('regions');
  if (typeof fields.sbs !== 'string' || !/^img\/[0-9a-f]{16}\.png$/.test(fields.sbs)) throw new Error('sbs');
  if (typeof fields.leftHash !== 'string' || fields.leftHash === '') throw new Error('leftHash');
  if (typeof fields.rightHash !== 'string' || fields.rightHash === '') throw new Error('rightHash');
  return freeze({
    plane: 'pixels',
    path: requirePath(fields.path),
    width: widthPx(fields.width, 'shot'),
    slot: slot.id,
    regions: fields.regions.map(copyRegion),
    sbs: fields.sbs,
    leftHash: fields.leftHash,
    rightHash: fields.rightHash,
  });
}

export function chromeFact(fields) {
  if (!fields || (fields.plane != null && fields.plane !== 'chrome')) throw new Error('plane');
  const slot = slotById(fields.slot);
  if (slot.bearing !== 'load') throw new Error('chrome slot');
  if (fields.edge !== 'header' && fields.edge !== 'footer') throw new Error('edge');
  const left = copyStrip(fields.left);
  const right = copyStrip(fields.right);
  return freeze({
    plane: 'chrome',
    path: requirePath(fields.path),
    width: widthPx(fields.width, 'shot'),
    slot: slot.id,
    edge: fields.edge,
    left,
    right,
    differs: stripsDiffer(left, right),
  });
}

export function styleFact(fields) {
  if (!fields || (fields.plane != null && fields.plane !== 'style')) throw new Error('plane');
  if (fields.origin !== 'live' && fields.origin !== 'local' && fields.origin !== 'staging') throw new Error('origin');
  if (fields.widthKind !== 'ends' && fields.widthKind !== 'break') throw new Error('widthKind');
  if (typeof fields.rule !== 'string' || fields.rule === '') throw new Error('rule');
  if (!Array.isArray(fields.samples)) throw new Error('samples');
  if (fields.state != null && typeof fields.state !== 'string') throw new Error('state');
  const fact = {
    plane: 'style',
    path: requirePath(fields.path),
    rule: fields.rule,
    origin: fields.origin,
    widthKind: fields.widthKind,
    width: widthPx(fields.width, fields.widthKind),
    samples: fields.samples.map(copySample),
    shotBoxes: copyShotBoxes(fields.shotBoxes),
  };
  if (fields.state != null) fact.state = fields.state;
  return freeze(fact);
}

function verdictWidth(plane, width) {
  if (typeof width !== 'number' || !Number.isFinite(width)) throw new Error('verdict width');
  if (plane === 'pixels' || plane === 'chrome') {
    if (!SHOTS.includes(width)) throw new Error('verdict width');
    return;
  }
  if (!ENDS.has(width) && !BREAKS.has(width)) throw new Error('verdict width');
}

export function makeVerdict(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('verdict');
  for (const key of Object.keys(spec)) {
    if (!VERDICT_KEYS.includes(key)) throw new Error(`unknown verdict field ${key}`);
  }
  if (!TAGS.includes(spec.tag)) throw new Error(`unknown tag ${spec.tag}`);
  if (typeof spec.path !== 'string' || spec.path === '') throw new Error('verdict path');
  if (spec.plane !== 'pixels' && spec.plane !== 'chrome' && spec.plane !== 'style') throw new Error('verdict plane');
  verdictWidth(spec.plane, spec.width);
  if (spec.tag === 'match') {
    if (spec.reason != null) throw new Error('match reason');
    if (spec.rule != null) throw new Error('match rule');
    if (spec.regionCount != null && spec.regionCount > 0) throw new Error('match regions');
  }
  if (spec.tag === 'intended') {
    if (typeof spec.rule !== 'string' || spec.rule === '') throw new Error('intended rule');
    if (spec.slot === 'local-staging') throw new Error('intended on local-staging');
    const load = spec.slot === 'live-local' || spec.slot === 'live-staging';
    if (spec.plane !== 'style' && !load) throw new Error('intended subject');
  }
  if (spec.tag === 'chrome') {
    if (spec.edge !== 'header' && spec.edge !== 'footer') throw new Error('chrome edge');
    if (spec.slot !== 'live-local' && spec.slot !== 'live-staging') throw new Error('chrome slot');
  }
  if (spec.tag === 'lag') {
    if (spec.slot !== 'local-staging') throw new Error('lag slot');
    if (!(spec.regionCount > 0)) throw new Error('lag regions');
  }
  if (spec.tag === 'defect') {
    if (!REASONS.includes(spec.reason)) throw new Error(`defect reason ${spec.reason}`);
    if (spec.slot === 'local-staging') throw new Error('defect on local-staging');
  }
  const verdict = {};
  for (const key of VERDICT_KEYS) {
    if (key === 'sbs') continue;
    if (spec[key] !== undefined) verdict[key] = spec[key];
  }
  if (spec.sbs != null) {
    if (!Array.isArray(spec.sbs) || spec.sbs.some(item => typeof item !== 'string')) throw new Error('sbs');
    verdict.sbs = Object.freeze([...spec.sbs]);
  }
  if (spec.regionCount != null && (!Number.isInteger(spec.regionCount) || spec.regionCount < 0)) {
    throw new Error('regionCount');
  }
  Object.defineProperty(verdict, VERDICT, { value: true });
  return Object.freeze(verdict);
}

export function exitCode(verdicts) {
  if (!Array.isArray(verdicts) || verdicts.length === 0) throw new Error('exitCode verdicts');
  let defect = false;
  for (const verdict of verdicts) {
    if (!verdict || verdict[VERDICT] !== true) throw new Error('exitCode brand');
    if (verdict.tag === 'defect') defect = true;
  }
  return defect ? 1 : 0;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeKeepPath(raw) {
  const text = String(raw ?? '').trim();
  if (text === '' || text === '/') return '/';
  if (!text.startsWith('/')) throw new Error(`path ${text} needs one leading slash`);
  if (text.endsWith('/')) throw new Error(`path ${text} has a trailing slash`);
  return text;
}

export function readKeepPaths(csvText) {
  if (typeof csvText !== 'string') throw new Error('csv');
  const table = parseCsv(csvText.replace(/^\uFEFF/, ''));
  const header = table[0];
  if (!header) throw new Error('csv header');
  const oldIdx = header.indexOf('old_path');
  const actionIdx = header.indexOf('action');
  const newIdx = header.indexOf('new_path_pl');
  if (oldIdx < 0 || actionIdx < 0 || newIdx < 0) throw new Error('csv header');
  const paths = [];
  for (const row of table.slice(1)) {
    if (row.every(cell => cell === '')) continue;
    if ((row[actionIdx] ?? '').trim() !== 'keep') continue;
    const key = normalizeKeepPath(row[newIdx] ?? '');
    const oldKey = normalizeKeepPath(row[oldIdx] ?? '');
    if (oldKey !== key) throw new Error(`old_path ${oldKey} does not match ${key}`);
    if (paths.includes(key)) throw new Error(`duplicate keep path ${key}`);
    paths.push(key);
  }
  return paths;
}

export function readChromePolicy(markdown) {
  if (typeof markdown !== 'string') throw new Error('status is missing');
  const fence = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fence) throw new Error('status is missing');
  const line = fence[1].match(/^status:\s*(.+)$/m);
  if (!line) throw new Error('status is missing');
  let status = line[1].trim();
  if ((status.startsWith('"') && status.endsWith('"')) || (status.startsWith("'") && status.endsWith("'"))) {
    status = status.slice(1, -1).trim();
  }
  if (status === '') throw new Error('status is missing');
  return { status };
}

function sealRule(row) {
  if (row.to) Object.freeze(row.to);
  if (row.forbid) Object.freeze(row.forbid);
  if (row.allow) Object.freeze(row.allow);
  if (row.deny) Object.freeze(row.deny);
  return Object.freeze(row);
}

const PRIMARY = 'a.action.primary, section.pricing .plan.highlighted a.cta, section.contact form.lead-form:not(.dark) button[type="submit"]';
const CYAN = 'a.action.secondary, a.action.on-dark, section.pricing a.cta.secondary, form.lead-form.dark button[type="submit"]';
const SECTION = 'section.section';

export const RULES = Object.freeze([
  sealRule({ id: 'radius-surface', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: false, presence: 'if-live',
    selector: 'section.cta-band .band, section.pricing .plan, section.contact .card, section.hero .portrait',
    to: { borderRadius: 20 } }),
  sealRule({ id: 'radius-quote', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'if-live',
    selector: 'section.testimonials .quote', to: { borderRadius: 20 } }),
  sealRule({ id: 'radius-faq', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'if-live',
    selector: 'section.faq .list', to: { borderRadius: 20 } }),
  sealRule({ id: 'radius-post-hero', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'if-live',
    selector: 'header.post-head figure', to: { borderRadius: 20 } }),
  sealRule({ id: 'radius-author', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'required',
    selector: 'aside.author', to: { borderRadius: 20, backgroundColor: '#f9fafb' } }),
  sealRule({ id: 'radius-part', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: false, presence: 'if-live',
    selector: 'input:not([type="checkbox"]), textarea, section.pricing .tier, a.action.text',
    to: { borderRadius: 6 } }),
  sealRule({ id: 'radius-blog-card', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: false, presence: 'if-live',
    selector: 'li.card', to: { borderRadius: 10 } }),
  sealRule({ id: 'radius-scene', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: false, presence: 'if-live',
    selector: '.zw-scene', to: { borderRadius: 10 } }),
  sealRule({ id: 'radius-pill', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: false, presence: 'if-live',
    selector: 'a.action:not(.text)', to: { borderRadius: 999 } }),
  sealRule({ id: 'hover-primary-rest', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'if-live',
    state: 'rest', selector: PRIMARY, to: { backgroundColor: '#3a48cc' } }),
  sealRule({ id: 'hover-primary', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'if-live',
    state: 'hover', selector: PRIMARY,
    to: { backgroundColor: '#2e3ba3', color: '#ffffff', backgroundImage: 'none' } }),
  sealRule({ id: 'hover-primary-active', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'if-live',
    state: 'active', selector: PRIMARY, to: { backgroundColor: '#232b7a' } }),
  sealRule({ id: 'hover-cyan', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'if-live',
    state: 'hover', selector: CYAN, to: { backgroundColor: '#e7faff', color: '#2e3ba3' } }),
  sealRule({ id: 'navy-link', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'optional',
    pick: 'anchor-on', background: '#0b0a47', allow: ['#b0b6eb', '#ffffff'],
    underlineWhen: '#b0b6eb', deny: ['#3a48cc'] }),
  sealRule({ id: 'section-y-390', judgeAt: endsWidth(390), boxesAt: 'shots', explains: 'section-height', presence: 'if-live',
    selector: SECTION, to: { paddingBlock: 48 } }),
  sealRule({ id: 'section-y-1440', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'section-height', presence: 'if-live',
    selector: SECTION, to: { paddingBlock: 64 } }),
  sealRule({ id: 'label', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'if-live',
    selector: '.type-tagline', to: { color: '#636b75', fontWeight: '500', letterSpacing: '0.04em' } }),
  sealRule({ id: 'no-gradient-text', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'optional',
    selector: 'h1, h2, h3', forbid: { backgroundClip: 'text' } }),
  sealRule({ id: 'solid-navy', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'optional',
    selector: SECTION, forbid: { backgroundImageOn: '#0b0a47' } }),
  sealRule({ id: 'error-red', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'optional',
    state: 'invalid', selector: 'form.lead-form :is(input, textarea)', to: { borderColor: '#d0463b' } }),
  sealRule({ id: 'focus-ring', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'if-live',
    state: 'focus', selector: 'a.action', to: { outlineWidth: 3 } }),
  sealRule({ id: 'no-stable-scrollbar', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'optional',
    selector: 'html', forbid: { scrollbarGutter: 'stable' } }),
  sealRule({ id: 'hero-order', judgeAt: breakWidth(767), boxesAt: 'shot-375', explains: 'inner', presence: 'optional',
    geometry: 'y-above', selector: 'section.hero', above: 'h1', below: '.portrait' }),
  sealRule({ id: 'button-full-width', judgeAt: breakWidth(479), boxesAt: 'shot-375', explains: 'inner', presence: 'if-live',
    geometry: 'full-inline', selector: 'a.action:not(.text)' }),
  sealRule({ id: 'newsletter-stack', judgeAt: breakWidth(384), boxesAt: 'shot-375', explains: 'inner', presence: 'optional',
    geometry: 'stacked-y', selector: 'form.lead-form .field' }),
  sealRule({ id: 'prose-cap', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'if-live',
    selector: '.prose', to: { maxInlineSizeCh: 68 } }),
  sealRule({ id: 'logo-gray', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'if-live',
    selector: 'section.logo-strip img', to: { filter: 'grayscale' } }),
  sealRule({ id: 'logo-count', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'section-height', presence: 'optional',
    selector: 'section.logo-strip img', to: { countMin: 8, countMax: 12 } }),
  sealRule({ id: 'monogram', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'if-live',
    selector: 'section.hero .monogram', to: { text: 'GZ' } }),
  sealRule({ id: 'sales-atlas-500', judgeAt: endsWidth(1440), boxesAt: 'shots', explains: 'inner', presence: 'optional',
    pick: 'text', scope: 'main', fromWord: '250', toWord: '500' }),
  sealRule({ id: 'no-stat-numerals', judgeAt: endsWidth(1440), boxesAt: 'none', explains: false, presence: 'optional',
    selector: '.stat', forbid: { text: 'numeral' } }),
]);

function assertRule(rule) {
  if (!rule || typeof rule.id !== 'string' || rule.id === '') throw new Error('rule id');
  const kind = rule.judgeAt && rule.judgeAt[WIDTH_KIND];
  if (kind !== 'ends' && kind !== 'break') throw new Error(`rule ${rule.id} judgeAt`);
  if (rule.presence !== 'required' && rule.presence !== 'if-live' && rule.presence !== 'optional') {
    throw new Error(`rule ${rule.id} presence`);
  }
  if (rule.explains !== false && rule.explains !== 'inner' && rule.explains !== 'section-height') {
    throw new Error(`rule ${rule.id} explains`);
  }
}

function assertRules(rules) {
  const ids = new Set();
  for (const rule of rules) {
    assertRule(rule);
    if (ids.has(rule.id)) throw new Error(`duplicate rule ${rule.id}`);
    ids.add(rule.id);
  }
}

function judgePx(rule) {
  return rule.judgeAt.px;
}

export function requiredKeys(paths, rules) {
  if (!Array.isArray(paths) || !Array.isArray(rules)) throw new Error('requiredKeys arguments');
  assertRules(rules);
  const keys = [];
  for (const path of paths) {
    const keyPath = requirePath(path);
    for (const width of SHOTS) {
      for (const slot of SLOTS) keys.push({ plane: 'pixels', path: keyPath, width, slot: slot.id });
      for (const slot of SLOTS) {
        if (slot.bearing !== 'load') continue;
        for (const edge of EDGES) keys.push({ plane: 'chrome', path: keyPath, width, slot: slot.id, edge });
      }
    }
    for (const rule of rules) {
      const width = judgePx(rule);
      for (const origin of ORIGINS) keys.push({ plane: 'style', path: keyPath, width, rule: rule.id, origin });
    }
  }
  return keys;
}

function keyId(key) {
  if (key.plane === 'pixels') return `pixels\0${key.path}\0${key.width}\0${key.slot}`;
  if (key.plane === 'chrome') return `chrome\0${key.path}\0${key.width}\0${key.slot}\0${key.edge}`;
  if (key.plane === 'style') return `style\0${key.path}\0${key.width}\0${key.rule}\0${key.origin}`;
  throw new Error(`unknown plane ${key.plane}`);
}

function indexFacts(facts) {
  const map = new Map();
  for (const fact of facts) {
    const id = keyId(fact);
    if (map.has(id)) throw new Error(`duplicate fact ${id}`);
    map.set(id, fact);
  }
  return map;
}

function expandHex(value) {
  const text = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(text)) {
    return `#${text[1]}${text[1]}${text[2]}${text[2]}${text[3]}${text[3]}`;
  }
  if (/^#[0-9a-f]{6}$/.test(text)) return text;
  return text;
}

function tokenKind(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return { type: 'n', n: value };
  if (typeof value === 'boolean') return { type: 's', s: value ? 'true' : 'false' };
  if (typeof value !== 'string') return { type: 's', s: '' };
  const lower = value.trim().toLowerCase();
  if (lower.startsWith('#')) return { type: 's', s: expandHex(lower) };
  const sized = lower.match(/^(-?\d+(?:\.\d+)?)(px|ch)$/);
  if (sized) return { type: 'n', n: Number(sized[1]) };
  if (/^-?\d+(?:\.\d+)?$/.test(lower)) return { type: 'n', n: Number(lower) };
  return { type: 's', s: lower };
}

function sameToken(actual, expected) {
  const left = tokenKind(actual);
  const right = tokenKind(expected);
  if (left.type === 'n' && right.type === 'n') return left.n === right.n;
  return left.type === right.type && left.s === right.s;
}

function paddingSides(props) {
  if (props.paddingTop != null || props.paddingBottom != null) {
    if (props.paddingTop == null || props.paddingBottom == null) return null;
    return [tokenKind(props.paddingTop), tokenKind(props.paddingBottom)];
  }
  if (props.paddingBlock == null) return null;
  if (typeof props.paddingBlock === 'number') return [tokenKind(props.paddingBlock), tokenKind(props.paddingBlock)];
  const parts = String(props.paddingBlock).trim().split(/\s+/);
  if (parts.length === 1) return [tokenKind(parts[0]), tokenKind(parts[0])];
  if (parts.length === 2) return [tokenKind(parts[0]), tokenKind(parts[1])];
  if (parts.length === 3 || parts.length === 4) return [tokenKind(parts[0]), tokenKind(parts[2])];
  return null;
}

function paddingOk(props, expected) {
  const sides = paddingSides(props);
  const want = tokenKind(expected);
  if (!sides || want.type !== 'n') return false;
  return sides.every(side => side.type === 'n' && side.n === want.n);
}

function propsMeet(sample, to) {
  for (const [key, expected] of Object.entries(to)) {
    if (key === 'countMin' || key === 'countMax') continue;
    if (key === 'paddingBlock') {
      if (!paddingOk(sample.props, expected)) return false;
      continue;
    }
    if (key === 'text') {
      if (sample.props.text !== expected) return false;
      continue;
    }
    if (!sameToken(sample.props[key], expected)) return false;
  }
  return true;
}

function meetsTo(rule, samples) {
  const to = rule.to;
  if (Object.prototype.hasOwnProperty.call(to, 'countMin') || Object.prototype.hasOwnProperty.call(to, 'countMax')) {
    if (to.countMin != null && samples.length < to.countMin) return false;
    if (to.countMax != null && samples.length > to.countMax) return false;
  }
  return samples.every(sample => propsMeet(sample, to));
}

function numeralText(text) {
  return typeof text === 'string' && (text === 'numeral' || /\d/.test(text));
}

function backgroundImageOn(sample, hex) {
  if (sample.props.backgroundImageOn != null) return sameToken(sample.props.backgroundImageOn, hex);
  if (sample.props.backgroundColor == null || sample.props.backgroundImage == null) return false;
  return sameToken(sample.props.backgroundColor, hex) && !sameToken(sample.props.backgroundImage, 'none');
}

function forbidHit(sample, forbid) {
  return Object.entries(forbid).some(([key, value]) => {
    if (key === 'backgroundImageOn') return backgroundImageOn(sample, value);
    if (key === 'text' && value === 'numeral') return numeralText(sample.props.text);
    return sameToken(sample.props[key], value);
  });
}

function judgeForbid(samples, forbid) {
  if (samples.some(sample => forbidHit(sample, forbid))) return { tag: 'defect', reason: 'style' };
  return { tag: 'match' };
}

function hasWord(text, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'u').test(text);
}

function samplesText(samples) {
  return samples.map(sample => String(sample.props.text ?? '')).join('\n');
}

function judgeText(rule, samples, liveSamples) {
  if (!hasWord(samplesText(liveSamples), rule.fromWord)) return { tag: 'match' };
  const next = samplesText(samples);
  if (hasWord(next, rule.toWord) && !hasWord(next, rule.fromWord)) return { tag: 'intended' };
  return { tag: 'defect', reason: 'style' };
}

function onBackground(sample, background) {
  const color = sample.props.backgroundColor ?? sample.props.background;
  if (color == null) return true;
  return sameToken(color, background);
}

function anchorOk(rule, sample) {
  const color = expandHex(String(sample.props.color ?? ''));
  const allow = rule.allow.map(item => expandHex(item));
  const deny = (rule.deny ?? []).map(item => expandHex(item));
  if (!allow.includes(color) || deny.includes(color)) return false;
  if (rule.underlineWhen && color === expandHex(rule.underlineWhen)) {
    const line = String(sample.props.textDecoration ?? sample.props.textDecorationLine ?? '').toLowerCase();
    return line.includes('underline');
  }
  return true;
}

function yAbove(rule, samples) {
  const above = samples.find(sample => (sample.props.part ?? sample.props.role) === rule.above);
  const below = samples.find(sample => (sample.props.part ?? sample.props.role) === rule.below);
  if (above?.box && below?.box) return above.box.y < below.box.y;
  if (samples.length === 1) {
    const top = Number(samples[0].props.aboveY);
    const bottom = Number(samples[0].props.belowY);
    if (Number.isFinite(top) && Number.isFinite(bottom)) return top < bottom;
  }
  return false;
}

function fullInline(sample) {
  const flag = sample.props.fullInline;
  if (flag === true || flag === 'true') return true;
  const parent = Number(sample.props.parentInline);
  if (!sample.box || !Number.isFinite(parent) || parent <= 0) return false;
  return sample.box.w >= parent - 1;
}

function stackedY(samples) {
  if (samples.length <= 1) return samples.length === 1;
  const rows = [...samples].sort((left, right) => left.box.y - right.box.y || left.box.x - right.box.x);
  for (let i = 1; i < rows.length; i += 1) {
    if (!rows[i].box || !rows[i - 1].box) return false;
    if (rows[i].box.y < rows[i - 1].box.y + rows[i - 1].box.h - 1) return false;
  }
  return true;
}

function meetsGeometry(rule, samples) {
  if (rule.geometry === 'y-above') return yAbove(rule, samples);
  if (rule.geometry === 'full-inline') return samples.length > 0 && samples.every(fullInline);
  if (rule.geometry === 'stacked-y') return stackedY(samples);
  throw new Error(`rule ${rule.id} geometry`);
}

function judgePresence(rule, samples, liveSamples, meets) {
  const liveHas = liveSamples.length > 0;
  const newHas = samples.length > 0;
  if (!newHas) {
    if (rule.presence === 'required' || (rule.presence === 'if-live' && liveHas)) {
      return { tag: 'defect', reason: 'missing-region' };
    }
    return { tag: 'match' };
  }
  if (!meets(samples)) return { tag: 'defect', reason: 'style' };
  if (rule.presence === 'if-live' && !liveHas) return { tag: 'match' };
  if (liveHas && !meets(liveSamples)) return { tag: 'intended' };
  if (!liveHas && rule.presence === 'required') return { tag: 'intended' };
  return { tag: 'match' };
}

function judge(rule, samples, liveSamples) {
  if (rule.forbid) return judgeForbid(samples, rule.forbid);
  if (rule.pick === 'text') return judgeText(rule, samples, liveSamples);
  if (rule.pick === 'anchor-on') {
    return judgePresence(
      rule,
      samples.filter(sample => onBackground(sample, rule.background)),
      liveSamples.filter(sample => onBackground(sample, rule.background)),
      rows => rows.every(sample => anchorOk(rule, sample)),
    );
  }
  if (rule.geometry) return judgePresence(rule, samples, liveSamples, rows => meetsGeometry(rule, rows));
  if (rule.to) return judgePresence(rule, samples, liveSamples, rows => meetsTo(rule, rows));
  throw new Error(`rule ${rule.id} has no check`);
}

function projectStyle(fact, liveFact, rule) {
  if (!fact || fact.origin === 'live') throw new Error('live is not a subject');
  if (!liveFact || liveFact.origin !== 'live' || liveFact.rule !== rule.id || fact.rule !== rule.id) {
    throw new Error(`rule ${rule.id} facts`);
  }
  if (fact.width !== rule.judgeAt.px || liveFact.width !== rule.judgeAt.px) throw new Error(`rule ${rule.id} width`);
  if (rule.state && fact.state != null && fact.state !== rule.state) throw new Error(`rule ${rule.id} state`);
  const judged = judge(rule, fact.samples, liveFact.samples);
  const spec = {
    tag: judged.tag,
    path: fact.path,
    plane: 'style',
    width: fact.width,
    origin: fact.origin,
  };
  if (judged.tag !== 'match') spec.rule = rule.id;
  if (judged.reason) spec.reason = judged.reason;
  return makeVerdict(spec);
}

function intersectionArea(left, right) {
  const width = Math.min(left.x + left.w, right.x + right.w) - Math.max(left.x, right.x);
  const height = Math.min(left.y + left.h, right.y + right.h) - Math.max(left.y, right.y);
  if (width <= 0 || height <= 0) return 0;
  return width * height;
}

function coveringOverlap(row, width, region) {
  if (row.explains !== 'inner' && row.explains !== 'section-height') return 0;
  if (row.explains === 'section-height' && region.kind !== 'height') return 0;
  const area = region.w * region.h;
  if (!(area > 0)) return 0;
  const boxes = row.shotBoxes?.[width] ?? [];
  let best = 0;
  for (const box of boxes) {
    const overlap = intersectionArea(box, region);
    if (overlap / area >= SWALLOW_COVERAGE) best = Math.max(best, overlap);
  }
  return best;
}

function projectLoadBearing(fact, styleRows) {
  const slot = slotById(fact.slot);
  if (slot.bearing !== 'load') throw new Error('load-bearing slot');
  if (fact.regions.length === 0) return { verdict: pixelVerdict(fact, 'match'), swallowed: [] };
  const swallowed = [];
  let remaining = 0;
  for (const region of fact.regions) {
    let winner = null;
    let best = 0;
    for (const row of styleRows) {
      if (row.tag !== 'intended' || row.origin !== slot.right) continue;
      const overlap = coveringOverlap(row, fact.width, region);
      if (overlap > best) {
        best = overlap;
        winner = row;
      }
    }
    if (winner) swallowed.push({ rule: winner.rule, sbs: fact.sbs });
    else remaining += 1;
  }
  if (remaining === 0) return { verdict: pixelVerdict(fact, 'match'), swallowed };
  return {
    verdict: pixelVerdict(fact, 'defect', { reason: 'pixel', regionCount: remaining }),
    swallowed,
  };
}

function pixelVerdict(fact, tag, extra = {}) {
  return makeVerdict({
    tag,
    path: fact.path,
    plane: 'pixels',
    width: fact.width,
    slot: fact.slot,
    reason: extra.reason,
    regionCount: extra.regionCount,
  });
}

function projectLag(fact) {
  const slot = slotById(fact.slot);
  if (slot.bearing !== 'lag') throw new Error('lag slot');
  if (fact.regions.length === 0) return pixelVerdict(fact, 'match');
  return makeVerdict({
    tag: 'lag',
    path: fact.path,
    plane: 'pixels',
    width: fact.width,
    slot: fact.slot,
    regionCount: fact.regions.length,
  });
}

function chromeExplainer(rules, fact) {
  return rules.find(rule => rule.plane === 'chrome' && rule.explains && (rule.edge == null || rule.edge === fact.edge));
}

function projectChrome(fact, status, rules) {
  const spec = {
    path: fact.path,
    plane: 'chrome',
    width: fact.width,
    slot: fact.slot,
    edge: fact.edge,
  };
  if (!fact.differs) return makeVerdict({ ...spec, tag: 'match' });
  if (status !== 'done') return makeVerdict({ ...spec, tag: 'chrome' });
  const row = chromeExplainer(rules, fact);
  if (row) return makeVerdict({ ...spec, tag: 'intended', rule: row.id });
  return makeVerdict({ ...spec, tag: 'defect', reason: 'chrome-after-t27' });
}

function pushSbs(map, key, sbs) {
  const list = map.get(key);
  if (!list) {
    map.set(key, [sbs]);
    return;
  }
  if (!list.includes(sbs)) list.push(sbs);
}

function withSbs(verdict, sbs) {
  return makeVerdict({
    tag: verdict.tag,
    path: verdict.path,
    plane: verdict.plane,
    width: verdict.width,
    slot: verdict.slot,
    edge: verdict.edge,
    rule: verdict.rule,
    origin: verdict.origin,
    reason: verdict.reason,
    regionCount: verdict.regionCount,
    sbs,
  });
}

function projectPath(path, rules, status, byKey) {
  const chunk = [];
  const styleRows = [];
  for (const rule of rules) {
    const live = byKey.get(keyId({ plane: 'style', path, width: judgePx(rule), rule: rule.id, origin: 'live' }));
    for (const origin of SUBJECTS) {
      const fact = byKey.get(keyId({ plane: 'style', path, width: judgePx(rule), rule: rule.id, origin }));
      const verdict = projectStyle(fact, live, rule);
      styleRows.push({
        tag: verdict.tag,
        origin,
        rule: rule.id,
        explains: rule.explains,
        shotBoxes: fact.shotBoxes,
      });
      chunk.push({ kind: 'style', origin, rule: rule.id, verdict });
    }
  }
  const sbsMap = new Map();
  for (const width of SHOTS) {
    for (const slot of SLOTS) {
      if (slot.bearing !== 'load') continue;
      const fact = byKey.get(keyId({ plane: 'pixels', path, width, slot: slot.id }));
      const result = projectLoadBearing(fact, styleRows);
      chunk.push({ kind: 'pixel', verdict: result.verdict });
      for (const item of result.swallowed) pushSbs(sbsMap, `${slot.right}|${item.rule}`, item.sbs);
    }
  }
  for (const width of SHOTS) {
    const slot = SLOTS.find(item => item.bearing === 'lag');
    const fact = byKey.get(keyId({ plane: 'pixels', path, width, slot: slot.id }));
    chunk.push({ kind: 'pixel', verdict: projectLag(fact) });
  }
  for (const width of SHOTS) {
    for (const slot of SLOTS) {
      if (slot.bearing !== 'load') continue;
      for (const edge of EDGES) {
        const fact = byKey.get(keyId({ plane: 'chrome', path, width, slot: slot.id, edge }));
        chunk.push({ kind: 'chrome', verdict: projectChrome(fact, status, rules) });
      }
    }
  }
  return chunk.map(entry => {
    if (entry.kind !== 'style' || entry.verdict.tag !== 'intended') return entry.verdict;
    return withSbs(entry.verdict, sbsMap.get(`${entry.origin}|${entry.rule}`) ?? []);
  });
}

export function project(facts, policy) {
  if (!Array.isArray(facts)) throw new Error('facts');
  if (!policy || !Array.isArray(policy.paths) || !Array.isArray(policy.rules)) throw new Error('policy');
  if (typeof policy.status !== 'string' || policy.status === '') throw new Error('policy status');
  const paths = policy.paths.map(requirePath);
  if (new Set(paths).size !== paths.length) throw new Error('duplicate path');
  const required = requiredKeys(paths, policy.rules);
  const byKey = indexFacts(facts);
  const missing = required.filter(key => !byKey.has(keyId(key)));
  if (missing.length > 0) throw new CoverageError(missing);
  const verdicts = [];
  for (const path of paths) verdicts.push(...projectPath(path, policy.rules, policy.status, byKey));
  return verdicts;
}

function plainVerdict(verdict) {
  const out = {};
  for (const key of VERDICT_KEYS) {
    if (key === 'sbs') continue;
    if (verdict[key] !== undefined) out[key] = verdict[key];
  }
  if (verdict.sbs) out.sbs = [...verdict.sbs];
  return out;
}

function worst(tags) {
  for (const tag of RANK) {
    if (tags.includes(tag)) return tag;
  }
  throw new Error('verdict tag');
}

export function summarize(paths, verdicts, meta) {
  if (!Array.isArray(paths) || !Array.isArray(verdicts)) throw new Error('summarize arguments');
  if (!meta || typeof meta.t27 !== 'string' || typeof meta.channelSlop !== 'number' || typeof meta.budget !== 'number') {
    throw new Error('summarize meta');
  }
  for (const verdict of verdicts) {
    if (!verdict || verdict[VERDICT] !== true) throw new Error('summarize verdict');
  }
  const records = [];
  for (const path of paths) {
    const rows = verdicts.filter(verdict => verdict.path === path);
    if (rows.length === 0) throw new Error(`no verdicts for ${path}`);
    if (rows.every(verdict => verdict.tag === 'match')) {
      records.push({ path, outcome: 'match' });
      continue;
    }
    records.push({
      path,
      outcome: worst(rows.map(verdict => verdict.tag)),
      items: rows.filter(verdict => verdict.tag !== 'match').map(plainVerdict),
    });
  }
  const counts = { match: 0, intended: 0, chrome: 0, lag: 0, defect: 0 };
  for (const record of records) {
    if (record.outcome === 'match') counts.match += 1;
    for (const item of record.items ?? []) counts[item.tag] += 1;
  }
  return {
    complete: true,
    corpus: paths.length,
    t27: meta.t27,
    channelSlop: meta.channelSlop,
    budget: meta.budget,
    counts,
    paths: records,
  };
}

function checkTags(report) {
  if (!Array.isArray(report.paths)) throw new Error('report paths');
  for (const record of report.paths) {
    if (!record || !TAGS.includes(record.outcome)) throw new Error(`unknown tag ${record && record.outcome}`);
    for (const item of record.items ?? []) {
      if (!item || !TAGS.includes(item.tag)) throw new Error(`unknown tag ${item && item.tag}`);
    }
  }
}

export function readReport(dir) {
  if (typeof dir !== 'string' || dir === '') throw new Error('missing report');
  const file = join(dir, 'report.json');
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') throw new Error(`missing report: ${file}`);
    throw error;
  }
  const report = JSON.parse(text);
  if (!report || report.complete !== true) throw new Error('report is not complete');
  checkTags(report);
  return report;
}
