// Captures the T03 audit screenshots: fold and full page for each page at desktop and 390px.
// Usage: node migration/lanes/design/out/screens/capture.mjs [--origin https://www.zawlodzki.pl]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const originArg = process.argv.indexOf('--origin');
const ORIGIN = originArg > -1 ? process.argv[originArg + 1] : 'https://www.zawlodzki.pl';
const OUT = dirname(fileURLToPath(import.meta.url));

const PAGES = [
  ['home', '/'],
  ['pipedrive', '/szkolenie-i-wdrozenie-pipedrive'],
  ['ai-b2b', '/wdrozenie-ai-w-sprzedazy-b2b'],
  ['sales-atlas', '/sales-atlas-system'],
  ['blog', '/blog'],
  ['blog-salesforce-cena', '/blog/salesforce-cena'],
];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false, dpr: 1 },
  { name: 'm390', width: 390, height: 844, mobile: true, dpr: 2 },
];

const profile = mkdtempSync(join(tmpdir(), 'zw-capture-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  chrome.on('exit', () => reject(new Error('chrome exited before DevTools came up')));
});

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) {
    for (const l of listeners) l(msg);
  }
});
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
const waitFor = (method, sessionId) =>
  new Promise((resolve) => {
    const l = (msg) => {
      if (msg.method === method && msg.sessionId === sessionId) {
        listeners.splice(listeners.indexOf(l), 1);
        resolve(msg);
      }
    };
    listeners.push(l);
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const vp of VIEWPORTS) {
  for (const [slug, path] of PAGES) {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    await send('Page.enable', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, mobile: vp.mobile }, sessionId);
    if (vp.mobile) {
      await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' }, sessionId);
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sessionId);
    }
    const loaded = waitFor('Page.loadEventFired', sessionId);
    await send('Page.navigate', { url: ORIGIN + path }, sessionId);
    await loaded;
    await sleep(2500);
    const fold = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    writeFileSync(join(OUT, `${slug}-${vp.name}-fold.png`), Buffer.from(fold.data, 'base64'));

    // Scroll through so lazy images and scroll-triggered animations settle before the full capture.
    const { result } = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true }, sessionId);
    for (let y = 0; y < result.value; y += vp.height) {
      await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${y})` }, sessionId);
      await sleep(250);
    }
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' }, sessionId);
    await sleep(800);
    // Full pages are for layout review, so 1x keeps the files small.
    await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 1, mobile: vp.mobile }, sessionId);
    await sleep(300);
    const full = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true }, sessionId);
    writeFileSync(join(OUT, `${slug}-${vp.name}-full.jpg`), Buffer.from(full.data, 'base64'));
    await send('Target.closeTarget', { targetId });
    console.log(`${slug} ${vp.name} ok (${result.value}px tall)`);
  }
}

ws.close();
const exited = new Promise((r) => chrome.on('exit', r));
chrome.kill();
await exited;
rmSync(profile, { recursive: true, force: true });
