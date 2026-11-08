import { spawn } from 'node:child_process';
import { accessSync, constants, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { breakWidth, endsWidth, RULES, shotWidth, styleFact } from './parity.mjs';
import { decodePng } from './publish.mjs';

const VIEW_HEIGHT = 900;
const ORIGIN_IDS = ['live', 'local', 'staging'];
const SHOT_PX = [shotWidth(1280).px, shotWidth(375).px];
const STATE_ORDER = ['rest', 'hover', 'active', 'focus', 'invalid'];
// The ring is declared on :focus-visible. Forcing :focus alone leaves the user-agent outline.
const FORCED = {
  hover: ['hover'],
  active: ['active'],
  focus: ['focus', 'focus-visible'],
};
const DEFAULT_ORIGINS = {
  live: 'https://www.zawlodzki.pl',
  local: 'http://127.0.0.1:8790',
  staging: 'https://zawlodzki-web.zawlodzki.workers.dev',
};

const MAC_CHROME = '/Applications/Google Chrome.app';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function executableFile(file) {
  try {
    if (!statSync(file).isFile()) return false;
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function macChrome(file) {
  return String(file).includes(MAC_CHROME);
}

function cacheRoots(env) {
  const roots = [];
  if (env.HOME) roots.push(join(env.HOME, '.cache', 'ms-playwright'));
  const rootCache = '/root/.cache/ms-playwright';
  if (!roots.includes(rootCache)) roots.push(rootCache);
  return roots;
}

function firstPlaywrightChrome(root) {
  const hits = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
        continue;
      }
      if (entry.name !== 'chrome') continue;
      if (!full.split(sep).some(part => part.startsWith('chrome-linux'))) continue;
      if (macChrome(full) || !executableFile(full)) continue;
      hits.push(full);
    }
  }
  hits.sort();
  return hits[0] ?? null;
}

export function resolveChrome(env = process.env) {
  const source = env ?? {};
  const fromEnv = typeof source.CHROME_BIN === 'string' ? source.CHROME_BIN.trim() : '';
  if (fromEnv && !macChrome(fromEnv) && executableFile(fromEnv)) return fromEnv;
  const chromium = '/usr/local/bin/chromium';
  if (executableFile(chromium)) return chromium;
  for (const root of cacheRoots(source)) {
    const found = firstPlaywrightChrome(root);
    if (found) return found;
  }
  throw new Error('browser-missing');
}

function judgeOf(rule) {
  const px = rule.judgeAt.px;
  try {
    endsWidth(px);
    return { px, kind: 'ends' };
  } catch {
    // endsWidth rejects the break widths. breakWidth validates the rest.
    return { px: breakWidth(px).px, kind: 'break' };
  }
}

function visitPlan(rules) {
  const steps = [];
  const byPx = new Map();
  const slot = (px) => {
    let step = byPx.get(px);
    if (!step) {
      step = { px, shot: false, judged: [] };
      byPx.set(px, step);
      steps.push(step);
    }
    return step;
  };
  for (const px of SHOT_PX) slot(px).shot = true;
  for (const rule of rules) {
    const judged = judgeOf(rule);
    slot(judged.px).judged.push({ rule, kind: judged.kind });
  }
  return steps;
}

function wanted(rule) {
  const keys = new Set();
  const take = (key) => {
    if (key === 'countMin' || key === 'countMax') return;
    if (key === 'backgroundImageOn') {
      keys.add('backgroundColor');
      keys.add('backgroundImage');
      return;
    }
    keys.add(key);
  };
  if (rule.to) for (const key of Object.keys(rule.to)) take(key);
  if (rule.forbid) for (const key of Object.keys(rule.forbid)) take(key);
  if (rule.pick === 'anchor-on') {
    keys.add('color');
    keys.add('backgroundColor');
    keys.add('textDecoration');
  }
  if (rule.pick === 'text') keys.add('text');
  if (rule.geometry === 'full-inline') keys.add('fullInline');
  if (rule.state === 'invalid') keys.add('valid');
  return [...keys];
}

