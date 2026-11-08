import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  RULES,
  SHOTS,
  SLOTS,
  CoverageError,
  assertShot,
  breakWidth,
  chromeFact,
  endsWidth,
  exitCode,
  makeVerdict,
  pixelFact,
  project,
  readChromePolicy,
  readKeepPaths,
  readReport,
  requiredKeys,
  shotWidth,
  styleFact,
  summarize,
} from './parity.mjs';

const PATH = '/blog';
const root = fileURLToPath(new URL('../../..', import.meta.url));

const SBS = {
  'live-local:1280': 'img/1111111111111111.png',
  'live-local:375': 'img/2222222222222222.png',
  'live-staging:1280': 'img/3333333333333333.png',
  'live-staging:375': 'img/4444444444444444.png',
  'local-staging:1280': 'img/5555555555555555.png',
  'local-staging:375': 'img/6666666666666666.png',
};

const QUOTE_BOXES = {
  1280: [{ x: 0, y: 0, w: 200, h: 200 }],
  375: [{ x: 0, y: 0, w: 200, h: 200 }],
};

const QUOTE_REGION = { block: 'quote', kind: 'inner', x: 20, y: 30, w: 40, h: 20 };

function ruleById(id) {
  const rule = RULES.find(item => item.id === id);
  if (!rule) throw new Error(`missing rule ${id}`);
  return rule;
}

function widthKindOf(rule) {
  const px = rule.judgeAt.px;
  if (px === 390 || px === 1440) return 'ends';
  if (px === 767 || px === 479 || px === 384) return 'break';
  throw new Error(`width ${px}`);
}

function defaultProps(rule) {
  if (rule.to) {
    const props = {};
    for (const [key, value] of Object.entries(rule.to)) {
      if (key === 'countMin' || key === 'countMax') continue;
      props[key] = value;
    }
    return props;
  }
  if (rule.pick === 'anchor-on') {
    return { color: '#ffffff', backgroundColor: rule.background, textDecoration: 'none' };
  }
  if (rule.pick === 'text') return { text: 'opis bez tej liczby' };
  if (rule.forbid) {
    return {
      backgroundClip: 'border-box',
      scrollbarGutter: 'auto',
      backgroundImage: 'none',
      backgroundColor: '#ffffff',
      text: 'Atlas',
    };
  }
  return {};
}

function defaultSamples(rule) {
  if (rule.geometry === 'y-above') {
    return [
      { box: { x: 0, y: 8, w: 120, h: 24 }, props: { part: rule.above } },
      { box: { x: 0, y: 80, w: 120, h: 48 }, props: { part: rule.below } },
    ];
  }
  if (rule.geometry === 'full-inline') {
    return [{ box: { x: 0, y: 0, w: 320, h: 44 }, props: { fullInline: 'true', parentInline: 320 } }];
  }
  if (rule.geometry === 'stacked-y') {
    return [
      { box: { x: 0, y: 0, w: 280, h: 40 }, props: {} },
      { box: { x: 0, y: 48, w: 280, h: 40 }, props: {} },
    ];
  }
  if (rule.to && (rule.to.countMin != null || rule.to.countMax != null)) {
    const count = rule.to.countMin ?? 1;
    return Array.from({ length: count }, () => ({ box: { x: 0, y: 0, w: 48, h: 24 }, props: {} }));
  }
  return [{ box: { x: 0, y: 0, w: 80, h: 40 }, props: defaultProps(rule) }];
}

function ledger(path, rules, spec = {}) {
  const facts = [];
  for (const rule of rules) {
    for (const origin of ['live', 'local', 'staging']) {
      const custom = spec.style?.[`${rule.id}:${origin}`] ?? {};
      try {
        facts.push(styleFact({
          path,
          rule: rule.id,
          origin,
          widthKind: widthKindOf(rule),
          width: rule.judgeAt.px,
          samples: custom.samples ?? defaultSamples(rule),
          shotBoxes: custom.shotBoxes,
        }));
      } catch (error) {
        throw new Error(`${rule.id} ${origin}: ${error.message}`);
      }
    }
  }
  for (const width of SHOTS) {
    for (const slot of SLOTS) {
      const custom = spec.pixel?.[`${width}:${slot.id}`] ?? {};
      facts.push(pixelFact({
        path,
        width,
        slot: slot.id,
        regions: custom.regions ?? [],
        sbs: custom.sbs ?? SBS[`${slot.id}:${width}`],
        leftHash: 'left-hash',
        rightHash: 'right-hash',
      }));
    }
    for (const slot of SLOTS) {
      if (slot.bearing !== 'load') continue;
      for (const edge of ['header', 'footer']) {
        const custom = spec.chrome?.[`${width}:${slot.id}:${edge}`] ?? {};
        facts.push(chromeFact({
          path,
          width,
          slot: slot.id,
          edge,
          left: { h: 32, empty: false, hash: 'strip-a' },
          right: { h: 32, empty: false, hash: custom.differs ? 'strip-b' : 'strip-a' },
        }));
      }
    }
  }
  return facts;
}

