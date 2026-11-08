import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import {
  closeSync,
  copyFileSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { deflateSync, inflateSync } from 'node:zlib';

// A channel delta at or below this value is equal. report.json copies it as channelSlop.
export const CHANNEL_SLOP = 16;

// Side-by-side previews for every keep URL exceed 8 MiB. Full-page PNGs stay out of this tree.
export const BUDGET = 67108864;

const SNAP = CHANNEL_SLOP + 1;
const COLUMN_CAP = 480;
const COLUMN_RETRY = 240;
const HEADER_CAP = 64;
const FOOTER_CAP = 64;
const MAIN_CAP = 960;
const GUTTER = 8;
const EMPTY_BAND = 4;
const PREVIEW_CAP = 8192;
const PALETTE = 16;
const GUTTER_RGBA = [212, 212, 212, 255];
const BAND_RGBA = [212, 212, 212, 255];
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

const EMPTY_HASH = createHash('sha256').update('empty').digest('hex');

function fail(reason) {
  const error = new Error(`reason ${reason}`);
  error.reason = reason;
  return error;
}

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

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter(raw, height, rowBytes, bpp) {
  const expected = height * (rowBytes + 1);
  if (raw.length < expected) throw new Error('png size');
  const out = Buffer.alloc(height * rowBytes);
  let prev = Buffer.alloc(rowBytes);
  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[offset];
    offset += 1;
    const row = raw.subarray(offset, offset + rowBytes);
    offset += rowBytes;
    const cur = out.subarray(y * rowBytes, (y + 1) * rowBytes);
    if (filter > 4) throw new Error(`png filter ${filter}`);
    for (let i = 0; i < rowBytes; i += 1) {
      const left = i >= bpp ? cur[i - bpp] : 0;
      const up = prev[i];
      const ul = i >= bpp ? prev[i - bpp] : 0;
      let value = row[i];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) value += paeth(left, up, ul);
      cur[i] = value & 255;
    }
    prev = Buffer.from(cur);
  }
  return out;
}

function samplesToRgba(samples, width, height, colorType, palette) {
  const data = new Uint8Array(width * height * 4);
  let src = 0;
  for (let i = 0; i < width * height; i += 1) {
    const dst = i * 4;
    if (colorType === 0) {
      data[dst] = samples[src];
      data[dst + 1] = samples[src];
      data[dst + 2] = samples[src];
      data[dst + 3] = 255;
      src += 1;
    } else if (colorType === 2) {
      data[dst] = samples[src];
      data[dst + 1] = samples[src + 1];
      data[dst + 2] = samples[src + 2];
      data[dst + 3] = 255;
      src += 3;
    } else if (colorType === 4) {
      data[dst] = samples[src];
      data[dst + 1] = samples[src];
      data[dst + 2] = samples[src];
      data[dst + 3] = samples[src + 1];
      src += 2;
    } else if (colorType === 6) {
      data[dst] = samples[src];
      data[dst + 1] = samples[src + 1];
      data[dst + 2] = samples[src + 2];
      data[dst + 3] = samples[src + 3];
      src += 4;
    } else if (colorType === 3) {
      const color = palette[samples[src]];
      if (!color) throw new Error('png palette');
      data[dst] = color[0];
      data[dst + 1] = color[1];
      data[dst + 2] = color[2];
      data[dst + 3] = 255;
      src += 1;
    } else {
      throw new Error(`png color ${colorType}`);
    }
  }
  return data;
}