function stylePlan(rule) {
  return {
    id: rule.id,
    selector: rule.selector ?? null,
    pick: rule.pick ?? null,
    scope: rule.scope ?? null,
    geometry: rule.geometry ?? null,
    above: rule.above ?? null,
    below: rule.below ?? null,
    state: rule.state ?? null,
    props: wanted(rule),
    background: rule.background ?? null,
    fromWord: rule.fromWord ?? null,
    toWord: rule.toWord ?? null,
  };
}

function wantsBoxes(rule, px) {
  if (rule.boxesAt === 'shots') return true;
  if (rule.boxesAt === 'shot-375') return px === 375;
  return false;
}

function shotBoxMap(rule, found) {
  const boxes = found ?? {};
  if (rule.boxesAt === 'shots') return { 1280: boxes[1280] ?? [], 375: boxes[375] ?? [] };
  if (rule.boxesAt === 'shot-375') return { 375: boxes[375] ?? [] };
  return {};
}

function requirePaths(value) {
  if (!Array.isArray(value) || value.length === 0) throw new Error('paths');
  return value.map(path => {
    if (typeof path !== 'string' || path === '') throw new Error('path');
    if (path !== '/' && (!path.startsWith('/') || path.endsWith('/'))) throw new Error(`path ${path}`);
    return path;
  });
}

function originsOf(opts) {
  const origins = { ...DEFAULT_ORIGINS, ...(opts.origins ?? {}) };
  for (const id of ORIGIN_IDS) {
    if (typeof origins[id] !== 'string' || origins[id] === '') throw new Error(`origin ${id}`);
  }
  return origins;
}

function pngPath(scratch, path, origin, width) {
  const slug = path === '/' ? 'root' : path.replace(/^\//, '').replace(/[^A-Za-z0-9._-]+/g, '-');
  return join(scratch, `${slug}.${origin}.${width}.png`);
}

function sameUrl(left, right) {
  const a = new URL(left);
  const b = new URL(right);
  return a.origin === b.origin && a.pathname === b.pathname;
}

async function killProc(proc) {
  if (!proc || proc.exitCode != null || proc.signalCode != null) return;
  const exited = new Promise(resolve => {
    if (proc.exitCode != null || proc.signalCode != null) resolve();
    else proc.once('exit', () => resolve());
  });
  proc.kill('SIGTERM');
  const done = await Promise.race([exited.then(() => true), delay(2000).then(() => false)]);
  if (!done && proc.exitCode == null && proc.signalCode == null) {
    proc.kill('SIGKILL');
    await Promise.race([exited, delay(2000)]);
  }
}

async function removeProfile(profile) {
  let last;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      rmSync(profile, { recursive: true, force: true });
      return;
    } catch (err) {
      last = err;
      await delay(150);
    }
  }
  throw last;
}

function noteStderr(stderr, chunk) {
  stderr.text += String(chunk);
  if (stderr.text.length > 80_000) stderr.text = stderr.text.slice(-40_000);
}

function waitForPort(proc, stderr) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`chrome start\n${stderr.text.slice(-4000)}`));
    }, 20_000);
    const finish = (err, port) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(port);
    };
    const scan = () => {
      const match = stderr.text.match(/DevTools listening on ws:\/\/(?:\[[^\]]+\]|[^/\s]+):(\d+)\//);
      if (match) finish(null, Number(match[1]));
    };
    const onData = (chunk) => {
      noteStderr(stderr, chunk);
      scan();
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', onData);
    proc.once('exit', (code, signal) => {
      finish(new Error(`chrome exited ${code ?? signal}\n${stderr.text.slice(-4000)}`));
    });
  });
}

async function pageWebSocket(port, stderr) {
  let last = '';
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
      last = JSON.stringify(targets);
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
    }
    await delay(100);
  }
  throw new Error(`cdp page missing\n${last}\n${stderr.text.slice(-2000)}`);
}

function openSocket(url) {
  const ws = new WebSocket(url);
  return new Promise((resolve, reject) => {
    const fail = (err) => reject(err instanceof Error ? err : new Error(String(err)));
    ws.addEventListener('open', () => resolve(ws), { once: true });
    ws.addEventListener('error', (event) => fail(event.error ?? event.message ?? 'cdp websocket'), { once: true });
  });
}