function policy(rules, status = 'todo', paths = [PATH]) {
  return { status, paths, rules };
}

function radius(px) {
  return [{ box: { x: 0, y: 0, w: 40, h: 20 }, props: { borderRadius: px } }];
}

function pad(px) {
  return [{ box: { x: 0, y: 0, w: 100, h: 40 }, props: { paddingBlock: px } }];
}

function meta(t27 = 'todo') {
  return { t27, channelSlop: 16, budget: 8388608 };
}

test('a style fact that meets to while live does not is intended and exits 0', () => {
  const rule = ruleById('radius-quote');
  const verdicts = project(ledger(PATH, [rule], {
    style: {
      'radius-quote:live': { samples: radius(0) },
      'radius-quote:local': { samples: radius(20) },
      'radius-quote:staging': { samples: radius(20) },
    },
  }), policy([rule]));
  const local = verdicts.find(verdict => verdict.plane === 'style' && verdict.origin === 'local');
  assert.equal(local.tag, 'intended');
  assert.equal(local.rule, 'radius-quote');
  assert.equal(verdicts.some(verdict => verdict.origin === 'live'), false);
  assert.equal(exitCode(verdicts), 0);
  assert.equal(verdicts.length, requiredKeys([PATH], [rule]).length - 1);
});

test('the same pixel regions with no intended style verdict are defects and exit 1', () => {
  const rule = ruleById('radius-quote');
  const verdicts = project(ledger(PATH, [rule], {
    style: {
      'radius-quote:live': { samples: radius(20), shotBoxes: QUOTE_BOXES },
      'radius-quote:local': { samples: radius(20), shotBoxes: QUOTE_BOXES },
      'radius-quote:staging': { samples: radius(20), shotBoxes: QUOTE_BOXES },
    },
    pixel: {
      '1280:live-local': { regions: [QUOTE_REGION] },
    },
  }), policy([rule]));
  const pixel = verdicts.find(verdict => verdict.plane === 'pixels' && verdict.slot === 'live-local' && verdict.width === 1280);
  assert.equal(pixel.tag, 'defect');
  assert.equal(pixel.reason, 'pixel');
  assert.equal(verdicts.some(verdict => verdict.tag === 'intended'), false);
  assert.equal(exitCode(verdicts), 1);
});

test('chrome differs while T27 is open, and the same fact is a defect once T27 is done', () => {
  const rule = ruleById('radius-pill');
  const facts = ledger(PATH, [rule], {
    chrome: { '1280:live-local:header': { differs: true } },
  });
  const open = project(facts, policy([rule], readChromePolicy('---\nstatus: todo\n---\n').status));
  const header = open.find(verdict => verdict.plane === 'chrome' && verdict.edge === 'header' && verdict.width === 1280 && verdict.slot === 'live-local');
  assert.equal(header.tag, 'chrome');
  assert.equal(exitCode(open), 0);
  const review = project(facts, policy([rule], 'review'));
  assert.equal(review.find(verdict => verdict.slot === 'live-local' && verdict.edge === 'header' && verdict.width === 1280).tag, 'chrome');
  const closed = project(facts, policy([rule], readChromePolicy('---\nstatus: done\n---\n# T27\n').status));
  const defect = closed.find(verdict => verdict.plane === 'chrome' && verdict.edge === 'header' && verdict.width === 1280 && verdict.slot === 'live-local');
  assert.equal(defect.tag, 'defect');
  assert.equal(defect.reason, 'chrome-after-t27');
  assert.equal(exitCode(closed), 1);
  const report = summarize([PATH], open, meta());
  assert.equal(report.counts.chrome, 1);
  assert.equal(report.counts.match, 0);
  assert.equal(report.counts.defect, 0);
  assert.equal(report.paths[0].outcome, 'chrome');
});

