// Run from the repository root after `web.sh up --port 8790` and `web.sh doctor`. Usage: node verify.cjs <frames-dir>
// The c15t backend only answers allow-listed origins. On 127.0.0.1 its loader cannot confirm a stored
// choice and shows the banner again about 900 ms after every load, with or without a view transition.
// The "allow-listed" runs therefore serve this branch's local Worker under the staging hostname:
// every request for that host is answered by 127.0.0.1:8790, so c15t sees a real visitor origin while
// all HTML, CSS and JS come from this build. Only consent.zawlodzki.com and Sanity images go out; analytics are aborted.
// Each run uses a fresh profile with "Preload pages" off: speculation-rules prefetches bypass Playwright
// routing and would fetch main's HTML from real staging instead of this build.
const pw = require(process.cwd() + '/node_modules/.pnpm/playwright-core@1.65.0/node_modules/playwright-core');
const sharp = require(process.cwd() + '/node_modules/.pnpm/sharp@0.35.5_@types+node@24.19.2/node_modules/sharp');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const out = __dirname;
const framesDir = process.argv[2];
const LOCAL = 'http://127.0.0.1:8790';
const ALLOWED = 'https://zawlodzki-web.zawlodzki.workers.dev';
const WIDTHS = [375, 1280];
const profiles = [];
const contexts = [];
const OUTBOUND = new Set(['consent.zawlodzki.com', 'cdn.sanity.io']);