function wire(ws, stderr) {
  let seq = 0;
  const pending = new Map();
  const listeners = [];
  const failPending = (err) => {
    for (const item of pending.values()) item.reject(err);
    pending.clear();
  };
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) item.reject(new Error(msg.error.message ?? 'cdp error'));
      else item.resolve(msg.result ?? {});
    } else if (msg.method) {
      for (const listener of listeners) listener(msg);
    }
  });
  ws.addEventListener('close', () => {
    failPending(new Error(`cdp closed\n${stderr.text.slice(-2000)}`));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const once = (method) => new Promise((resolve) => {
    const listener = (msg) => {
      if (msg.method !== method) return;
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
      resolve(msg.params);
    };
    listeners.push(listener);
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description
        ?? result.exceptionDetails.text
        ?? 'evaluate failed';
      throw new Error(detail);
    }
    return result.result?.value;
  };
  return { send, once, evaluate, ws };
}

async function launchChrome(binary) {
  const profile = mkdtempSync(join(tmpdir(), 'design-parity-chrome-'));
  const stderr = { text: '' };
  const proc = spawn(binary, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--hide-scrollbars',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const info = { pid: proc.pid, closed: false };
  try {
    const port = await waitForPort(proc, stderr);
    const url = await pageWebSocket(port, stderr);
    const ws = await openSocket(url);
    const api = wire(ws, stderr);
    await api.send('Page.enable');
    await api.send('Runtime.enable');
    await api.send('DOM.enable');
    await api.send('CSS.enable');
    // Hover rules live inside @media (hover: hover) and (pointer: fine).
    await api.send('Emulation.setEmulatedMedia', {
      media: 'screen',
      features: [
        { name: 'hover', value: 'hover' },
        { name: 'pointer', value: 'fine' },
      ],
    });
    return {
      ...api,
      info,
      async close() {
        if (info.closed) return;
        try { ws.close(); } catch { /* socket already gone */ }
        await killProc(proc);
        await removeProfile(profile);
        info.closed = true;
      },
    };
  } catch (err) {
    await killProc(proc);
    await removeProfile(profile);
    info.closed = true;
    throw err;
  }
}

async function goto(session, url) {
  let last = `navigated away from ${url}`;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const loaded = session.once('Page.loadEventFired');
      const nav = await session.send('Page.navigate', { url });
      if (nav.errorText) throw new Error(`${nav.errorText} ${url}`);
      await withTimeout(loaded, 20_000, `load ${url}`);
      const href = await session.evaluate('location.href');
      if (sameUrl(href, url)) return;
      last = `navigated away from ${url}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
      await delay(400 * (attempt + 1));
    }
  }
  throw new Error(last);
}

async function metrics(session, width) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width,
    height: VIEW_HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

function runPage(session, fn, arg) {
  return session.evaluate(`(${fn.toString()})(${JSON.stringify(arg)})`);
}

async function forceSelectors(session, selectors, classes) {
  const selector = [...new Set(selectors.filter(Boolean))].join(', ');
  if (!selector) return [];
  const doc = await session.send('DOM.getDocument');
  const found = await session.send('DOM.querySelectorAll', {
    nodeId: doc.root.nodeId,
    selector,
  });
  const nodeIds = found.nodeIds ?? [];
  for (const nodeId of nodeIds) {
    await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: classes });
  }
  return nodeIds;
}

async function clearForced(session, nodeIds) {
  for (const nodeId of nodeIds) {
    try {
      await session.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
    } catch {
      // A navigation drops node ids. The next document has no forced state.
    }
  }
}

function groupByState(entries) {
  const groups = new Map(STATE_ORDER.map(state => [state, []]));
  for (const entry of entries) {
    const state = entry.rule.state || 'rest';
    if (!groups.has(state)) groups.set(state, []);
    groups.get(state).push(entry);
  }
  return groups;
}

async function readStyles(session, entries) {
  const groups = groupByState(entries);
  const out = new Map();
  for (const [state, group] of groups) {
    if (group.length === 0) continue;
    const classes = FORCED[state];
    let nodeIds = [];
    try {
      if (classes) nodeIds = await forceSelectors(session, group.map(entry => entry.rule.selector), classes);
      const result = await runPage(session, probePage, {
        mode: 'style',
        flush: Boolean(classes),
        rules: group.map(entry => stylePlan(entry.rule)),
      });
      for (const row of result.rules) out.set(row.id, row.samples);
    } finally {
      await clearForced(session, nodeIds);
      if (state === 'invalid') await session.evaluate('window.scrollTo(0, 0)');
    }
  }
  return out;
}

async function readBoxes(session, rules) {
  if (rules.length === 0) return new Map();
  const result = await runPage(session, probePage, {
    mode: 'boxes',
    rules: rules.map(stylePlan),
  });
  const out = new Map();
  for (const row of result.rules) out.set(row.id, row.boxes);
  return out;
}

function requireBox(box, label) {
  if (!box) throw new Error(`${label} box`);
  for (const key of ['x', 'y', 'w', 'h']) {
    if (typeof box[key] !== 'number' || !Number.isFinite(box[key])) throw new Error(`${label} box`);
  }
  return box;
}

function shotFrom(bytes, px, layout, file) {
  const decoded = decodePng(bytes);
  if (decoded.width !== px) throw new Error(`shot width ${decoded.width} !== ${px}`);
  const header = requireBox(layout.header, 'header');
  const footer = requireBox(layout.footer, 'footer');
  return {
    width: decoded.width,
    height: decoded.height,
    data: decoded.data,
    header: {
      x: header.x,
      y: header.y,
      w: header.w,
      h: header.h,
      empty: layout.header.empty === true,
    },
    footer: {
      x: footer.x,
      y: footer.y,
      w: footer.w,
      h: footer.h,
      empty: layout.footer.empty === true,
    },
    sections: (layout.sections ?? []).map(section => {
      const box = requireBox(section, 'section');
      return {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        id: typeof section.id === 'string' ? section.id : '',
        className: typeof section.className === 'string' ? section.className : '',
      };
    }),
    png: file,
  };
}

function sameProps(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function slimSamples(rule, samples) {
  const rows = samples.map(sample => (rule.geometry ? sample : { props: sample.props }));
  if (rule.geometry) return rows;
  if (rule.to && (rule.to.countMin != null || rule.to.countMax != null)) return rows;
  const kept = [];
  for (const row of rows) {
    if (kept.some(item => sameProps(item.props, row.props))) continue;
    kept.push(row);
  }
  return kept;
}

function factFor(path, origin, entry, taken) {
  const rule = entry.rule;
  // Shot boxes swallow a pixel region only after an intended verdict. Live boxes are never the right-hand origin.
  // A text rule's box is the whole page, so it must not swallow unrelated regions.
  const keepBoxes = origin !== 'live'
    && (rule.explains === 'inner' || rule.explains === 'section-height')
    && rule.pick !== 'text';
  const samples = slimSamples(rule, taken.samples.get(rule.id) ?? []);
  const fields = {
    plane: 'style',
    path,
    rule: rule.id,
    origin,
    widthKind: entry.kind,
    width: rule.judgeAt.px,
    samples,
    shotBoxes: keepBoxes ? shotBoxMap(rule, taken.boxes.get(rule.id)) : {},
  };
  if (rule.state) fields.state = rule.state;
  return styleFact(fields);
}

async function readPaths(session, opts) {
  const paths = requirePaths(opts.paths);
  const rules = opts.rules ?? RULES;
  if (!Array.isArray(rules)) throw new Error('rules');
  const origins = originsOf(opts);
  const scratch = opts.scratch ?? mkdtempSync(join(tmpdir(), 'design-parity-'));
  mkdirSync(scratch, { recursive: true });
  const steps = visitPlan(rules);
  const judged = steps.flatMap(step => step.judged);
  const shots = {};
  const styleFacts = [];
  for (const path of paths) {
    shots[path] = {};
    for (const origin of ORIGIN_IDS) shots[path][origin] = {};
    const taken = {};
    for (const origin of ORIGIN_IDS) taken[origin] = { samples: new Map(), boxes: new Map() };
    for (const origin of ORIGIN_IDS) {
      const url = new URL(path, origins[origin]).href;
      for (const step of steps) {
        await metrics(session, step.px);
        await goto(session, url);
        await runPage(session, settlePage, step.px);
        if (step.shot) {
          const layout = await runPage(session, probePage, { mode: 'layout' });
          const metrics = await session.send('Page.getLayoutMetrics');
          const contentHeight = Math.max(
            VIEW_HEIGHT,
            Math.ceil(metrics.cssContentSize?.height ?? VIEW_HEIGHT),
          );
          const image = await session.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: true,
            clip: { x: 0, y: 0, width: step.px, height: contentHeight, scale: 1 },
          });
          const file = pngPath(scratch, path, origin, step.px);
          const bytes = Buffer.from(image.data, 'base64');
          writeFileSync(file, bytes);
          shots[path][origin][step.px] = shotFrom(bytes, step.px, layout, file);
          const measured = await readBoxes(session, rules.filter(rule => wantsBoxes(rule, step.px)));
          for (const [id, list] of measured) {
            const current = taken[origin].boxes.get(id) ?? {};
            current[step.px] = list;
            taken[origin].boxes.set(id, current);
          }
        }
        if (step.judged.length > 0) {
          const styles = await readStyles(session, step.judged);
          for (const [id, samples] of styles) taken[origin].samples.set(id, samples);
        }
      }
    }
    for (const entry of judged) {
      for (const origin of ORIGIN_IDS) styleFacts.push(factFor(path, origin, entry, taken[origin]));
    }
  }
  return { shots, styleFacts };
}

export async function capturePath(opts) {
  if (!opts || typeof opts !== 'object') throw new Error('capturePath');
  const chrome = await launchChrome(resolveChrome(process.env));
  try {
    const body = await readPaths(chrome, opts);
    return { ...body, session: chrome.info };
  } finally {
    await chrome.close();
  }
}

async function settlePage(width) {
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  const scrollHeight = () => Math.max(
    document.documentElement ? document.documentElement.scrollHeight : 0,
    document.body ? document.body.scrollHeight : 0,
  );
  await document.fonts.ready;
  for (let i = 0; i < 8; i += 1) {
    if (document.documentElement.clientWidth === width) break;
    await frame();
  }
  const step = Math.max(1, window.innerHeight || width);
  let guard = 0;
  let y = 0;
  let total = scrollHeight();
  while (y + 1 < total) {
    if (guard > 100) throw new Error('scroll did not settle');
    window.scrollTo(0, y);
    await frame();
    y += step;
    total = scrollHeight();
    guard += 1;
  }
  window.scrollTo(0, total);
  await frame();
  window.scrollTo(0, 0);
  await frame();
  const pending = [...document.images].filter(img => !img.complete);
  if (pending.length === 0) return;
  await new Promise((resolve, reject) => {
    let left = pending.length;
    const timer = setTimeout(() => reject(new Error('images stalled')), 15_000);
    const done = () => {
      left -= 1;
      if (left > 0) return;
      clearTimeout(timer);
      resolve();
    };
    for (const img of pending) {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  });
}

async function probePage(plan) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const chCache = new Map();
  const tracked = ['letter-spacing', 'max-inline-size'];
  const harvested = [];
  const validityReport = new WeakMap();

  function hex(color) {
    if (!color || color === 'transparent') return 'transparent';
    ctx.fillStyle = '#010101';
    ctx.fillStyle = color;
    const read = String(ctx.fillStyle).toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(read) && read !== '#010101') return read;
    // fillStyle returns rgba() when the color has alpha, and style facts reject that text.
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const pixel = ctx.getImageData(0, 0, 1, 1).data;
    if (pixel[3] === 0) return 'transparent';
    const value = `#${[pixel[0], pixel[1], pixel[2]].map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
    if (value.includes('oklch')) throw new Error('unconverted color');
    return value;
  }

  function px(value) {
    const n = parseFloat(value);
    if (!Number.isFinite(n)) return 0;
    const rounded = Math.round(n * 1000) / 1000;
    return Math.abs(rounded - Math.round(rounded)) < 0.02 ? Math.round(rounded) : rounded;
  }

  function boxOf(el) {
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round(rect.x + window.scrollX),
      y: Math.round(rect.y + window.scrollY),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    };
  }

  function chWidth(el) {
    const font = getComputedStyle(el).font;
    if (chCache.has(font)) return chCache.get(font);
    const probe = document.createElement('span');
    probe.textContent = '0';
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.font = font;
    document.body.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    probe.remove();
    chCache.set(font, width);
    return width;
  }

  function walkRules(rules) {
    for (const rule of rules) {
      if (rule.style && rule.selectorText) {
        for (const prop of tracked) {
          const value = rule.style.getPropertyValue(prop);
          if (value) harvested.push({ selector: rule.selectorText, prop, value: value.trim() });
        }
        continue;
      }
      if (!rule.cssRules) continue;
      if (rule.media && rule.media.mediaText && !rule.media.matches) continue;
      if (rule.conditionText && rule.constructor && rule.constructor.name === 'CSSSupportsRule') {
        let ok = false;
        try { ok = CSS.supports(rule.conditionText); } catch { ok = false; }
        if (!ok) continue;
      }
      walkRules(rule.cssRules);
    }
  }

  function harvest() {
    const sheets = [...document.styleSheets];
    if (document.adoptedStyleSheets) sheets.push(...document.adoptedStyleSheets);
    for (const sheet of sheets) {
      if (sheet.disabled) continue;
      let rules;
      try { rules = sheet.cssRules; } catch { continue; }
      walkRules(rules);
    }
  }

  function resolveVars(el, value) {
    let current = value;
    for (let i = 0; i < 6; i += 1) {
      const next = current.replace(/var\(\s*(--[-\w]+)\s*(?:,\s*([^)]*))?\)/g, (_, name, fallback) => {
        const resolved = getComputedStyle(el).getPropertyValue(name).trim();
        return resolved || (fallback ? fallback.trim() : '');
      });
      if (next === current) return current.trim();
      current = next;
    }
    return current.trim();
  }

  function lengthToPx(el, token) {
    const match = String(token).trim().match(/^(-?(?:\d+|\d*\.\d+))(px|em|rem|ch|%)$/);
    if (!match) return null;
    const n = Number(match[1]);
    const unit = match[2];
    const style = getComputedStyle(el);
    if (unit === 'px') return n;
    if (unit === 'em') return n * parseFloat(style.fontSize);
    if (unit === 'rem') return n * parseFloat(getComputedStyle(document.documentElement).fontSize);
    if (unit === 'ch') return n * chWidth(el);
    if (unit === '%') return (n / 100) * parseFloat(style.fontSize);
    return null;
  }

  function closestToken(el, prop, usedPx) {
    let best = null;
    let bestDelta = 0.75;
    const consider = (token) => {
      const resolved = resolveVars(el, token);
      const length = lengthToPx(el, resolved);
      if (!Number.isFinite(length)) return;
      const delta = Math.abs(length - usedPx);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = resolved;
      }
    };
    const inline = el.style.getPropertyValue(prop);
    if (inline) consider(inline);
    for (const row of harvested) {
      if (row.prop !== prop) continue;
      let matched = false;
      try { matched = el.matches(row.selector); } catch { matched = false; }
      if (matched) consider(row.value);
    }
    return best;
  }

  function letterToken(el) {
    const raw = getComputedStyle(el).letterSpacing.trim();
    if (raw === 'normal') return 'normal';
    const used = parseFloat(raw);
    const specified = Number.isFinite(used) ? closestToken(el, 'letter-spacing', used) : null;
    if (specified) {
      const em = specified.trim().match(/^(-?(?:\d+|\d*\.\d+))em$/);
      if (em) return `${Number(em[1])}em`;
      if (/^-?(?:\d+|\d*\.\d+)px$/.test(specified.trim())) return specified.trim();
    }
    if (!Number.isFinite(used)) return raw;
    const font = parseFloat(getComputedStyle(el).fontSize);
    if (!font) return raw;
    return `${Math.round((used / font) * 10000) / 10000}em`;
  }

  function chToken(el) {
    const raw = getComputedStyle(el).maxInlineSize.trim();
    if (raw === 'none' || raw === '') return 'none';
    const used = parseFloat(raw);
    const specified = Number.isFinite(used) ? closestToken(el, 'max-inline-size', used) : null;
    if (specified) {
      const match = specified.trim().match(/^(-?(?:\d+|\d*\.\d+))ch$/);
      if (match) return Number(match[1]);
    }
    const width = chWidth(el);
    if (!width || !Number.isFinite(used)) return Number.isFinite(used) ? used : 'none';
    return Math.round((used / width) * 1000) / 1000;
  }

  function imageToken(value) {
    if (!value || value === 'none') return 'none';
    return 'image';
  }

  function filterToken(value) {
    if (!value || value === 'none') return 'none';
    const match = value.match(/grayscale\(\s*([0-9.]+)(%?)\s*\)/);
    if (!match) return 'none';
    const amount = Number(match[1]);
    const scaled = match[2] === '%' ? amount / 100 : amount;
    return scaled >= 1 ? 'grayscale' : 'none';
  }

  function radius(style) {
    const corners = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']
      .map(key => px(style[key]));
    if (corners.every(corner => corner === corners[0])) return corners[0];
    return corners.join(' ');
  }

  function surfaceHex(el) {
    let node = el;
    while (node) {
      const value = hex(getComputedStyle(node).backgroundColor);
      if (value !== 'transparent') return value;
      node = node.parentElement;
    }
    return hex(getComputedStyle(document.documentElement).backgroundColor);
  }

  function readProps(el, keys) {
    const style = getComputedStyle(el);
    const props = {};
    for (const key of keys) {
      if (key === 'paddingBlock') {
        props.paddingTop = px(style.paddingTop);
        props.paddingBottom = px(style.paddingBottom);
      } else if (key === 'borderRadius') props.borderRadius = radius(style);
      else if (key === 'backgroundColor') props.backgroundColor = hex(style.backgroundColor);
      else if (key === 'color') props.color = hex(style.color);
      else if (key === 'borderColor') props.borderColor = hex(style.borderTopColor);
      else if (key === 'backgroundImage') props.backgroundImage = imageToken(style.backgroundImage);
      else if (key === 'fontWeight') props.fontWeight = style.fontWeight;
      else if (key === 'letterSpacing') props.letterSpacing = letterToken(el);
      else if (key === 'outlineWidth') props.outlineWidth = px(style.outlineWidth);
      else if (key === 'scrollbarGutter') props.scrollbarGutter = style.scrollbarGutter || 'auto';
      else if (key === 'backgroundClip') props.backgroundClip = style.backgroundClip || style.webkitBackgroundClip || 'border-box';
      else if (key === 'filter') props.filter = filterToken(style.filter);
      else if (key === 'text') props.text = (el.textContent || '').trim();
      else if (key === 'maxInlineSizeCh') props.maxInlineSizeCh = chToken(el);
      else if (key === 'textDecoration') props.textDecoration = style.textDecorationLine || style.textDecoration || 'none';
      else if (key === 'fullInline') {
        const parentInline = el.parentElement ? el.parentElement.getBoundingClientRect().width : 0;
        const width = el.getBoundingClientRect().width;
        props.fullInline = parentInline > 0 && width >= parentInline - 1;
        props.parentInline = Math.round(parentInline);
      }
    }
    return props;
  }

  function targets(spec) {
    if (spec.pick === 'anchor-on') {
      return [...document.querySelectorAll('a')].flatMap(el => {
        const background = surfaceHex(el);
        if (spec.background && background.toLowerCase() !== String(spec.background).toLowerCase()) return [];
        return [{ el, background }];
      });
    }
    if (spec.pick === 'text') {
      const el = document.querySelector(spec.scope || 'main');
      return el ? [{ el }] : [];
    }
    if (spec.geometry === 'y-above') {
      const out = [];
      for (const root of document.querySelectorAll(spec.selector || 'section.hero')) {
        const above = spec.above ? root.querySelector(spec.above) : null;
        const below = spec.below ? root.querySelector(spec.below) : null;
        if (above) out.push({ el: above, part: spec.above });
        if (below) out.push({ el: below, part: spec.below });
      }
      return out;
    }
    if (!spec.selector) return [];
    return [...document.querySelectorAll(spec.selector)].map(el => ({ el }));
  }

  function markInvalid(el) {
    const previous = 'value' in el ? el.value : null;
    if ('value' in el) el.value = 'invalid-value';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (el.setCustomValidity && el.validity && el.validity.valid) el.setCustomValidity('invalid');
    let reported = false;
    if (typeof el.reportValidity === 'function') reported = el.reportValidity();
    else if (el.validity) reported = el.validity.valid === true;
    validityReport.set(el, reported);
    return () => {
      if (el.setCustomValidity) el.setCustomValidity('');
      if (previous != null) el.value = previous;
      validityReport.delete(el);
    };
  }

  function sampleOf(spec, target) {
    if (spec.geometry === 'y-above') return { box: boxOf(target.el), props: { part: target.part } };
    const props = readProps(target.el, spec.props || []);
    if (spec.pick === 'anchor-on') props.backgroundColor = target.background || surfaceHex(target.el);
    if (spec.pick === 'text') props.text = keptWords(props.text, spec.fromWord, spec.toWord);
    if (spec.state === 'invalid') props.valid = validityReport.get(target.el) === true;
    return { box: boxOf(target.el), props };
  }

  function keptWords(text, fromWord, toWord) {
    const kept = [];
    for (const word of [fromWord, toWord]) {
      if (!word || kept.includes(word)) continue;
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'u').test(text)) kept.push(word);
    }
    return kept.join(' ');
  }

  async function collect(spec) {
    const found = targets(spec);
    const restore = [];
    if (spec.state === 'invalid') {
      for (const target of found) restore.push(markInvalid(target.el));
      if (found.length > 0) await new Promise(resolve => requestAnimationFrame(resolve));
    }
    try {
      return found.map(target => sampleOf(spec, target));
    } finally {
      for (const restoreOne of restore.reverse()) restoreOne();
    }
  }

  function painted(el) {
    if (!el) return { x: 0, y: 0, w: 0, h: 0, empty: true };
    const text = (el.textContent || '').trim();
    if (el.children.length === 0 && text === '') return { x: 0, y: 0, w: 0, h: 0, empty: true };
    const box = boxOf(el);
    return { ...box, empty: box.h === 0 };
  }

  function siteHeader() {
    return document.querySelector('[role="banner"]') || document.querySelector('body > header');
  }

  function siteFooter() {
    return document.querySelector('[role="contentinfo"]') || document.querySelector('footer');
  }

  function classNameOf(el) {
    if (typeof el.className === 'string') return el.className;
    return el.getAttribute('class') || '';
  }

  function isBand(el) {
    if (el.matches('section.section')) return true;
    const tokens = (el.getAttribute('class') || '').split(/\s+/);
    return tokens.some(token => token === 'section' || token.endsWith('-section'));
  }

  function sectionEls() {
    const rebuild = [...document.querySelectorAll('section.section')];
    if (rebuild.length > 0) return rebuild;
    const all = [...document.querySelectorAll('div, section')].filter(isBand);
    const outer = all.filter(el => !all.some(other => other !== el && other.contains(el)));
    const header = siteHeader();
    const footer = siteFooter();
    const top = header ? boxOf(header).y + boxOf(header).h : 0;
    const pageBottom = Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0,
    );
    const bottom = footer ? boxOf(footer).y : pageBottom;
    const span = Math.max(1, bottom - top);
    let covered = 0;
    for (const el of outer) {
      const box = boxOf(el);
      const start = Math.max(box.y, top);
      const end = Math.min(box.y + box.h, bottom);
      if (end > start) covered += end - start;
    }
    if (outer.length > 0 && covered / span >= 0.7) return outer;
    return [];
  }

  if (plan.flush) {
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  if (plan.mode === 'layout') {
    return {
      header: painted(siteHeader()),
      footer: painted(siteFooter()),
      sections: sectionEls().map(el => ({
        ...boxOf(el),
        id: el.id || '',
        className: classNameOf(el),
      })),
    };
  }
  harvest();
  if (plan.mode === 'boxes') {
    const rules = [];
    for (const spec of plan.rules) {
      const samples = await collect(spec);
      rules.push({ id: spec.id, boxes: samples.map(sample => sample.box) });
    }
    return { rules };
  }
  const rules = [];
  for (const spec of plan.rules) {
    rules.push({ id: spec.id, samples: await collect(spec) });
  }
  return { rules };
}