test('local-staging regions are lag and cannot be forced into a defect', () => {
  const rule = ruleById('radius-pill');
  const region = { block: 'main', kind: 'inner', x: 0, y: 0, w: 12, h: 8 };
  const verdicts = project(ledger(PATH, [rule], {
    pixel: { '1280:local-staging': { regions: [region] } },
  }), policy([rule]));
  const lag = verdicts.find(verdict => verdict.slot === 'local-staging' && verdict.width === 1280);
  assert.equal(lag.tag, 'lag');
  assert.equal(lag.regionCount, 1);
  assert.equal(exitCode(verdicts), 0);
  assert.throws(() => makeVerdict({
    tag: 'defect',
    path: PATH,
    plane: 'pixels',
    width: 1280,
    slot: 'local-staging',
    reason: 'pixel',
    regionCount: 1,
  }), /local-staging/);
  assert.throws(() => makeVerdict({
    tag: 'intended',
    path: PATH,
    plane: 'style',
    width: 1440,
    slot: 'local-staging',
    rule: 'radius-pill',
  }), /local-staging/);
  assert.throws(() => makeVerdict({
    tag: 'match',
    path: PATH,
    plane: 'style',
    width: 1440,
    origin: 'local',
    rule: 'radius-pill',
  }), /match rule/);
  const legal = makeVerdict({
    tag: 'lag',
    path: PATH,
    plane: 'pixels',
    width: 1280,
    slot: 'local-staging',
    regionCount: 1,
  });
  assert.equal(legal.tag, 'lag');
});

test('an author rule with empty samples is missing-region, not intended', () => {
  const rule = ruleById('radius-author');
  const verdicts = project(ledger(PATH, [rule], {
    style: { 'radius-author:local': { samples: [] } },
  }), policy([rule]));
  const authored = verdicts.filter(verdict => verdict.rule === 'radius-author');
  assert.equal(authored.length, 1);
  assert.equal(authored[0].origin, 'local');
  assert.equal(authored[0].tag, 'defect');
  assert.equal(authored[0].reason, 'missing-region');
});

test('section padding is 48 at 390 and 64 at 1440', () => {
  const y390 = ruleById('section-y-390');
  const y1440 = ruleById('section-y-1440');
  const at48 = project(ledger(PATH, [y390], {
    style: {
      'section-y-390:live': { samples: pad(48) },
      'section-y-390:local': { samples: pad(48) },
      'section-y-390:staging': { samples: pad(48) },
    },
  }), policy([y390]));
  assert.equal(at48.some(verdict => verdict.tag === 'defect'), false);
  assert.equal(exitCode(at48), 0);

  const at64 = project(ledger(PATH, [y390], {
    style: {
      'section-y-390:live': { samples: pad(64) },
      'section-y-390:local': { samples: pad(64) },
      'section-y-390:staging': { samples: pad(64) },
    },
  }), policy([y390]));
  const padded = at64.filter(verdict => verdict.rule === 'section-y-390');
  assert.ok(padded.length >= 1);
  assert.ok(padded.every(verdict => verdict.tag === 'defect' && verdict.reason === 'style'));
  assert.equal(exitCode(at64), 1);

  const wide = project(ledger(PATH, [y390, y1440], {
    style: {
      'section-y-390:live': { samples: pad(48) },
      'section-y-390:local': { samples: pad(48) },
      'section-y-390:staging': { samples: pad(48) },
      'section-y-1440:live': { samples: pad(48) },
      'section-y-1440:local': { samples: pad(48) },
      'section-y-1440:staging': { samples: pad(48) },
    },
  }), policy([y390, y1440]));
  assert.equal(wide.some(verdict => verdict.rule === 'section-y-390' && verdict.tag === 'defect'), false);
  const wideDefect = wide.filter(verdict => verdict.rule === 'section-y-1440');
  assert.ok(wideDefect.every(verdict => verdict.tag === 'defect' && verdict.reason === 'style'));
});

test('shot widths reject an ends width and a break width', () => {
  assert.equal(shotWidth(1280).px, 1280);
  assert.equal(endsWidth(1440).px, 1440);
  assert.equal(breakWidth(767).px, 767);
  assert.throws(() => shotWidth(390));
  assert.throws(() => endsWidth(375));
  assert.throws(() => breakWidth(390));
  assert.throws(() => assertShot(endsWidth(390)));
  assert.throws(() => assertShot(breakWidth(384)));
  assert.throws(() => assertShot(1280));
  assert.equal(assertShot(shotWidth(375)).px, 375);
});

