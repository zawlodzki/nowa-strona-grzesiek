import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { main } from './run.mjs';

process.env.CHROME_BIN = '/usr/local/bin/google-chrome';

const HTML = `<!doctype html>
<meta charset="utf-8">
<title>parity</title>
<header>Header</header>
<section class="section" id="hero">Section</section>
<footer>Footer</footer>
`;

function serve(html) {
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  // An aborted Chrome socket emits clientError. Without a handler the test process dies.
  server.on('clientError', (_err, socket) => socket.destroy());
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, origin: `http://127.0.0.1:${port}` });
    });
  });
}

function tap(stream) {
  const chunks = [];
  const original = stream.write;
  stream.write = function write(chunk, encoding, callback) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk.toString() : String(chunk));
    return original.call(stream, chunk, encoding, callback);
  };
  return {
    text: () => chunks.join(''),
    restore() {
      stream.write = original;
    },
  };
}

async function stop(server) {
  server.closeAllConnections?.();
  await new Promise(resolve => server.close(resolve));
}

test('main publishes a report, reprojects without the server, and leaves it on worker-down', { timeout: 120_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'parity-run-'));
  const out = join(root, 'out');
  const scratch = join(root, 'scratch');
  const urlMap = join(root, 'url-map.csv');
  const t27 = join(root, 'T27.md');
  await writeFile(urlMap, 'old_path,action,new_path_pl\n/,keep,/\n');
  await writeFile(t27, '---\nstatus: todo\n---\n');
  const { server, origin } = await serve(HTML);
  const flags = (local) => [
    '--live', origin,
    '--local', local,
    '--staging', origin,
    '--url-map', urlMap,
    '--t27', t27,
    '--out', out,
    '--scratch', scratch,
  ];
  try {
    const stdout = tap(process.stdout);
    const stderr = tap(process.stderr);
    let code;
    try {
      code = await main(flags(origin));
    } finally {
      stdout.restore();
      stderr.restore();
    }
    assert.ok(code === 0 || code === 1, `code ${code}\n${stdout.text()}\n${stderr.text()}`);
    const lines = stdout.text().split('\n').filter(line => line !== '');
    assert.equal(lines.length, 1, stdout.text());
    assert.match(lines[0], /^parity: complete corpus=\d+ match=\d+ intended=\d+ chrome=\d+ lag=\d+ defect=\d+ bytes=\d+$/);
    const report = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'));
    assert.equal(report.complete, true);
    assert.equal(typeof report.factsHash, 'string');
    assert.ok(report.factsHash.length > 0);
    const pixel = readFileSync(join(out, 'facts.jsonl'), 'utf8')
      .split('\n')
      .filter(line => line !== '')
      .map(line => JSON.parse(line))
      .find(row => row.plane === 'pixels' && row.width === 1280 && row.slot === 'live-local');
    assert.ok(pixel);
    assert.ok(Array.isArray(pixel.regions));
    assert.match(pixel.sbs, /^img\/[0-9a-f]{16}\.png$/);
    const images = readdirSync(join(out, 'img'));
    assert.ok(images.some(name => /^img\/[0-9a-f]{16}\.png$/.test(`img/${name}`)));
    assert.equal(existsSync(join(out, pixel.sbs)), true);
    if (existsSync(scratch)) {
      assert.deepEqual(readdirSync(scratch).filter(name => name.endsWith('.png')), []);
    }

    await stop(server);

    const againOut = tap(process.stdout);
    const againErr = tap(process.stderr);
    let reprojected;
    try {
      reprojected = await main(['--reproject', ...flags(origin)]);
    } finally {
      againOut.restore();
      againErr.restore();
    }
    assert.ok(reprojected === 0 || reprojected === 1, `reproject ${reprojected}\n${againOut.text()}\n${againErr.text()}`);
    const rewritten = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'));
    assert.equal(rewritten.complete, true);

    const before = readFileSync(join(out, 'report.json'));
    const downOut = tap(process.stdout);
    const downErr = tap(process.stderr);
    let failed;
    try {
      failed = await main(flags('http://127.0.0.1:1'));
    } finally {
      downOut.restore();
      downErr.restore();
    }
    assert.equal(failed, 2, downErr.text());
    assert.match(downErr.text(), /reason=worker-down/);
    assert.equal(downOut.text().includes('parity: complete'), false);
    assert.deepEqual(readFileSync(join(out, 'report.json')), before);
  } finally {
    if (server.listening) await stop(server);
    await rm(root, { recursive: true, force: true });
  }
});
