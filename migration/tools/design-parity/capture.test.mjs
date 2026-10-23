import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { accessSync, chmodSync, constants, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { capturePath, resolveChrome } from './capture.mjs';
import { RULES } from './parity.mjs';
import { diffPage } from './publish.mjs';

process.env.CHROME_BIN = '/usr/local/bin/google-chrome';

const HTML = `<!doctype html>
<meta charset="utf-8">
<title>parity</title>
<header>Header</header>
<section class="section" id="hero" style="padding:48px;border-radius:20px;background:#0b0a47">
  <a href="#next" style="color:#b0b6eb">Link</a>
</section>
<footer>Footer</footer>
`;

function executable(file) {
  try {
    accessSync(file, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function alive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code !== 'ESRCH';
  }
}

function rgb(shot, x, y) {
  const sx = Math.round(x);
  const sy = Math.round(y);
  assert.ok(sx >= 0 && sy >= 0 && sx < shot.width && sy < shot.height, `pixel ${sx},${sy}`);
  const index = (sy * shot.width + sx) * 4;
  return [shot.data[index], shot.data[index + 1], shot.data[index + 2]];
}

function near(actual, expected) {
  return actual.every((channel, index) => Math.abs(channel - expected[index]) <= 8);
}

function serve(html) {
  const server = createServer((req, res) => {
    const path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname;
    if (path !== '/') {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  server.on('clientError', (_err, socket) => socket.destroy());
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

test('resolveChrome returns CHROME_BIN', () => {
  assert.equal(resolveChrome(process.env), '/usr/local/bin/google-chrome');
});

test('empty CHROME_BIN does not invent a browser', () => {
  const env = { CHROME_BIN: '', HOME: '/tmp/no-such-home' };
  const mac = {
    CHROME_BIN: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    HOME: '/tmp/no-such-home',
  };
  if (executable('/usr/local/bin/chromium')) {
    for (const found of [resolveChrome(env), resolveChrome(mac)]) {
      assert.equal(found.includes('/Applications/Google Chrome.app'), false);
    }
    return;
  }
  assert.throws(() => resolveChrome(env), /browser-missing/);
  assert.throws(() => resolveChrome(mac), /browser-missing/);
});

test('non-executable CHROME_BIN is skipped', () => {
  const home = mkdtempSync(join(tmpdir(), 'parity-chrome-'));
  const planted = join(home, '.cache', 'ms-playwright', 'chromium-1', 'chrome-linux', 'chrome');
  const skipped = join(home, 'not-chrome');
  mkdirSync(join(planted, '..'), { recursive: true });
  writeFileSync(planted, '#!/bin/sh\nexit 0\n');
  chmodSync(planted, 0o755);
  writeFileSync(skipped, '');
  chmodSync(skipped, 0o644);
  try {
    const found = resolveChrome({ CHROME_BIN: skipped, HOME: home });
    assert.equal(found, planted);
    assert.equal(found.includes('/Applications/Google Chrome.app'), false);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test('capturePath screenshots the fixture and leaves no chrome', { timeout: 180_000 }, async () => {
  const scratch = mkdtempSync(join(tmpdir(), 'parity-scratch-'));
  const { server, origin } = await serve(HTML);
  try {
    const opts = {
      origins: { live: origin, local: origin, staging: origin },
      paths: ['/'],
      scratch,
    };
    const first = await capturePath(opts);
    const second = await capturePath(opts);
    const shot = first.shots['/'].live[1280];
    assert.equal(shot.width, 1280);
    assert.equal(shot.data.length, shot.width * shot.height * 4);
    assert.ok(shot.data.some(channel => channel !== 0));
    assert.equal(shot.header.empty, false);
    assert.ok(shot.header.h > 0);
    assert.equal(shot.footer.empty, false);
    assert.ok(shot.footer.h > 0);
    assert.equal(shot.sections.length, 1);
    assert.equal(shot.sections[0].id, 'hero');
    assert.match(shot.sections[0].className, /\bsection\b/);
    const section = shot.sections[0];
    assert.ok(near(rgb(shot, section.x + 24, section.y + 24), [0x0b, 0x0a, 0x47]));
    assert.equal(first.shots['/'].live[375].width, 375);
    assert.equal(first.styleFacts.length, RULES.length * 3);
    const colors = [];
    for (const fact of first.styleFacts) {
      assert.equal(fact.path, '/');
      for (const sample of fact.samples) {
        for (const value of Object.values(sample.props)) {
          assert.equal(String(value).toLowerCase().includes('oklch'), false);
          if (typeof value === 'string' && value.startsWith('#')) colors.push(value);
        }
      }
    }
    assert.ok(colors.includes('#0b0a47'));
    assert.ok(colors.includes('#b0b6eb'));
    const pad = first.styleFacts.find(fact => fact.rule === 'section-y-1440' && fact.origin === 'local');
    assert.equal(pad.samples[0].props.paddingTop, 48);
    assert.equal(pad.samples[0].props.paddingBottom, 48);
    assert.ok(pad.shotBoxes[1280].length > 0);
    assert.ok(pad.shotBoxes[375].length > 0);
    const livePad = first.styleFacts.find(fact => fact.rule === 'section-y-1440' && fact.origin === 'live');
    assert.deepEqual(livePad.shotBoxes, {});
    const navy = first.styleFacts.find(fact => fact.rule === 'solid-navy' && fact.origin === 'staging');
    assert.equal(navy.samples[0].props.backgroundColor, '#0b0a47');
    assert.equal(navy.samples[0].props.backgroundImage, 'none');
    for (const width of [1280, 375]) {
      const across = diffPage(first.shots['/'].live[width], second.shots['/'].live[width]);
      assert.equal(across.regions.filter(region => region.kind === 'inner').length, 0);
      const pair = diffPage(first.shots['/'].live[width], first.shots['/'].local[width]);
      assert.equal(pair.regions.filter(region => region.kind === 'inner').length, 0);
    }
    assert.equal(first.session.closed, true);
    assert.equal(alive(first.session.pid), false);
    assert.equal(second.session.closed, true);
    assert.equal(alive(second.session.pid), false);
  } finally {
    await new Promise(resolve => server.close(resolve));
    rmSync(scratch, { recursive: true, force: true });
  }
});