test('registry selectors omit box-pad and keep primary off cyan', () => {
  for (const rule of RULES) {
    assert.equal(String(rule.selector ?? '').includes('box-pad'), false, rule.id);
  }
  const split = selector => selector.split(',').map(item => item.trim()).filter(Boolean);
  const cyan = split(ruleById('hover-cyan').selector);
  assert.ok(cyan.length > 1);
  const primaryRules = RULES.filter(rule => rule.id.startsWith('hover-primary'));
  assert.ok(primaryRules.length >= 1);
  for (const rule of primaryRules) {
    const items = split(rule.selector);
    assert.ok(items.length > 1);
    for (const item of items) assert.equal(cyan.includes(item), false, item);
  }
});

test('a ledger missing one required key throws CoverageError for a small corpus', () => {
  const rule = ruleById('radius-pill');
  const facts = ledger(PATH, [rule]);
  facts.pop();
  const keys = requiredKeys([PATH], [rule]);
  assert.ok(keys.length > 0);
  assert.equal(policy([rule]).paths.length, 1);
  try {
    project(facts, policy([rule]));
    assert.fail('expected coverage');
  } catch (error) {
    assert.equal(error instanceof CoverageError, true);
    assert.equal(error.reason, 'coverage');
    assert.equal(error.missing.length, 1);
  }
});

test('styleFact rejects a prop that still contains oklch or rgb(', () => {
  const fields = {
    path: PATH,
    rule: 'label',
    origin: 'local',
    widthKind: 'ends',
    width: 1440,
  };
  assert.throws(() => styleFact({
    ...fields,
    samples: [{ box: null, props: { color: 'oklch(0.7 0.1 250)' } }],
  }));
  assert.throws(() => styleFact({
    ...fields,
    samples: [{ box: null, props: { color: 'rgb(58, 72, 204)' } }],
  }));
});

test('a local intended verdict does not swallow a live-staging region', () => {
  const rule = ruleById('radius-quote');
  const verdicts = project(ledger(PATH, [rule], {
    style: {
      'radius-quote:live': { samples: radius(0), shotBoxes: QUOTE_BOXES },
      'radius-quote:local': { samples: radius(20), shotBoxes: QUOTE_BOXES },
      'radius-quote:staging': { samples: radius(0), shotBoxes: QUOTE_BOXES },
    },
    pixel: {
      '1280:live-local': { regions: [QUOTE_REGION] },
      '1280:live-staging': { regions: [QUOTE_REGION] },
    },
  }), policy([rule]));
  const localStyle = verdicts.find(verdict => verdict.tag === 'intended' && verdict.origin === 'local' && verdict.rule === 'radius-quote');
  const stagingStyle = verdicts.find(verdict => verdict.plane === 'style' && verdict.origin === 'staging' && verdict.rule === 'radius-quote');
  const localPixel = verdicts.find(verdict => verdict.plane === 'pixels' && verdict.slot === 'live-local' && verdict.width === 1280);
  const stagingPixel = verdicts.find(verdict => verdict.plane === 'pixels' && verdict.slot === 'live-staging' && verdict.width === 1280);
  assert.equal(stagingStyle.tag, 'defect');
  assert.equal(localPixel.tag, 'match');
  assert.equal(stagingPixel.tag, 'defect');
  assert.equal(stagingPixel.reason, 'pixel');
  assert.deepEqual(localStyle.sbs, [SBS['live-local:1280']]);
  assert.equal(localStyle.sbs.includes(SBS['live-staging:1280']), false);
});

