import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, realpathSync, rmdirSync, statSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capturePath } from './capture.mjs';
import {
  CoverageError,
  RULES,
  SHOTS,
  SLOTS,
  chromeFact,
  pixelFact,
  project,
  styleFact,
  readChromePolicy,
  readKeepPaths,
  summarize,
} from './parity.mjs';
import { BUDGET, CHANNEL_SLOP, commit, diffPage, encodeSideBySide } from './publish.mjs';

const ORIGINS = ['live', 'local', 'staging'];
const EDGES = ['header', 'footer'];
const FLAGS = {
  '--out': 'out',
  '--url-map': 'urlMap',
  '--t27': 't27',
  '--live': 'live',
  '--local': 'local',
  '--staging': 'staging',
  '--scratch': 'scratch',
};

let cachedRoot;

function repoRoot() {
  if (!cachedRoot) {
    cachedRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  }
  return cachedRoot;
}

function incomplete(reason, origin) {
  const error = new Error(origin ? `reason=${reason} ${origin}` : `reason=${reason}`);
  error.reason = reason;
  if (origin) error.origin = origin;
  return error;
}

function reasonOf(error) {
  if (!error || typeof error !== 'object') return null;
  if (error instanceof CoverageError || error.name === 'CoverageError') return 'coverage';
  const message = String(error.message ?? '');
  if (message.includes('browser-missing')) return 'browser-missing';
  const tagged = message.match(/reason=([A-Za-z0-9-]+)/);
  if (tagged) return tagged[1];
  // publish.mjs throws `reason budget` and sets error.reason. There is no equals sign.
  if (typeof error.reason === 'string' && /^[A-Za-z0-9-]+$/.test(error.reason)) return error.reason;
  return null;
}

function reportIncomplete(error) {
  const reason = reasonOf(error);
  if (!reason) return false;
  const suffix = error.origin ? ` ${error.origin}` : '';
  process.stderr.write(`parity: incomplete reason=${reason}${suffix}\n`);
  return true;
}

function parseArgs(argv) {
  const parsed = { reproject: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--reproject') {
      parsed.reproject = true;
      continue;
    }
    const key = FLAGS[flag];
    const value = argv[i + 1];
    if (!key || value == null || value.startsWith('--')) throw new Error(`unknown argument ${flag}`);
    parsed[key] = value;
    i += 1;
  }
  return parsed;
}

function rel(value, suffix) {
  if (value) return value;
  return join(repoRoot(), suffix);
}

function resolve(argv) {
  const parsed = parseArgs(argv);
  return {
    reproject: parsed.reproject,
    out: rel(parsed.out, 'migration/lanes/design/out/parity'),
    urlMap: rel(parsed.urlMap, 'migration/contracts/url-map.csv'),
    t27: rel(parsed.t27, 'migration/tasks/T27.md'),
    scratch: parsed.scratch ?? null,
    origins: {
      live: parsed.live ?? 'https://www.zawlodzki.pl',
      local: parsed.local ?? 'http://127.0.0.1:8790',
      staging: parsed.staging ?? 'https://zawlodzki-web.zawlodzki.workers.dev',
    },
  };
}

function readStatus(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') throw incomplete('t27-unreadable');
    throw error;
  }
  try {
    return readChromePolicy(text).status;
  } catch {
    throw incomplete('t27-unreadable');
  }
}

function readLedger(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (error && error.code === 'ENOENT') throw incomplete('incomplete-write');
    throw error;
  }
  const facts = [];
  for (const line of text.split('\n')) {
    if (line === '') continue;
    try {
      facts.push(JSON.parse(line));
    } catch {
      throw incomplete('incomplete-write');
    }
  }
  return facts;
}

function loadImages(outDir) {
  const images = new Map();
  const dir = join(outDir, 'img');
  let names;
  try {
    names = readdirSync(dir);
  } catch (error) {
    if (error && error.code === 'ENOENT') return images;
    throw error;
  }
  for (const name of names) {
    if (!/^[0-9a-f]{16}\.png$/.test(name)) continue;
    images.set(`img/${name}`, readFileSync(join(dir, name)));
  }
  return images;
}

