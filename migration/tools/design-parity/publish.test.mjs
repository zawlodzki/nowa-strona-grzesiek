import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { deflateSync } from 'node:zlib';
import { readReport } from './parity.mjs';
import { BUDGET, commit, decodePng, diffPage, encodeSideBySide } from './publish.mjs';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function rgbaPng(width, height, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function solid(width, height, color) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = color[0];
    data[i * 4 + 1] = color[1];
    data[i * 4 + 2] = color[2];
    data[i * 4 + 3] = color[3];
  }
  return { width, height, data };
}

function preview({ headerH = 5, footerH = 3, width = 10, regions = [], leftHeader = [1, 2, 3, 255], rightHeader = [9, 8, 7, 255] } = {}) {
  const footer = [4, 5, 6, 255];
  const body = [20, 30, 40, 255];
  return {
    regions,
    chrome: {
      header: { left: solid(width, headerH, leftHeader), right: solid(width, headerH, rightHeader) },
      footer: { left: solid(width, footerH, footer), right: solid(width, footerH, footer) },
    },
    aligned: { left: solid(width, 8, body), right: solid(width, 8, body) },
  };
}

function paint(data, width, x, y, w, h, color) {
  for (let row = 0; row < h; row += 1) {
    for (let col = 0; col < w; col += 1) {
      const i = ((y + row) * width + x + col) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = color[3];
    }
  }
}

function shot({ width, headerH, headerColor, sections, sectionColors, footerH, footerColor }) {
  const sectionH = sections.reduce((sum, section) => sum + section.h, 0);
  const height = headerH + sectionH + footerH;
  const data = new Uint8Array(width * height * 4);
  paint(data, width, 0, 0, width, headerH, headerColor);
  let y = headerH;
  const nodes = sections.map((section, index) => {
    paint(data, width, 0, y, width, section.h, sectionColors[index]);
    const node = { x: 0, y, w: width, h: section.h };
    if (section.id) node.id = section.id;
    if (section.className) node.className = section.className;
    y += section.h;
    return node;
  });
  paint(data, width, 0, y, width, footerH, footerColor);
  return {
    width,
    height,
    data,
    header: { x: 0, y: 0, w: width, h: headerH, empty: headerH === 0 },
    footer: { x: 0, y: headerH + sectionH, w: width, h: footerH, empty: footerH === 0 },
    sections: nodes,
  };
}

function cloneShot(source) {
  return {
    width: source.width,
    height: source.height,
    data: new Uint8Array(source.data),
    header: { ...source.header },
    footer: { ...source.footer },
    sections: source.sections.map(section => ({ ...section })),
  };
}

function setRect(page, sectionIndex, x, y, w, h, color) {
  const section = page.sections[sectionIndex];
  paint(page.data, page.width, section.x + x, section.y + y, w, h, color);
}

function baseShot(sections, sectionColors) {
  return shot({
    width: 16,
    headerH: 7,
    headerColor: [12, 12, 12, 255],
    sections,
    sectionColors,
    footerH: 3,
    footerColor: [80, 80, 80, 255],
  });
}

function pixelAt(decoded, x, y) {
  const i = (y * decoded.width + x) * 4;
  return [decoded.data[i], decoded.data[i + 1], decoded.data[i + 2], decoded.data[i + 3]];
}

function imageName(bytes) {
  return `img/${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.png`;
}

function reportOf(t27) {
  return {
    paths: [{ outcome: 'match', path: '/' }],
    counts: { match: 1, defect: 0, lag: 0, chrome: 0, intended: 0 },
    budget: 8388608,
    channelSlop: 16,
    t27,
    corpus: 1,
    complete: true,
  };
}

function fact(name, marker) {
  return {
    width: 1280,
    slot: 'live-local',
    sbs: name,
    regions: [],
    rightHash: marker,
    plane: 'pixels',
    path: '/',
    leftHash: marker,
  };
}