test('section-height swallows a height region and leaves an inner region', () => {
  const rule = ruleById('section-y-390');
  const shotBoxes = {
    1280: [{ x: 0, y: 0, w: 400, h: 300 }],
    375: [{ x: 0, y: 0, w: 300, h: 200 }],
  };
  const inner = { block: 'section', kind: 'inner', x: 10, y: 10, w: 40, h: 20 };
  const height = { block: 'section', kind: 'height', x: 10, y: 10, w: 40, h: 20 };
  const verdicts = project(ledger(PATH, [rule], {
    style: {
      'section-y-390:live': { samples: pad(64), shotBoxes },
      'section-y-390:local': { samples: pad(48), shotBoxes },
      'section-y-390:staging': { samples: pad(64), shotBoxes },
    },
    pixel: { '1280:live-local': { regions: [inner, height] } },
  }), policy([rule]));
  const pixel = verdicts.find(verdict => verdict.plane === 'pixels' && verdict.slot === 'live-local' && verdict.width === 1280);
  const intended = verdicts.find(verdict => verdict.tag === 'intended' && verdict.origin === 'local' && verdict.rule === 'section-y-390');
  assert.equal(pixel.tag, 'defect');
  assert.equal(pixel.reason, 'pixel');
  assert.equal(pixel.regionCount, 1);
  assert.deepEqual(intended.sbs, [SBS['live-local:1280']]);
});

test('a shot box must cover at least 0.8 of the region', () => {
  const rule = ruleById('radius-quote');
  const shotBoxes = {
    1280: [{ x: 0, y: 0, w: 100, h: 100 }],
    375: [{ x: 0, y: 0, w: 100, h: 100 }],
  };
  const region = { block: 'quote', kind: 'inner', x: 0, y: 0, w: 100, h: 200 };
  const verdicts = project(ledger(PATH, [rule], {
    style: {
      'radius-quote:live': { samples: radius(0), shotBoxes },
      'radius-quote:local': { samples: radius(20), shotBoxes },
      'radius-quote:staging': { samples: radius(20), shotBoxes },
    },
    pixel: { '1280:live-local': { regions: [region] } },
  }), policy([rule]));
  const pixel = verdicts.find(verdict => verdict.plane === 'pixels' && verdict.slot === 'live-local' && verdict.width === 1280);
  const intended = verdicts.find(verdict => verdict.tag === 'intended' && verdict.origin === 'local');
  assert.equal(pixel.tag, 'defect');
  assert.equal(pixel.regionCount, 1);
  assert.deepEqual(intended.sbs, []);
});

test('a forbid hit is style and a miss is a match', () => {
  const rule = ruleById('no-gradient-text');
  const clean = [{ box: null, props: { backgroundClip: 'border-box' } }];
  const hit = [{ box: null, props: { backgroundClip: 'text' } }];
  const calm = project(ledger(PATH, [rule], {
    style: {
      'no-gradient-text:live': { samples: clean },
      'no-gradient-text:local': { samples: clean },
      'no-gradient-text:staging': { samples: clean },
    },
  }), policy([rule]));
  assert.equal(calm.some(verdict => verdict.tag === 'defect'), false);
  assert.equal(exitCode(calm), 0);
  const loud = project(ledger(PATH, [rule], {
    style: {
      'no-gradient-text:live': { samples: clean },
      'no-gradient-text:local': { samples: hit },
      'no-gradient-text:staging': { samples: clean },
    },
  }), policy([rule]));
  const defect = loud.find(verdict => verdict.rule === 'no-gradient-text');
  assert.equal(defect.tag, 'defect');
  assert.equal(defect.reason, 'style');
});

test('sales atlas fires only when live contains the whole word 250', () => {
  const rule = ruleById('sales-atlas-500');
  const text = value => [{ box: null, props: { text: value } }];
  const dormant = project(ledger(PATH, [rule], {
    style: {
      'sales-atlas-500:live': { samples: text('zostaw 2500 leadów') },
      'sales-atlas-500:local': { samples: text('zostaw 500 leadów') },
      'sales-atlas-500:staging': { samples: text('zostaw 500 leadów') },
    },
  }), policy([rule]));
  assert.equal(dormant.some(verdict => verdict.tag === 'defect' || verdict.tag === 'intended'), false);
  const fired = project(ledger(PATH, [rule], {
    style: {
      'sales-atlas-500:live': { samples: text('pakiet 250 osób') },
      'sales-atlas-500:local': { samples: text('pakiet 500 osób') },
      'sales-atlas-500:staging': { samples: text('pakiet 250 osób') },
    },
  }), policy([rule]));
  assert.equal(fired.find(verdict => verdict.origin === 'local' && verdict.rule === 'sales-atlas-500').tag, 'intended');
  assert.equal(fired.find(verdict => verdict.origin === 'staging' && verdict.rule === 'sales-atlas-500').tag, 'defect');
  assert.equal(fired.find(verdict => verdict.origin === 'staging' && verdict.rule === 'sales-atlas-500').reason, 'style');
});

