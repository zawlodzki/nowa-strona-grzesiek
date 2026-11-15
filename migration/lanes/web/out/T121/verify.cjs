// Run from repository root after web.sh up + doctor on 8790. No mocks or form submissions.
const { chromium } = require(process.cwd() + '/node_modules/.pnpm/playwright-core@1.65.0/node_modules/playwright-core');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const out = __dirname;
(async () => {
 const browser = await chromium.launch({ executablePath: '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'], ignoreDefaultArgs: ['--disable-back-forward-cache'] });
 const results = [];
 try {
  for (const width of [375, 1280]) {
   const context = await browser.newContext({ viewport: { width, height: 800 }, recordVideo: { dir: out, size: { width, height: 800 } } });
   try {
    await context.addInitScript(() => {
     window.addEventListener('pageshow', e => { window.__show = { persisted: e.persisted, type: performance.getEntriesByType('navigation')[0]?.type }; });
     window.addEventListener('pagereveal', e => {
      window.__transition = { present: !!e.viewTransition };
      if (e.viewTransition) e.viewTransition.ready.then(() => {
       window.__transition.animations = document.getAnimations().filter(a => a.animationName?.includes('view-transition')).map(a => ({ name: a.animationName, duration: a.effect.getTiming().duration }));
      }).catch(e => { window.__transition.error = String(e); });
     });
    });
    const p = await context.newPage();
    const start = Date.now();
    await p.goto('http://127.0.0.1:8790/', { waitUntil: 'domcontentloaded' });
    const banner = p.getByTestId('consent-banner-root');
    await banner.waitFor({ state: 'visible', timeout: 15000 });
    await p.screenshot({ path: `${out}/consent-open-${width}.png` });
    await p.getByTestId('consent-banner-reject-button').click();
    await banner.waitFor({ state: 'hidden' });
    await p.waitForTimeout(1800);
    assert.equal(await banner.isVisible(), false);
    await p.screenshot({ path: `${out}/consent-closed-${width}.png` });
    const row = { width, bannerOpened: true, rejectedAndClosed: true, anchors: [] };
    for (const id of ['crm', 'ai', 'automatyzacja', 'asana']) {
     await p.locator(`a[href="#${id}"]`).evaluate(e => e.scrollIntoView({ block: 'center' }));
     await p.locator(`a[href="#${id}"]`).click();
     await p.waitForTimeout(250);
     const target = await p.evaluate(id => ({ hash: location.hash, top: document.getElementById(id).getBoundingClientRect().top, headerBottom: document.querySelector('[data-site-header]').getBoundingClientRect().bottom, viewport: innerHeight }), id);
     assert.equal(target.hash, `#${id}`); assert(target.top >= target.headerBottom - 1); assert(target.top < target.viewport);
     row.anchors.push({ id, ...target });
    }
    await p.screenshot({ path: `${out}/anchors-${width}.png` });
    await p.goto('http://127.0.0.1:8790/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(600);
    assert.equal(await banner.isVisible(), false);
    if (width === 375) {
     await p.locator('.nav-toggle').click(); assert(await p.locator('#site-nav').evaluate(e => e.matches(':popover-open')));
     await p.keyboard.press('Escape'); assert.equal(await p.locator('#site-nav').evaluate(e => e.matches(':popover-open')), false);
     await p.locator('.nav-toggle').click();
     row.menuOpenEscapeReopen = true;
    }
    await p.screenshot({ path: `${out}/navigation-before-${width}.png` });
    row.navigationVideoOffsetSeconds = (Date.now() - start) / 1000;
    await p.locator('.nav-link').first().click();
    await p.waitForTimeout(400);
    row.navigation = await p.evaluate(() => ({ url: location.pathname, transition: window.__transition, bannerVisible: !!document.querySelector('[data-testid="consent-banner-root"]')?.getClientRects().length, width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    assert.equal(row.navigation.url, '/o-mnie'); assert(row.navigation.transition.present); assert(!row.navigation.bannerVisible);
    await p.screenshot({ path: `${out}/navigation-after-${width}.png` });
    await p.evaluate(() => history.back()); await p.waitForFunction(() => location.pathname === '/' && !!window.__show); await p.waitForTimeout(400);
    row.back = await p.evaluate(() => ({ path: location.pathname, ...window.__show, stuckTransition: !!document.querySelector('html:active-view-transition') }));
    await p.evaluate(() => history.forward()); await p.waitForFunction(() => location.pathname === '/o-mnie' && !!window.__show); await p.waitForTimeout(400);
    row.forward = await p.evaluate(() => ({ path: location.pathname, ...window.__show, stuckTransition: !!document.querySelector('html:active-view-transition') }));
    assert.equal(row.back.path, '/'); assert.equal(row.forward.path, '/o-mnie');
    for (const state of [row.back, row.forward]) { assert(state.persisted || state.type === 'back_forward'); assert.equal(state.stuckTransition, false); }
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.locator('a.logo').click(); await p.waitForTimeout(400);
    row.reducedMotion = await p.evaluate(() => ({ reduce: matchMedia('(prefers-reduced-motion: reduce)').matches, transition: window.__transition }));
    assert(row.reducedMotion.reduce); assert.equal(row.reducedMotion.transition.present, false);
    await p.screenshot({ path: `${out}/reduced-motion-${width}.png` });
    results.push(row);
    await context.close();
    fs.renameSync(await p.video().path(), `${out}/acceptance-${width}.webm`);
   } finally { await context.close(); }
  }
  fs.writeFileSync(`${out}/acceptance-results.json`, JSON.stringify(results, null, 2) + '\n');
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