function assertSorted(value) {
  if (Array.isArray(value)) {
    for (const item of value) assertSorted(item);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const keys = Object.keys(value);
  assert.deepEqual(keys, [...keys].sort());
  for (const key of keys) assertSorted(value[key]);
}

test('encodeSideBySide returns equal bytes for the same RGBA', () => {
  const left = preview();
  const right = preview();
  right.chrome.header.left = solid(10, 5, [1, 2, 3, 255]);
  const first = encodeSideBySide(left);
  const second = encodeSideBySide(right);
  assert.deepEqual(first, second);
});

test('decodePng returns the preview dimensions', () => {
  const png = encodeSideBySide(preview());
  const decoded = decodePng(png);
  assert.equal(decoded.width, 10 + 8 + 10);
  assert.equal(decoded.height, 5 + 4 + 3);
  assert.deepEqual(pixelAt(decoded, 0, 0), [1, 2, 3, 255]);
  assert.deepEqual(pixelAt(decoded, 18, 0), [9, 8, 7, 255]);
  assert.deepEqual(pixelAt(decoded, 0, 9), [4, 5, 6, 255]);

  const withRegion = preview({
    regions: [{ block: 'quote', kind: 'inner', x: 0, y: 0, w: 10, h: 2 }],
  });
  const regionPng = encodeSideBySide(withRegion);
  const regionDecoded = decodePng(regionPng);
  assert.equal(regionDecoded.width, 28);
  assert.equal(regionDecoded.height, 5 + 2 + 3);
});

test('decodePng reads an 8-bit RGBA PNG and rejects interlacing and 16-bit', () => {
  const raw = Buffer.from([1, 10, 20, 30, 255, 30, 30, 30, 0]);
  const decoded = decodePng(rgbaPng(2, 1, raw));
  assert.equal(decoded.width, 2);
  assert.equal(decoded.height, 1);
  assert.deepEqual(pixelAt(decoded, 0, 0), [10, 20, 30, 255]);
  assert.deepEqual(pixelAt(decoded, 1, 0), [40, 50, 60, 255]);

  const up = Buffer.from([
    0, 1, 2, 3, 255, 4, 5, 6, 255,
    2, 0, 0, 0, 0, 3, 3, 3, 0,
  ]);
  const stacked = decodePng(rgbaPng(2, 2, up));
  assert.deepEqual(pixelAt(stacked, 0, 1), [1, 2, 3, 255]);
  assert.deepEqual(pixelAt(stacked, 1, 1), [7, 8, 9, 255]);

  const sample = encodeSideBySide(preview());
  const sixteen = Buffer.from(sample);
  sixteen[24] = 16;
  sixteen.writeUInt32BE(crc32(sixteen.subarray(12, 29)), 29);
  assert.throws(() => decodePng(sixteen), /16-bit/);

  const interlaced = Buffer.from(sample);
  interlaced[28] = 1;
  interlaced.writeUInt32BE(crc32(interlaced.subarray(12, 29)), 29);
  assert.throws(() => decodePng(interlaced), /interlac/);
});

test('columns wider than 480 scale down, and a wide noisy PNG retries at 240', () => {
  const wide = preview({ width: 600, headerH: 10, footerH: 4 });
  const scaled = decodePng(encodeSideBySide(wide));
  assert.equal(scaled.width, 480 + 8 + 480);
  assert.equal(scaled.height, 8 + 4 + 3);

  const data = new Uint8Array(360 * 120 * 4);
  let state = 0x6d2b79f5;
  for (let i = 0; i < 360 * 120; i += 1) {
    state = Math.imul(state ^ (state >>> 15), 0x2c1b3c6d) >>> 0;
    const band = (state >>> 8) & 15;
    data[i * 4] = band * 15;
    data[i * 4 + 1] = (band * 29) & 255;
    data[i * 4 + 2] = (band * 47) & 255;
    data[i * 4 + 3] = 255;
  }
  const speckled = { width: 360, height: 120, data };
  const noisy = {
    regions: [],
    chrome: { header: { left: speckled, right: speckled }, footer: { left: solid(0, 0, [0, 0, 0, 0]), right: solid(0, 0, [0, 0, 0, 0]) } },
    aligned: { left: solid(0, 0, [0, 0, 0, 0]), right: solid(0, 0, [0, 0, 0, 0]) },
  };
  const png = encodeSideBySide(noisy);
  assert.equal(decodePng(png).width, 240 + 8 + 240);
  assert.deepEqual(png, encodeSideBySide(noisy));
});

test('identical sections produce no regions', () => {
  const left = baseShot([{ id: 'hero', h: 12 }], [[30, 80, 40, 255]]);
  const right = baseShot([{ id: 'hero', h: 12 }], [[30, 80, 40, 255]]);
  const diff = diffPage(left, right);
  assert.deepEqual(diff.regions, []);
  assert.equal(diff.chrome.header.left.hash, diff.chrome.header.right.hash);
  assert.equal(diff.chrome.header.left.empty, false);
  const preview = decodePng(encodeSideBySide(diff));
  assert.equal(preview.width, 16 + 8 + 16);
  assert.equal(preview.height, 7 + 4 + 3);
});

test('a rectangle past the slop is one region, and slop or a short run is none', () => {
  const section = [{ className: 'section quote', h: 12 }];
  const color = [[0, 100, 0, 255]];
  const changed = cloneShot(baseShot(section, color));
  setRect(changed, 0, 4, 2, 8, 2, [0, 117, 0, 255]);
  const diff = diffPage(baseShot(section, color), changed);
  assert.deepEqual(diff.regions, [{ block: 'quote', kind: 'inner', x: 4, y: 2, w: 8, h: 2 }]);

  const within = cloneShot(baseShot(section, color));
  setRect(within, 0, 4, 2, 8, 2, [0, 116, 0, 255]);
  assert.deepEqual(diffPage(baseShot(section, color), within).regions, []);

  const short = cloneShot(baseShot(section, color));
  setRect(short, 0, 4, 2, 8, 1, [0, 200, 0, 255]);
  assert.deepEqual(diffPage(baseShot(section, color), short).regions, []);

  const sparse = cloneShot(baseShot(section, color));
  setRect(sparse, 0, 0, 2, 7, 2, [0, 200, 0, 255]);
  assert.deepEqual(diffPage(baseShot(section, color), sparse).regions, []);

  const wide = (changed) => {
    const page = shot({
      width: 5000,
      headerH: 0,
      headerColor: [0, 0, 0, 255],
      sections: [{ id: 'wide', h: 4 }],
      sectionColors: [[10, 10, 10, 255]],
      footerH: 0,
      footerColor: [0, 0, 0, 255],
    });
    if (changed) setRect(page, 0, 0, 1, changed, 2, [255, 10, 10, 255]);
    return page;
  };
  assert.deepEqual(diffPage(wide(0), wide(9)).regions, []);
  assert.equal(diffPage(wide(0), wide(10)).regions.length, 1);
});

test('a taller header does not mark a matching section, and section pairs align on their own', () => {
  const body = {
    sections: [{ id: 'hero', h: 10 }],
    sectionColors: [[30, 80, 40, 255]],
    footerH: 4,
    footerColor: [50, 50, 50, 255],
    width: 16,
    headerColor: [20, 20, 20, 255],
  };
  const diff = diffPage(
    shot({ ...body, headerH: 18 }),
    shot({ ...body, headerH: 6 }),
  );
  assert.deepEqual(diff.regions, []);
  assert.equal(diff.chrome.header.left.h, 18);
  assert.equal(diff.chrome.header.right.h, 6);

  const left = shot({
    width: 16,
    headerH: 4,
    headerColor: [1, 1, 1, 255],
    sections: [{ className: 'section alpha', h: 10 }, { className: 'section beta', h: 12 }],
    sectionColors: [[20, 20, 20, 255], [30, 30, 30, 255]],
    footerH: 2,
    footerColor: [4, 4, 4, 255],
  });
  const right = shot({
    width: 16,
    headerH: 4,
    headerColor: [1, 1, 1, 255],
    sections: [{ className: 'section alpha', h: 16 }, { className: 'section beta', h: 12 }],
    sectionColors: [[20, 20, 20, 255], [30, 30, 30, 255]],
    footerH: 2,
    footerColor: [4, 4, 4, 255],
  });
  assert.deepEqual(diffPage(left, right).regions, [
    { block: 'alpha', kind: 'height', x: 0, y: 0, w: 16, h: 16 },
  ]);

  const missingLeft = baseShot([{ id: 'a', h: 10 }, { id: 'b', h: 8 }], [[9, 9, 9, 255], [8, 8, 8, 255]]);
  const missingRight = baseShot([{ id: 'a', h: 10 }], [[9, 9, 9, 255]]);
  assert.deepEqual(diffPage(missingLeft, missingRight).regions, [
    { block: 'b', kind: 'missing', x: 0, y: 10, w: 16, h: 8 },
  ]);
});

test('chrome strip hashes match within slop and differ above it', () => {
  const page = (headerColor, headerH = 4) => shot({
    width: 8,
    headerH,
    headerColor,
    sections: [{ id: 'hero', h: 8 }],
    sectionColors: [[40, 40, 40, 255]],
    footerH: 2,
    footerColor: [50, 50, 50, 255],
  });
  const within = diffPage(page([0, 0, 0, 255]), page([16, 16, 16, 255]));
  assert.equal(within.chrome.header.left.hash, within.chrome.header.right.hash);
  const over = diffPage(page([0, 0, 0, 255]), page([17, 17, 17, 255]));
  assert.notEqual(over.chrome.header.left.hash, over.chrome.header.right.hash);
  const empty = diffPage(page([0, 0, 0, 255], 0), page([9, 9, 9, 255], 0));
  assert.equal(empty.chrome.header.left.empty, true);
  assert.equal(empty.chrome.header.right.empty, true);
  assert.equal(empty.chrome.header.left.hash, empty.chrome.header.right.hash);
});

test('commit writes a content-addressed tree and a second image replaces it', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'parity-publish-'));
  try {
    const firstPng = encodeSideBySide(preview());
    const firstName = imageName(firstPng);
    await commit(dir, [fact(firstName, 'one')], reportOf('todo'), { [firstName]: firstPng });
    const reportText = readFileSync(join(dir, 'report.json'), 'utf8');
    const factsText = readFileSync(join(dir, 'facts.jsonl'), 'utf8');
    assert.equal(reportText.endsWith('\n'), true);
    assert.equal(factsText.endsWith('\n'), true);
    const report = JSON.parse(reportText);
    assertSorted(report);
    assertSorted(JSON.parse(factsText));
    assert.equal(report.factsHash, createHash('sha256').update(factsText).digest('hex'));
    assert.equal(report.complete, true);
    assert.equal(readReport(dir).factsHash, report.factsHash);
    assert.deepEqual(readFileSync(join(dir, firstName)), firstPng);
    assert.equal(existsSync(join(dir, '.run.lock')), false);
    assert.equal(existsSync(join(dir, '.next')), false);

    const secondPng = encodeSideBySide(preview({ leftHeader: [3, 3, 3, 255] }));
    const secondName = imageName(secondPng);
    assert.notEqual(secondName, firstName);
    await commit(dir, [fact(secondName, 'two')], reportOf('done'), { [secondName]: secondPng });
    const replaced = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8'));
    assert.equal(replaced.t27, 'done');
    assert.equal(existsSync(join(dir, firstName)), false);
    assert.deepEqual(readFileSync(join(dir, secondName)), secondPng);
    const ledger = readFileSync(join(dir, 'facts.jsonl'));
    assert.equal(replaced.factsHash, createHash('sha256').update(ledger).digest('hex'));
    assert.equal(ledger.includes(secondName), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a tree over the budget does not replace the report or the ledger', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'parity-publish-'));
  try {
    const png = encodeSideBySide(preview());
    const name = imageName(png);
    await commit(dir, [fact(name, 'kept')], reportOf('todo'), { [name]: png });
    const reportBefore = readFileSync(join(dir, 'report.json'));
    const factsBefore = readFileSync(join(dir, 'facts.jsonl'));
    const imageBefore = readFileSync(join(dir, name));

    const big = Buffer.alloc(BUDGET + 100_000, 5);
    const bigName = imageName(big);
    await assert.rejects(
      () => commit(dir, [fact(bigName, 'replaced')], reportOf('done'), { [bigName]: big }),
      /reason budget/,
    );
    assert.deepEqual(readFileSync(join(dir, 'report.json')), reportBefore);
    assert.deepEqual(readFileSync(join(dir, 'facts.jsonl')), factsBefore);
    assert.deepEqual(readFileSync(join(dir, name)), imageBefore);
    assert.equal(existsSync(join(dir, bigName)), false);
    assert.equal(existsSync(join(dir, '.next')), false);
    assert.equal(factsBefore.includes(name), true);
    assert.equal(factsBefore.includes(Buffer.from(bigName)), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a live lock is reason lock and a dead lock is cleared', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'parity-publish-'));
  try {
    const png = encodeSideBySide(preview());
    const name = imageName(png);
    await commit(dir, [fact(name, 'lock')], reportOf('todo'), { [name]: png });
    const before = readFileSync(join(dir, 'report.json'));
    writeFileSync(join(dir, '.run.lock'), `${process.pid}\n`);
    await assert.rejects(
      () => commit(dir, [fact(name, 'lock')], reportOf('done'), { [name]: png }),
      /reason lock/,
    );
    assert.deepEqual(readFileSync(join(dir, 'report.json')), before);
    assert.equal(readFileSync(join(dir, '.run.lock'), 'utf8'), `${process.pid}\n`);

    writeFileSync(join(dir, '.run.lock'), '2147483647\n');
    await commit(dir, [fact(name, 'lock')], reportOf('todo'), { [name]: png });
    assert.equal(existsSync(join(dir, '.run.lock')), false);
    assert.equal(JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8')).t27, 'todo');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