test('a full registry ledger that already meets every rule exits 0', () => {
  const verdicts = project(ledger(PATH, RULES), policy(RULES));
  assert.ok(verdicts.every(verdict => verdict.tag === 'match'));
  assert.equal(exitCode(verdicts), 0);
  assert.equal(verdicts.length, requiredKeys([PATH], RULES).length - RULES.length);
  const report = summarize([PATH], verdicts, meta('todo'));
  assert.equal(report.complete, true);
  assert.equal(report.corpus, 1);
  assert.equal(report.t27, 'todo');
  assert.equal(report.channelSlop, 16);
  assert.equal(report.budget, 8388608);
  assert.equal(report.counts.match, 1);
  assert.equal(report.counts.intended, 0);
  assert.equal(report.counts.chrome, 0);
  assert.equal(report.counts.lag, 0);
  assert.equal(report.counts.defect, 0);
  assert.equal(report.paths[0].outcome, 'match');
  assert.equal(report.paths[0].items, undefined);
  assert.equal(Object.hasOwn(report, 'timestamp'), false);
  assert.deepEqual(Object.keys(report), ['complete', 'corpus', 't27', 'channelSlop', 'budget', 'counts', 'paths']);
  assert.deepEqual(Object.keys(report.counts), ['match', 'intended', 'chrome', 'lag', 'defect']);
});

test('readKeepPaths returns keep paths in file order', () => {
  const csv = [
    'old_path,action,new_path_pl,title',
    '/,keep,,Home',
    '/blog,keep,/blog,"Blog, index"',
    '/old,redirect-301,,Elsewhere',
    '/gone,remove,,',
  ].join('\n');
  assert.deepEqual(readKeepPaths(csv), ['/', '/blog']);
  assert.throws(() => readKeepPaths('old_path,action,new_path_pl\n/a,keep,/b\n'));
  assert.throws(() => readKeepPaths('old_path,action,new_path_pl\n/a/,keep,/a\n'));
  assert.throws(() => readKeepPaths('action,new_path_pl\nkeep,/a\n'));
  const live = readFileSync(join(root, 'migration/contracts/url-map.csv'), 'utf8');
  const paths = readKeepPaths(live);
  const keeps = live.split(/\n/).filter(line => /^[^,\n]*,keep,/.test(line));
  const expected = keeps.map(line => {
    const value = line.split(',')[2];
    return value === '' ? '/' : value;
  });
  assert.deepEqual(paths, expected);
  assert.ok(paths.includes('/'));
  assert.ok(paths.includes('/blog'));
});

test('readChromePolicy reads front matter and rejects a missing status', () => {
  assert.deepEqual(readChromePolicy('---\nstatus: todo\n---\n'), { status: 'todo' });
  assert.deepEqual(readChromePolicy('---\nstatus: done\n---\n'), { status: 'done' });
  assert.throws(() => readChromePolicy('---\nid: T27\n---\n'), /status is missing/);
  assert.throws(() => readChromePolicy('# T27\n'), /status is missing/);
});

test('readReport rejects a missing file, an open report, and an unknown tag', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'parity-report-'));
  try {
    assert.throws(() => readReport(dir), /missing report/);
    await writeFile(join(dir, 'report.json'), '{}\n');
    assert.throws(() => readReport(dir), /not complete/);
    const verdicts = project(ledger(PATH, RULES), policy(RULES));
    const report = summarize([PATH], verdicts, meta());
    await writeFile(join(dir, 'report.json'), `${JSON.stringify(report)}\n`);
    assert.equal(readReport(dir).counts.defect, 0);
    report.paths[0].outcome = 'pass';
    await writeFile(join(dir, 'report.json'), `${JSON.stringify(report)}\n`);
    assert.throws(() => readReport(dir), /unknown tag/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('exitCode rejects an empty list and an unbranded verdict', () => {
  assert.throws(() => exitCode([]));
  assert.throws(() => exitCode([{ tag: 'match', path: PATH }]));
  assert.throws(() => makeVerdict({ tag: 'nope', path: PATH, plane: 'pixels', width: 1280 }));
  assert.throws(() => makeVerdict({
    tag: 'defect',
    path: PATH,
    plane: 'style',
    width: 1440,
    origin: 'local',
    rule: 'label',
    reason: 'because',
  }));
});