export function decodePng(buf) {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('png signature');
  let ihdr = null;
  let palette = null;
  const idat = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    if (offset + 12 + length > bytes.length) throw new Error('png truncated');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    const expected = bytes.readUInt32BE(offset + 8 + length);
    const actual = crc32(bytes.subarray(offset + 4, offset + 8 + length));
    if (expected !== actual) throw new Error('png crc');
    if (type === 'IHDR') ihdr = Buffer.from(data);
    else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    else if (type[0] >= 'A' && type[0] <= 'Z') throw new Error(`png chunk ${type}`);
    offset += 12 + length;
  }
  if (!ihdr || ihdr.length < 13) throw new Error('png ihdr');
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];
  const interlace = ihdr[12];
  if (bitDepth === 16) throw new Error('png 16-bit');
  if (interlace !== 0) throw new Error('png interlacing');
  if (bitDepth !== 8) throw new Error('png bit depth');
  if (![0, 2, 3, 4, 6].includes(colorType)) throw new Error(`png color ${colorType}`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  const rowBytes = width * channels;
  const bpp = channels;
  let colors = null;
  if (colorType === 3) {
    if (!palette || palette.length < 3 || palette.length % 3 !== 0) throw new Error('png palette');
    colors = [];
    for (let i = 0; i < palette.length; i += 3) colors.push([palette[i], palette[i + 1], palette[i + 2]]);
  }
  const inflated = inflateSync(Buffer.concat(idat));
  const samples = unfilter(inflated, height, rowBytes, bpp);
  return { width, height, data: samplesToRgba(samples, width, height, colorType, colors) };
}

function opaqueRgba(rgba) {
  const out = new Uint8Array(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    const cover = rgba[i + 3] / 255;
    out[i] = Math.round(rgba[i] * cover + 255 * (1 - cover));
    out[i + 1] = Math.round(rgba[i + 1] * cover + 255 * (1 - cover));
    out[i + 2] = Math.round(rgba[i + 2] * cover + 255 * (1 - cover));
    out[i + 3] = 255;
  }
  return out;
}

function boxStats(colors) {
  let r0 = 255;
  let r1 = 0;
  let g0 = 255;
  let g1 = 0;
  let b0 = 255;
  let b1 = 0;
  for (const color of colors) {
    if (color.r < r0) r0 = color.r;
    if (color.r > r1) r1 = color.r;
    if (color.g < g0) g0 = color.g;
    if (color.g > g1) g1 = color.g;
    if (color.b < b0) b0 = color.b;
    if (color.b > b1) b1 = color.b;
  }
  const ranges = { r: r1 - r0, g: g1 - g0, b: b1 - b0 };
  let channel = 'r';
  if (ranges.g > ranges[channel]) channel = 'g';
  if (ranges.b > ranges[channel]) channel = 'b';
  return { range: ranges[channel], channel };
}

function splitBox(colors) {
  const { channel } = boxStats(colors);
  const sorted = colors.slice().sort((p, q) => p[channel] - q[channel] || p.r - q.r || p.g - q.g || p.b - q.b);
  let total = 0;
  for (const color of sorted) total += color.n;
  let running = 0;
  let index = 0;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    running += sorted[i].n;
    index = i;
    if (running * 2 >= total) break;
  }
  const cut = index + 1;
  return [sorted.slice(0, cut), sorted.slice(cut)];
}