async function newContext({ origin, width, storageState, video }) {
  // Chromium's singleton socket path must stay short, so the profile cannot live under a long scratch path.
  const profile = fs.mkdtempSync('/tmp/t121-');
  profiles.push(profile);
  fs.mkdirSync(path.join(profile, 'Default'));
  fs.writeFileSync(path.join(profile, 'Default', 'Preferences'), JSON.stringify({ net: { network_prediction_options: 2 } }));
  const ctx = await pw.chromium.launchPersistentContext(profile, {
    executablePath: '/opt/agent-vm/chromium/chrome',
    args: ['--no-sandbox'],
    ignoreDefaultArgs: ['--disable-back-forward-cache'],
    viewport: { width, height: 800 },
    ...(video && { recordVideo: { dir: framesDir, size: { width, height: 800 } } }),
  });
  contexts.push(ctx);
  if (storageState) {
    await ctx.addCookies(storageState.cookies);
    const stored = storageState.origins.find(o => o.origin === origin)?.localStorage ?? [];
    await ctx.addInitScript(items => {
      if (location.origin === items.origin && !sessionStorage.getItem('t121:seeded')) {
        for (const { name, value } of items.stored) localStorage.setItem(name, value);
        sessionStorage.setItem('t121:seeded', '1');
      }
    }, { origin, stored });
  }
  const blocked = new Set();
  await ctx.route(url => !url.href.startsWith(origin) && !OUTBOUND.has(url.hostname), r => {
    blocked.add(new URL(r.request().url()).hostname);
    return r.abort();
  });
  if (origin === ALLOWED) {
    await ctx.route(`${ALLOWED}/**`, async r => {
      const u = new URL(r.request().url());
      await r.fulfill({ response: await r.fetch({ url: LOCAL + u.pathname + u.search, maxRedirects: 0 }) });
    });
  }
  await ctx.addInitScript(() => {
    const doc = { path: location.pathname, mountedAt: null, maxOpacity: 0, atSwap: null, atReveal: null, transition: null };
    const key = `t121:${performance.timeOrigin}`;
    const bannerOpacity = () => {
      const b = document.querySelector('[data-testid="consent-banner-root"]');
      if (!b || !b.getClientRects().length) return 0;
      const cs = getComputedStyle(b);
      return cs.visibility === 'hidden' ? 0 : +cs.opacity;
    };
    const save = () => sessionStorage.setItem(key, JSON.stringify(doc));
    const tick = () => {
      if (document.querySelector('[data-testid="consent-banner-root"]') && doc.mountedAt === null) doc.mountedAt = Math.round(performance.now());
      const o = bannerOpacity();
      if (o > doc.maxOpacity) { doc.maxOpacity = o; save(); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    addEventListener('pageswap', () => { doc.atSwap = bannerOpacity(); save(); });
    addEventListener('pagereveal', e => {
      doc.atReveal = bannerOpacity();
      doc.transition = { present: !!e.viewTransition };
      save();
      e.viewTransition?.ready.then(() => {
        doc.transition.animations = document.getAnimations()
          .filter(a => a.animationName?.includes('view-transition') || String(a.effect?.pseudoElement).includes('view-transition'))
          .map(a => ({ pseudo: a.effect.pseudoElement, duration: a.effect.getTiming().duration }));
        save();
      }, () => {});
    });
    addEventListener('pageshow', e => { doc.show = { persisted: e.persisted, type: performance.getEntriesByType('navigation')[0]?.type }; save(); });
  });
  return { ctx, blocked };
}

const clearDocs = p => p.evaluate(() => Object.keys(sessionStorage).filter(k => /^t121:\d/.test(k)).forEach(k => sessionStorage.removeItem(k)));
const docs = p => p.evaluate(() => Object.keys(sessionStorage).filter(k => /^t121:\d/.test(k)).sort().map(k => JSON.parse(sessionStorage.getItem(k))));

async function decide(origin, choice) {
  const { ctx } = await newContext({ origin, width: 1280 });
  const p = await ctx.newPage();
  await p.goto(origin + '/');
  await p.getByTestId('consent-banner-root').waitFor({ state: 'visible', timeout: 15000 });
  await p.getByTestId(`consent-banner-${choice}-button`).click();
  await p.getByTestId('consent-banner-root').waitFor({ state: 'hidden' });
  await p.waitForTimeout(1000);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

// Pixel signature of the open banner: share of pixels inside the reject button's box that match its fill.
async function bannerScore(file, sig) {
  const { data, info } = await sharp(file).extract(sig.box).raw().toBuffer({ resolveWithObject: true });
  let hit = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (Math.abs(data[i] - sig.rgb[0]) + Math.abs(data[i + 1] - sig.rgb[1]) + Math.abs(data[i + 2] - sig.rgb[2]) < 60) hit++;
  }
  return +(hit / (info.width * info.height)).toFixed(3);
}

async function signature(width) {
  const { ctx } = await newContext({ origin: ALLOWED, width });
  const p = await ctx.newPage();
  await p.goto(ALLOWED + '/');
  const btn = p.getByTestId('consent-banner-reject-button');
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await p.waitForTimeout(500);
  const file = path.join(out, `first-visit-${width}.png`);
  await p.screenshot({ path: file });
  const r = await btn.boundingBox();
  const box = { left: Math.round(r.x + 4), top: Math.round(r.y + 4), width: Math.round(r.width - 8), height: Math.round(r.height - 8) };
  const { data } = await sharp(file).extract({ left: Math.round(r.x + 14), top: Math.round(r.y + r.height / 2), width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const sig = { box, rgb: [...data.subarray(0, 3)] };
  sig.positive = await bannerScore(file, sig);
  await ctx.close();
  return sig;
}

async function navigate({ origin, width, storageState, choice, sig, video }) {
  const label = `${origin === LOCAL ? 'before-local' : 'after'}-${choice}-${width}`;
  const { ctx, blocked } = await newContext({ origin, width, storageState, video });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const frames = [];
  const dir = path.join(framesDir, label);
  fs.mkdirSync(dir, { recursive: true });
  cdp.on('Page.screencastFrame', f => {
    frames.push({ t: f.metadata.timestamp, data: f.data });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await p.goto(origin + '/');
  // The original flash came from clicking ~600 ms after load, just as the loader re-mounted the banner.
  await p.waitForTimeout(600);
  if (width === 375) {
    await p.locator('.nav-toggle').click();
    assert(await p.locator('#site-nav').evaluate(e => e.matches(':popover-open')), 'mobile menu opens');
  }
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: width, maxHeight: 800 });
  await p.waitForTimeout(150);
  const clickAt = Date.now() / 1000;
  await p.locator('.nav-link').first().click();
  await p.waitForURL('**/o-mnie');
  await p.waitForTimeout(2500);
  await cdp.send('Page.stopScreencast');
  const scored = [];
  for (const [i, f] of frames.entries()) {
    const file = path.join(dir, `${String(i + 1).padStart(3, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    scored.push({ frame: path.basename(file), ms: Math.round((f.t - clickAt) * 1000), bannerScore: await bannerScore(file, sig) });
  }
  const gaps = scored.slice(1).map((f, i) => f.ms - scored[i].ms);
  const row = {
    label, origin, width, choice,
    documents: await docs(p),
    frames: scored.length,
    framesWithBanner: scored.filter(f => f.bannerScore >= sig.positive / 2).map(f => f.frame),
    medianFrameGapMs: gaps.sort((a, b) => a - b)[gaps.length >> 1],
    windowMs: [scored[0]?.ms, scored.at(-1)?.ms],
    blockedThirdParty: [...blocked].sort(),
    scores: scored,
  };
  return { row, p, ctx, dir };
}

async function sheet(dir, scored, file, width) {
  const pick = scored.filter(f => f.ms >= -60 && f.ms <= 700);
  const thumbW = width === 375 ? 125 : 320, thumbH = Math.round(800 * thumbW / width), cols = width === 375 ? 8 : 4, label = 18;
  const rows = Math.ceil(pick.length / cols);
  const composites = [];
  for (const [i, f] of pick.entries()) {
    const x = (i % cols) * thumbW, y = Math.floor(i / cols) * (thumbH + label);
    composites.push({ input: await sharp(path.join(dir, f.frame)).resize(thumbW).toBuffer(), left: x, top: y + label });
    composites.push({ input: Buffer.from(`<svg width="${thumbW}" height="${label}"><text x="3" y="13" font-family="monospace" font-size="11">${f.ms}ms s=${f.bannerScore}</text></svg>`), left: x, top: y });
  }
  await sharp({ create: { width: cols * thumbW, height: rows * (thumbH + label), channels: 3, background: '#fff' } })
    .composite(composites).jpeg({ quality: 72 }).toFile(file);
}

(async () => {
  const results = { signatures: {}, runs: [] };
  try {
    const states = { reject: await decide(ALLOWED, 'reject'), accept: await decide(ALLOWED, 'accept') };
    const localReject = await decide(LOCAL, 'reject');
    for (const width of WIDTHS) {
      const sig = (results.signatures[width] = await signature(width));
      assert(sig.positive > 0.5, `first visit shows the banner at ${width}`);

      const before = await navigate({ origin: LOCAL, width, storageState: localReject, choice: 'reject', sig });
      await sheet(before.dir, before.row.scores, path.join(out, `${before.row.label}-sheet.jpg`), width);
      await before.ctx.close();
      results.runs.push(before.row);

      for (const choice of ['reject', 'accept']) {
        const run = await navigate({ origin: ALLOWED, width, storageState: states[choice], choice, sig, video: true });
        const { row, p, ctx, dir } = run;
        await sheet(dir, row.scores, path.join(out, `${row.label}-sheet.jpg`), width);
        const [oldDoc, newDoc] = row.documents;
        assert.equal(newDoc.path, '/o-mnie');
        assert(newDoc.transition.present, `${row.label}: view transition ran`);
        for (const d of row.documents) assert.equal(d.maxOpacity, 0, `${row.label}: banner never visible on ${d.path}`);
        assert.equal(oldDoc.atSwap, 0); assert.equal(newDoc.atReveal, 0);
        assert.deepEqual(row.framesWithBanner, [], `${row.label}: no captured frame shows the banner`);
        assert(row.windowMs[0] < 0 && row.windowMs[1] > 300, `${row.label}: frames span the whole transition`);

        if (choice === 'reject') {
          await p.goto(ALLOWED + '/');
          await p.waitForTimeout(1500);
          row.anchors = [];
          for (const id of ['crm', 'ai', 'automatyzacja', 'asana']) {
            const link = p.locator(`a[href="#${id}"]`);
            await link.evaluate(e => e.scrollIntoView({ block: 'center' }));
            await link.click();
            await p.waitForTimeout(250);
            const t = await p.evaluate(id => ({ hash: location.hash, top: Math.round(document.getElementById(id).getBoundingClientRect().top), headerBottom: Math.round(document.querySelector('[data-site-header]').getBoundingClientRect().bottom) }), id);
            assert.equal(t.hash, `#${id}`); assert(t.top >= t.headerBottom - 1, `#${id} lands below the sticky header`);
            row.anchors.push({ id, ...t });
          }
          await p.screenshot({ path: path.join(out, `anchors-${width}.png`) });
          await p.locator('a[href="/o-mnie"]').first().evaluate(a => a.click());
          await p.waitForURL('**/o-mnie'); await p.waitForTimeout(600);
          for (const [dir, want] of [['back', '/'], ['forward', '/o-mnie']]) {
            await clearDocs(p);
            await p.evaluate(d => history[d](), dir);
            await p.waitForFunction(want => location.pathname === want, want); await p.waitForTimeout(600);
            row[dir] = await p.evaluate(() => {
              const d = Object.keys(sessionStorage).filter(k => /^t121:\d/.test(k)).map(k => JSON.parse(sessionStorage.getItem(k)));
              return { path: location.pathname, persisted: d.some(x => x.show?.persisted), stuckTransition: !!document.querySelector('html:active-view-transition'), bannerVisible: !!document.querySelector('[data-testid="consent-banner-root"]')?.getClientRects().length };
            });
            assert.equal(row[dir].path, want); assert.equal(row[dir].stuckTransition, false); assert.equal(row[dir].bannerVisible, false);
          }
          if (width === 375) {
            await p.locator('.nav-toggle').click();
            assert(await p.locator('#site-nav').evaluate(e => e.matches(':popover-open')));
            await p.keyboard.press('Escape');
            assert.equal(await p.locator('#site-nav').evaluate(e => e.matches(':popover-open')), false, 'Escape closes the menu');
            row.menu = 'open, Escape closes, navigated via first link (frames above)';
          }
          await p.emulateMedia({ reducedMotion: 'reduce' });
          await clearDocs(p);
          await p.locator('a.logo').click();
          await p.waitForURL(ALLOWED + '/'); await p.waitForTimeout(600);
          const reduced = (await docs(p)).at(-1);
          assert.equal(reduced.path, '/');
          row.reducedMotion = { matches: await p.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), ...reduced.transition };
          assert.equal(reduced.transition.present, false, 'reduced motion: no view transition');
          await p.screenshot({ path: path.join(out, `reduced-motion-${width}.png`) });
        }
        await ctx.close();
        fs.renameSync(await p.video().path(), path.join(out, `${row.label}.webm`));
        results.runs.push(row);
      }
    }
  } finally {
    for (const ctx of contexts) await ctx.close().catch(() => {});
    for (const dir of profiles) fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    fs.writeFileSync(path.join(out, 'acceptance-results.json'), JSON.stringify(results, null, 2) + '\n');
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