async function preflight(origins) {
  for (const name of ORIGINS) {
    let response;
    try {
      response = await fetch(origins[name], { redirect: 'manual' });
    } catch {
      throw incomplete('worker-down', name);
    }
    try {
      await response.body?.cancel();
    } catch {
      // The origin answered. Closing the body is not a second reachability check.
    }
  }
}

function imageName(bytes) {
  return `img/${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.png`;
}

function pageHash(shot) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(shot.width, 0);
  head.writeUInt32BE(shot.height, 4);
  return createHash('sha256').update(head).update(shot.data).digest('hex');
}

function stripFields(strip) {
  return { h: strip.h, empty: strip.empty, hash: strip.hash };
}

function bodySection(shot) {
  const top = shot.header.empty ? 0 : shot.header.y + shot.header.h;
  const bottom = shot.footer.empty ? shot.height : shot.footer.y;
  const y = Math.max(0, Math.min(shot.height, top));
  const h = Math.max(0, Math.min(shot.height, bottom) - y);
  return { x: 0, y, w: shot.width, h, id: '', className: 'main' };
}

function comparable(left, right) {
  if (left.sections.length > 0 && left.sections.length === right.sections.length) return [left, right];
  return [
    { ...left, sections: [bodySection(left)] },
    { ...right, sections: [bodySection(right)] },
  ];
}

function factsAtWidth(path, width, pathShots, images) {
  const diffs = SLOTS.map(slot => {
    const [left, right] = comparable(pathShots[slot.left][width], pathShots[slot.right][width]);
    return { slot, diff: diffPage(left, right) };
  });
  const facts = [];
  for (const { slot, diff } of diffs) {
    const bytes = encodeSideBySide(diff);
    const sbs = imageName(bytes);
    images.set(sbs, bytes);
    facts.push(pixelFact({
      path,
      width,
      slot: slot.id,
      regions: diff.regions,
      sbs,
      leftHash: pageHash(pathShots[slot.left][width]),
      rightHash: pageHash(pathShots[slot.right][width]),
    }));
  }
  for (const { slot, diff } of diffs) {
    if (slot.bearing !== 'load') continue;
    for (const edge of EDGES) {
      facts.push(chromeFact({
        path,
        width,
        slot: slot.id,
        edge,
        left: stripFields(diff.chrome[edge].left),
        right: stripFields(diff.chrome[edge].right),
      }));
    }
  }
  return facts;
}

function indexStyle(styleFacts) {
  const map = new Map();
  for (const fact of styleFacts) map.set(`${fact.path}\0${fact.rule}\0${fact.origin}`, fact);
  return map;
}

function scratchDir(pathShots) {
  if (!pathShots) return null;
  for (const widths of Object.values(pathShots)) {
    for (const shot of Object.values(widths)) {
      if (shot && typeof shot.png === 'string') return dirname(shot.png);
    }
  }
  return null;
}

function dropShots(pathShots) {
  if (!pathShots) return;
  for (const widths of Object.values(pathShots)) {
    for (const shot of Object.values(widths)) {
      if (!shot || typeof shot.png !== 'string') continue;
      try {
        unlinkSync(shot.png);
      } catch (error) {
        if (!error || error.code !== 'ENOENT') throw error;
      }
    }
  }
}

function removeScratch(dir) {
  if (!dir) return;
  try {
    rmdirSync(dir);
  } catch (error) {
    if (!error || (error.code !== 'ENOENT' && error.code !== 'ENOTEMPTY')) throw error;
  }
}

function buildFacts(paths, captured, images) {
  const styles = indexStyle(captured.styleFacts ?? []);
  const facts = [];
  const scratch = scratchDir(captured.shots?.[paths[0]]);
  try {
    for (const path of paths) {
      const pathShots = captured.shots[path];
      for (const width of SHOTS) facts.push(...factsAtWidth(path, width, pathShots, images));
      for (const rule of RULES) {
        for (const origin of ORIGINS) {
          const fact = styles.get(`${path}\0${rule.id}\0${origin}`);
          if (fact) facts.push(fact);
        }
      }
      dropShots(pathShots);
      delete captured.shots[path];
    }
    return facts;
  } finally {
    // Full-page PNGs stay out of the published tree, including when a later path throws.
    for (const pathShots of Object.values(captured.shots ?? {})) dropShots(pathShots);
    removeScratch(scratch);
  }
}

function directoryBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += directoryBytes(full);
    else if (entry.isFile()) total += statSync(full).size;
  }
  return total;
}

function finish(outDir) {
  const report = JSON.parse(readFileSync(join(outDir, 'report.json'), 'utf8'));
  const counts = report.counts;
  process.stdout.write(
    `parity: complete corpus=${report.corpus} match=${counts.match} intended=${counts.intended} chrome=${counts.chrome} lag=${counts.lag} defect=${counts.defect} bytes=${directoryBytes(outDir)}\n`,
  );
  return counts.defect > 0 ? 1 : 0;
}

function withoutIdleBoxes(facts, paths, status) {
  const first = project(facts, { status, paths, rules: RULES });
  const keep = new Set();
  for (const verdict of first) {
    if (verdict.plane === 'style' && verdict.tag === 'intended' && verdict.rule) {
      keep.add(`${verdict.path}\0${verdict.rule}\0${verdict.origin}`);
    }
  }
  return facts.map(fact => {
    if (fact.plane !== 'style' || fact.origin === 'live') return fact;
    if (keep.has(`${fact.path}\0${fact.rule}\0${fact.origin}`)) return fact;
    if (!fact.shotBoxes || Object.keys(fact.shotBoxes).length === 0) return fact;
    return styleFact({ ...fact, shotBoxes: {} });
  });
}

async function seal(outDir, paths, status, facts, images) {
  const slim = withoutIdleBoxes(facts, paths, status);
  const verdicts = project(slim, { status, paths, rules: RULES });
  const report = summarize(paths, verdicts, {
    t27: status,
    channelSlop: CHANNEL_SLOP,
    budget: BUDGET,
  });
  await commit(outDir, slim, report, images);
  return finish(outDir);
}

async function run(argv) {
  const opts = resolve(argv);
  const paths = readKeepPaths(readFileSync(opts.urlMap, 'utf8'));
  const status = readStatus(opts.t27);
  if (opts.reproject) {
    const facts = readLedger(join(opts.out, 'facts.jsonl'));
    return seal(opts.out, paths, status, facts, loadImages(opts.out));
  }
  await preflight(opts.origins);
  const images = new Map();
  const facts = [];
  // One path at a time. A full-page RGBA bitmap for every keep URL does not fit in one Chrome session.
  for (let index = 0; index < paths.length; index += 1) {
    const path = paths[index];
    process.stderr.write(`parity: capture ${index + 1}/${paths.length} ${path}\n`);
    const captureOpts = { paths: [path], origins: opts.origins, rules: RULES };
    if (opts.scratch) captureOpts.scratch = opts.scratch;
    let captured;
    try {
      captured = await capturePath(captureOpts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stderr.write(`parity: retry ${path} ${message.split('\n')[0]}\n`);
      captured = await capturePath(captureOpts);
    }
    facts.push(...buildFacts([path], captured, images));
  }
  return seal(opts.out, paths, status, facts, images);
}

export async function main(argv = process.argv.slice(2)) {
  try {
    return await run(argv);
  } catch (error) {
    if (reportIncomplete(error)) return 2;
    throw error;
  }
}

function resolved(file) {
  try {
    return realpathSync(file);
  } catch {
    // realpath throws when argv names a path that is already gone.
    return file;
  }
}

function isEntry() {
  const entry = process.argv[1];
  if (!entry) return false;
  return resolved(fileURLToPath(import.meta.url)) === resolved(entry);
}

if (isEntry()) {
  main().then(code => {
    process.exit(code);
  }).catch(error => {
    if (!reportIncomplete(error)) process.stderr.write(`${error?.stack ?? error}\n`);
    process.exit(2);
  });
}