function paletteOf(rgba) {
  const counts = new Map();
  for (let i = 0; i < rgba.length; i += 4) {
    const key = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const colors = [];
  for (const [key, n] of counts) {
    colors.push({ r: (key >>> 16) & 255, g: (key >>> 8) & 255, b: key & 255, n });
  }
  colors.sort((p, q) => p.r - q.r || p.g - q.g || p.b - q.b);
  if (colors.length <= PALETTE) return colors.map(color => [color.r, color.g, color.b]);
  let boxes = [colors];
  while (boxes.length < PALETTE) {
    let pick = -1;
    let range = -1;
    for (let i = 0; i < boxes.length; i += 1) {
      if (boxes[i].length < 2) continue;
      const stats = boxStats(boxes[i]);
      if (stats.range > range) {
        range = stats.range;
        pick = i;
      }
    }
    if (pick < 0) break;
    const [left, right] = splitBox(boxes[pick]);
    boxes.splice(pick, 1, left, right);
  }
  return boxes.map(box => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (const color of box) {
      r += color.r * color.n;
      g += color.g * color.n;
      b += color.b * color.n;
      n += color.n;
    }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

function nearestIndex(palette, r, g, b) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < palette.length; i += 1) {
    const dr = palette[i][0] - r;
    const dg = palette[i][1] - g;
    const db = palette[i][2] - b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function encodeIndexed(width, height, rgba) {
  const opaque = opaqueRgba(rgba);
  const palette = paletteOf(opaque);
  const exact = new Map();
  palette.forEach((color, index) => exact.set((color[0] << 16) | (color[1] << 8) | color[2], index));
  const raw = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y += 1) {
    const row = y * (width + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const key = (opaque[i] << 16) | (opaque[i + 1] << 8) | opaque[i + 2];
      raw[row + 1 + x] = exact.get(key) ?? nearestIndex(palette, opaque[i], opaque[i + 1], opaque[i + 2]);
    }
  }
  const plte = Buffer.alloc(palette.length * 3);
  palette.forEach((color, index) => {
    plte[index * 3] = color[0];
    plte[index * 3 + 1] = color[1];
    plte[index * 3 + 2] = color[2];
  });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 3;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('PLTE', plte),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function requireBitmap(bitmap, label) {
  if (!bitmap || !Number.isInteger(bitmap.width) || !Number.isInteger(bitmap.height)) throw new Error(`${label} bitmap`);
  if (bitmap.width < 0 || bitmap.height < 0) throw new Error(`${label} bitmap`);
  if (!bitmap.data || bitmap.data.length !== bitmap.width * bitmap.height * 4) throw new Error(`${label} bitmap`);
  return bitmap;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function crop(bitmap, box) {
  const x0 = clamp(Math.round(box.x), 0, bitmap.width);
  const y0 = clamp(Math.round(box.y), 0, bitmap.height);
  const x1 = clamp(Math.round(box.x + box.w), 0, bitmap.width);
  const y1 = clamp(Math.round(box.y + box.h), 0, bitmap.height);
  const width = Math.max(0, x1 - x0);
  const height = Math.max(0, y1 - y0);
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const src = ((y0 + y) * bitmap.width + x0) * 4;
    data.set(bitmap.data.subarray(src, src + width * 4), y * width * 4);
  }
  return { width, height, data };
}

function normalizeBox(box) {
  if (!box) return { x: 0, y: 0, w: 0, h: 0, empty: true };
  for (const key of ['x', 'y', 'w', 'h']) {
    if (typeof box[key] !== 'number' || !Number.isFinite(box[key])) throw new Error('box');
  }
  return { x: box.x, y: box.y, w: box.w, h: box.h, empty: box.empty === true };
}

function blockName(section) {
  if (typeof section.id === 'string' && section.id !== '') return section.id;
  const raw = section.className ?? section.class ?? '';
  const names = String(raw).split(/\s+/).filter(token => token && token !== 'section');
  return names[0] || 'section';
}

// A bucket of slop + 1 cannot hide a channel delta above CHANNEL_SLOP.
function hashStrip(bitmap) {
  const snapped = Buffer.alloc(bitmap.data.length);
  for (let i = 0; i < bitmap.data.length; i += 1) snapped[i] = Math.floor(bitmap.data[i] / SNAP) * SNAP;
  const head = Buffer.alloc(8);
  head.writeUInt32BE(bitmap.width, 0);
  head.writeUInt32BE(bitmap.height, 4);
  return createHash('sha256').update(head).update(snapped).digest('hex');
}

function readStrip(page, box) {
  const spec = normalizeBox(box);
  const bitmap = crop(page, spec);
  const empty = spec.empty || bitmap.width === 0 || bitmap.height === 0;
  return {
    h: spec.empty ? Math.max(0, Math.round(spec.h)) : bitmap.height,
    empty,
    hash: empty ? EMPTY_HASH : hashStrip(bitmap),
    width: bitmap.width,
    height: bitmap.height,
    data: bitmap.data,
  };
}

function channelExceeds(left, li, right, ri) {
  return Math.abs(left[li] - right[ri]) > CHANNEL_SLOP
    || Math.abs(left[li + 1] - right[ri + 1]) > CHANNEL_SLOP
    || Math.abs(left[li + 2] - right[ri + 2]) > CHANNEL_SLOP
    || Math.abs(left[li + 3] - right[ri + 3]) > CHANNEL_SLOP;
}

function diffOverlap(left, right, originY, block, regions) {
  const width = Math.min(left.width, right.width);
  const height = Math.min(left.height, right.height);
  if (width === 0 || height === 0) return;
  const rowGate = Math.max(8, width * 0.002);
  const runs = [];
  for (let y = 0; y < height; y += 1) {
    let count = 0;
    let minX = width;
    let maxX = -1;
    const leftRow = y * left.width * 4;
    const rightRow = y * right.width * 4;
    for (let x = 0; x < width; x += 1) {
      if (!channelExceeds(left.data, leftRow + x * 4, right.data, rightRow + x * 4)) continue;
      count += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    if (count >= rowGate) runs.push({ y, minX, maxX });
  }
  let start = 0;
  while (start < runs.length) {
    let end = start;
    while (end + 1 < runs.length && runs[end + 1].y === runs[end].y + 1) end += 1;
    const heightPx = end - start + 1;
    if (heightPx >= 2) {
      let minX = runs[start].minX;
      let maxX = runs[start].maxX;
      for (let i = start + 1; i <= end; i += 1) {
        if (runs[i].minX < minX) minX = runs[i].minX;
        if (runs[i].maxX > maxX) maxX = runs[i].maxX;
      }
      regions.push({
        block,
        kind: 'inner',
        x: minX,
        y: originY + runs[start].y,
        w: maxX - minX + 1,
        h: heightPx,
      });
    }
    start = end + 1;
  }
}

function pairSections(left, right) {
  const used = new Set();
  const pairs = [];
  const leftOpen = [];
  for (let i = 0; i < left.length; i += 1) {
    const id = left[i].id || '';
    if (!id) {
      leftOpen.push(i);
      continue;
    }
    let match = -1;
    for (let j = 0; j < right.length; j += 1) {
      if (used.has(j) || (right[j].id || '') !== id) continue;
      match = j;
      break;
    }
    if (match === -1) leftOpen.push(i);
    else {
      used.add(match);
      pairs.push({ left: i, right: match });
    }
  }
  const rightOpen = [];
  for (let j = 0; j < right.length; j += 1) if (!used.has(j)) rightOpen.push(j);
  const shared = Math.min(leftOpen.length, rightOpen.length);
  for (let k = 0; k < shared; k += 1) pairs.push({ left: leftOpen[k], right: rightOpen[k] });
  const missing = [];
  for (let k = shared; k < leftOpen.length; k += 1) missing.push({ side: 'left', index: leftOpen[k] });
  for (let k = shared; k < rightOpen.length; k += 1) missing.push({ side: 'right', index: rightOpen[k] });
  const slots = [
    ...pairs.map(pair => ({ type: 'pair', pair })),
    ...missing.filter(item => item.side === 'left').map(item => ({ type: 'missing', side: 'left', index: item.index })),
  ].sort((a, b) => (a.pair ? a.pair.left : a.index) - (b.pair ? b.pair.left : b.index));
  for (const item of missing) {
    if (item.side !== 'right') continue;
    const at = slots.findIndex(slot => slot.type === 'pair' && slot.pair.right > item.index);
    const entry = { type: 'missing', side: 'right', index: item.index };
    if (at === -1) slots.push(entry);
    else slots.splice(at, 0, entry);
  }
  return slots;
}

function blank(width, height) {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

function blit(dst, src, x, y) {
  if (!src || src.width === 0 || src.height === 0 || x >= dst.width || y >= dst.height) return;
  const copyW = Math.min(src.width, dst.width - x);
  const copyH = Math.min(src.height, dst.height - y);
  for (let row = 0; row < copyH; row += 1) {
    const srcStart = row * src.width * 4;
    const dstStart = ((y + row) * dst.width + x) * 4;
    dst.data.set(src.data.subarray(srcStart, srcStart + copyW * 4), dstStart);
  }
}

export function diffPage(leftShot, rightShot) {
  const leftPage = requireBitmap(leftShot, 'left');
  const rightPage = requireBitmap(rightShot, 'right');
  if (!Array.isArray(leftShot.sections) || !Array.isArray(rightShot.sections)) throw new Error('sections');
  const header = { left: readStrip(leftPage, leftShot.header), right: readStrip(rightPage, rightShot.header) };
  const footer = { left: readStrip(leftPage, leftShot.footer), right: readStrip(rightPage, rightShot.footer) };
  const slots = pairSections(leftShot.sections, rightShot.sections);
  const regions = [];
  const placed = [];
  let y = 0;
  for (const slot of slots) {
    if (slot.type === 'pair') {
      const leftSection = leftShot.sections[slot.pair.left];
      const rightSection = rightShot.sections[slot.pair.right];
      const left = crop(leftPage, leftSection);
      const right = crop(rightPage, rightSection);
      const height = Math.max(left.height, right.height);
      const block = blockName(leftSection);
      diffOverlap(left, right, y, block, regions);
      if (left.height !== right.height && height > 0) {
        regions.push({
          block,
          kind: 'height',
          x: 0,
          y,
          w: Math.max(left.width, right.width),
          h: height,
        });
      }
      placed.push({ left, right, y, height });
      y += height;
    } else {
      const sections = slot.side === 'left' ? leftShot.sections : rightShot.sections;
      const page = slot.side === 'left' ? leftPage : rightPage;
      const section = sections[slot.index];
      const bitmap = crop(page, section);
      if (bitmap.width > 0 && bitmap.height > 0) {
        regions.push({
          block: blockName(section),
          kind: 'missing',
          x: 0,
          y,
          w: bitmap.width,
          h: bitmap.height,
        });
      }
      placed.push({
        left: slot.side === 'left' ? bitmap : blank(bitmap.width, bitmap.height),
        right: slot.side === 'right' ? bitmap : blank(bitmap.width, bitmap.height),
        y,
        height: bitmap.height,
      });
      y += bitmap.height;
    }
  }
  let leftWidth = 0;
  let rightWidth = 0;
  for (const slot of placed) {
    if (slot.left.width > leftWidth) leftWidth = slot.left.width;
    if (slot.right.width > rightWidth) rightWidth = slot.right.width;
  }
  const left = blank(leftWidth, y);
  const right = blank(rightWidth, y);
  for (const slot of placed) {
    blit(left, slot.left, 0, slot.y);
    blit(right, slot.right, 0, slot.y);
  }
  return {
    regions,
    chrome: { header, footer },
    aligned: { left, right },
  };
}

function asBitmap(value) {
  if (!value || value.width === 0 || value.height === 0) return { width: 0, height: 0, data: new Uint8Array(0) };
  return requireBitmap(value, 'preview');
}

function scaleNearest(src, outW, outH) {
  if (src.width === outW && src.height === outH) return src;
  if (outW === 0 || outH === 0) return { width: outW, height: outH, data: new Uint8Array(outW * outH * 4) };
  const data = new Uint8Array(outW * outH * 4);
  for (let y = 0; y < outH; y += 1) {
    const sy = Math.floor(y * src.height / outH);
    for (let x = 0; x < outW; x += 1) {
      const sx = Math.floor(x * src.width / outW);
      const si = (sy * src.width + sx) * 4;
      data.set(src.data.subarray(si, si + 4), (y * outW + x) * 4);
    }
  }
  return { width: outW, height: outH, data };
}

function fitPage(src, colW, natural) {
  if (!src || src.width === 0 || src.height === 0) return { width: 0, height: 0, data: new Uint8Array(0) };
  const outW = Math.max(1, Math.round(src.width * colW / natural));
  const outH = Math.max(1, Math.round(src.height * colW / natural));
  return scaleNearest(src, outW, outH);
}

function capHeight(src, maxH) {
  if (src.height <= maxH) return src;
  return scaleNearest(src, src.width, maxH);
}

function regionStrips(aligned, regions, colW, natural) {
  if (regions.length === 0) return [];
  if (aligned.width === 0 || aligned.height === 0) {
    return regions.map(region => {
      const height = Math.max(1, Math.round(region.h * colW / natural));
      const width = Math.max(1, Math.min(colW, Math.round(region.w * colW / natural)));
      return { width, height, data: new Uint8Array(width * height * 4) };
    });
  }
  const scaled = fitPage(aligned, colW, natural);
  const sx = scaled.width / aligned.width;
  const sy = scaled.height / aligned.height;
  return regions.map(region => {
    const box = {
      x: Math.floor(region.x * sx),
      y: Math.floor(region.y * sy),
      w: Math.max(1, Math.round(region.w * sx)),
      h: Math.max(1, Math.round(region.h * sy)),
    };
    const bitmap = crop(scaled, box);
    if (bitmap.width === 0 || bitmap.height === 0) {
      return { width: 1, height: Math.max(1, box.h), data: new Uint8Array(Math.max(1, box.h) * 4) };
    }
    return bitmap;
  });
}

function fitStack(strips) {
  let sum = 0;
  for (const strip of strips) sum += strip.height;
  if (sum <= MAIN_CAP) return strips;
  const factor = MAIN_CAP / sum;
  const fitted = strips.map(strip => {
    const height = Math.max(1, Math.round(strip.height * factor));
    return height === strip.height ? strip : scaleNearest(strip, strip.width, height);
  });
  let overflow = -MAIN_CAP;
  for (const strip of fitted) overflow += strip.height;
  if (overflow <= 0) return fitted;
  return fitted.map(strip => {
    if (overflow <= 0 || strip.height <= 1) return strip;
    const cut = Math.min(overflow, strip.height - 1);
    overflow -= cut;
    return scaleNearest(strip, strip.width, strip.height - cut);
  });
}

function columnWidth(parts, cap) {
  let natural = 0;
  for (const part of parts) if (part && part.width > natural) natural = part.width;
  if (natural === 0) natural = 1;
  return { natural, colW: Math.min(cap, natural) };
}

function paint(dst, src, x, y) {
  if (!src || src.height === 0 || src.width === 0) return;
  blit(dst, src, x, y);
}

function compose(input, cap) {
  const headerL = asBitmap(input.chrome.header.left);
  const headerR = asBitmap(input.chrome.header.right);
  const footerL = asBitmap(input.chrome.footer.left);
  const footerR = asBitmap(input.chrome.footer.right);
  const alignedL = asBitmap(input.aligned.left);
  const alignedR = asBitmap(input.aligned.right);
  const regions = input.regions ?? [];
  const leftCol = columnWidth([headerL, footerL, alignedL], cap);
  const rightCol = columnWidth([headerR, footerR, alignedR], cap);
  const headerLeft = capHeight(fitPage(headerL, leftCol.colW, leftCol.natural), HEADER_CAP);
  const headerRight = capHeight(fitPage(headerR, rightCol.colW, rightCol.natural), HEADER_CAP);
  const footerLeft = capHeight(fitPage(footerL, leftCol.colW, leftCol.natural), FOOTER_CAP);
  const footerRight = capHeight(fitPage(footerR, rightCol.colW, rightCol.natural), FOOTER_CAP);
  const mainLeft = regions.length === 0 ? null : fitStack(regionStrips(alignedL, regions, leftCol.colW, leftCol.natural));
  const mainRight = regions.length === 0 ? null : fitStack(regionStrips(alignedR, regions, rightCol.colW, rightCol.natural));
  const headerH = Math.max(headerLeft.height, headerRight.height);
  const footerH = Math.max(footerLeft.height, footerRight.height);
  let mainH = EMPTY_BAND;
  const rows = [];
  if (mainLeft && mainRight) {
    mainH = 0;
    const count = Math.max(mainLeft.length, mainRight.length);
    for (let i = 0; i < count; i += 1) {
      const left = mainLeft[i] ?? { width: 0, height: 0, data: new Uint8Array(0) };
      const right = mainRight[i] ?? { width: 0, height: 0, data: new Uint8Array(0) };
      const height = Math.max(left.height, right.height);
      rows.push({ left, right, y: mainH, height });
      mainH += height;
    }
    if (mainH === 0) mainH = EMPTY_BAND;
  }
  const width = leftCol.colW + GUTTER + rightCol.colW;
  const height = headerH + mainH + footerH;
  const data = new Uint8Array(width * height * 4);
  data.fill(255);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < GUTTER; x += 1) {
      const i = (y * width + leftCol.colW + x) * 4;
      data[i] = GUTTER_RGBA[0];
      data[i + 1] = GUTTER_RGBA[1];
      data[i + 2] = GUTTER_RGBA[2];
      data[i + 3] = GUTTER_RGBA[3];
    }
  }
  const canvas = { width, height, data };
  paint(canvas, headerLeft, 0, 0);
  paint(canvas, headerRight, leftCol.colW + GUTTER, 0);
  if (!rows.length) {
    for (let y = 0; y < EMPTY_BAND; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = ((headerH + y) * width + x) * 4;
        data[i] = BAND_RGBA[0];
        data[i + 1] = BAND_RGBA[1];
        data[i + 2] = BAND_RGBA[2];
        data[i + 3] = BAND_RGBA[3];
      }
    }
  } else {
    for (const row of rows) {
      paint(canvas, row.left, 0, headerH + row.y);
      paint(canvas, row.right, leftCol.colW + GUTTER, headerH + row.y);
    }
  }
  paint(canvas, footerLeft, 0, headerH + mainH);
  paint(canvas, footerRight, leftCol.colW + GUTTER, headerH + mainH);
  return canvas;
}

export function encodeSideBySide(input) {
  if (!input || !input.chrome || !input.aligned) throw new Error('preview');
  const first = compose(input, COLUMN_CAP);
  const png = encodeIndexed(first.width, first.height, first.data);
  if (png.length <= PREVIEW_CAP) return png;
  const retry = compose(input, COLUMN_RETRY);
  return encodeIndexed(retry.width, retry.height, retry.data);
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object' || Buffer.isBuffer(value)) return value;
  const out = {};
  for (const key of Object.keys(value).sort()) out[key] = sortKeys(value[key]);
  return out;
}

function ledgerBytes(facts) {
  let text = '';
  for (const fact of facts) text += `${JSON.stringify(sortKeys(fact))}\n`;
  return Buffer.from(text);
}

function reportBody(report, ledger) {
  const factsHash = createHash('sha256').update(ledger).digest('hex');
  return Buffer.from(`${JSON.stringify(sortKeys({ ...report, factsHash }))}\n`);
}

function contentBase(bytes) {
  return `${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}.png`;
}

function imageBase(name) {
  const base = String(name).slice(String(name).lastIndexOf('/') + 1);
  if (!/^[0-9a-f]{16}\.png$/.test(base)) throw new Error(`image name ${name}`);
  return base;
}

function outsideRepo(name) {
  return name.startsWith('/');
}

function stagedImage(nextDir, name) {
  if (outsideRepo(name)) return join(nextDir, 'abs', imageBase(name));
  return join(nextDir, name);
}

function collectNames(value, names) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectNames(item, names);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'sbs' && typeof child === 'string') names.add(child);
    else if (key === 'sbs' && Array.isArray(child)) {
      for (const item of child) if (typeof item === 'string') names.add(item);
    } else collectNames(child, names);
  }
}

function resolveImages(facts, report, images) {
  const names = new Set();
  collectNames(facts, names);
  collectNames(report, names);
  const provided = new Map();
  if (images instanceof Map) {
    for (const [key, value] of images) provided.set(key, Buffer.isBuffer(value) ? value : Buffer.from(value));
  } else if (images) {
    for (const [key, value] of Object.entries(images)) {
      provided.set(key, Buffer.isBuffer(value) ? value : Buffer.from(value));
    }
  }
  const resolved = new Map();
  for (const name of names) {
    const bytes = provided.get(name);
    if (!bytes) throw new Error(`missing image ${name}`);
    if (imageBase(name) !== contentBase(bytes)) throw new Error(`image name ${name}`);
    resolved.set(name, bytes);
  }
  return resolved;
}

function treeBytes(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) total += treeBytes(full);
    else if (entry.isFile()) total += statSync(full).size;
  }
  return total;
}

function deleteUnnamed(outDir, named) {
  const imgDir = join(outDir, 'img');
  let names = [];
  try {
    names = readdirSync(imgDir);
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error;
  }
  for (const name of names) {
    if (!named.has(`img/${name}`)) unlinkSync(join(imgDir, name));
  }
  for (const entry of readdirSync(outDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (entry.name === 'report.json' || entry.name === 'facts.jsonl' || entry.name === '.run.lock') continue;
    if (entry.name.endsWith('.jsonl')) unlinkSync(join(outDir, entry.name));
  }
}

function stage(outDir, facts, report, images) {
  if (!Array.isArray(facts)) throw new Error('facts');
  if (!report || report.complete !== true) throw new Error('report is not complete');
  const nextDir = join(outDir, '.next');
  rmSync(nextDir, { recursive: true, force: true });
  const named = resolveImages(facts, report, images);
  const ledger = ledgerBytes(facts);
  const body = reportBody(report, ledger);
  try {
    for (const [name, bytes] of named) {
      const file = stagedImage(nextDir, name);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, bytes);
    }
    writeFileSync(join(nextDir, 'facts.jsonl'), ledger);
    writeFileSync(join(nextDir, 'report.json'), body);
    if (treeBytes(nextDir) > BUDGET) throw fail('budget');
    const relative = new Set();
    for (const name of named.keys()) {
      const from = stagedImage(nextDir, name);
      if (outsideRepo(name)) {
        mkdirSync(dirname(name), { recursive: true });
        copyFileSync(from, name);
      } else {
        const dest = join(outDir, name);
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(from, dest);
        relative.add(name);
      }
    }
    // The published report is the commit point. The previous facts.jsonl stays until this rename lands.
    renameSync(join(nextDir, 'report.json'), join(outDir, 'report.json'));
    renameSync(join(nextDir, 'facts.jsonl'), join(outDir, 'facts.jsonl'));
    deleteUnnamed(outDir, new Set(named.keys()));
  } catch (error) {
    rmSync(nextDir, { recursive: true, force: true });
    throw error;
  }
  rmSync(nextDir, { recursive: true, force: true });
}

function pidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return Boolean(error && error.code === 'EPERM');
  }
}

function acquire(outDir) {
  mkdirSync(outDir, { recursive: true });
  const lockPath = join(outDir, '.run.lock');
  let text = null;
  try {
    text = readFileSync(lockPath, 'utf8');
  } catch (error) {
    if (!error || error.code !== 'ENOENT') throw error;
  }
  if (text != null) {
    if (pidAlive(Number.parseInt(text, 10))) throw fail('lock');
    unlinkSync(lockPath);
  }
  let fd;
  try {
    fd = openSync(lockPath, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o644);
  } catch (error) {
    if (error && error.code === 'EEXIST') throw fail('lock');
    throw error;
  }
  try {
    writeSync(fd, `${process.pid}\n`);
  } finally {
    closeSync(fd);
  }
  return () => {
    try {
      const current = readFileSync(lockPath, 'utf8');
      if (Number.parseInt(current, 10) === process.pid) unlinkSync(lockPath);
    } catch (error) {
      if (!error || error.code !== 'ENOENT') throw error;
    }
  };
}

export async function commit(outDir, facts, report, images) {
  if (typeof outDir !== 'string' || outDir === '') throw new Error('out');
  const release = acquire(outDir);
  try {
    stage(outDir, facts, report, images);
  } finally {
    release();
  }
}
