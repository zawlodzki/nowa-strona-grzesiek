#!/usr/bin/env node
// Rerunnable SEO crawler (Node >= 18, no dependencies).
// Usage: node crawl.mjs --origin https://www.zawlodzki.pl --out <dir> [--max 2000] [--no-html]
// Seeds from <origin>/sitemap.xml (and nested sitemap indexes) plus <origin>/, then follows internal links.
// Writes <out>/urls.csv, <out>/urls.json, <out>/jsonld/<slug>.json, <out>/html/<slug>.html.
// Run it against the old and the new origin, then diff with diff-crawls.mjs.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const ORIGIN = new URL(args.origin || 'https://www.zawlodzki.pl').origin;
const OUT = args.out || './crawl-out';
const MAX = Number(args.max || 2000);
const SAVE_HTML = !args['no-html'];
const UA = args.ua || 'Mozilla/5.0 (compatible; zawlodzki-migration-crawler/1.0)';
const CONCURRENCY = Number(args.concurrency || 4);

const ASSET_EXT = /\.(jpe?g|png|gif|webp|avif|svg|ico|pdf|zip|mp4|webm|mp3|css|js|json|xml|txt|woff2?|ttf|eot)$/i;

async function fetchChain(url, maxHops = 10) {
  const chain = [];
  let current = url;
  for (let i = 0; i < maxHops; i++) {
    let res;
    try {
      res = await fetch(current, { redirect: 'manual', headers: { 'user-agent': UA, accept: 'text/html,*/*' } });
    } catch (e) {
      return { chain, status: 0, finalUrl: current, error: String(e.cause?.code || e.message), res: null };
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      const next = new URL(res.headers.get('location'), current).href;
      chain.push(`${res.status} ${current}`);
      await res.arrayBuffer().catch(() => {});
      current = next;
      continue;
    }
    return { chain, status: res.status, finalUrl: current, res };
  }
  return { chain, status: -1, finalUrl: current, error: 'too many redirects', res: null };
}

function normalize(href, base) {
  let u;
  try { u = new URL(href, base); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  u.hash = '';
  return u;
}

const decode = (s) =>
  (s || '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, ' ').trim();

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return m ? decode(m[2] ?? m[3] ?? m[4]) : null;
}

function parse(html, pageUrl) {
  const head = html.match(/<head[\s\S]*?<\/head>/i)?.[0] || html;
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const meta = (key) => {
    const t = metas.find((m) => (attr(m, 'name') || attr(m, 'property') || '').toLowerCase() === key);
    return t ? attr(t, 'content') : null;
  };
  const social = {};
  for (const m of metas) {
    const k = (attr(m, 'property') || attr(m, 'name') || '').toLowerCase();
    if (k.startsWith('og:') || k.startsWith('twitter:') || k.startsWith('article:')) social[k] = attr(m, 'content');
  }
  const canonical = links.filter((l) => /rel\s*=\s*["']?canonical/i.test(l)).map((l) => attr(l, 'href'));
  const hreflang = links
    .filter((l) => /hreflang/i.test(l))
    .map((l) => `${attr(l, 'hreflang')}=${attr(l, 'href')}`);
  const jsonld = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    const raw = m[1].trim();
    try { return { raw, parsed: JSON.parse(raw) }; } catch (e) { return { raw, error: e.message }; }
  });
  const body = html.match(/<body[\s\S]*<\/body>/i)?.[0] || html;
  const text = decode(
    body.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' '),
  );
  const h1 = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')));
  const anchors = [...body.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], 'href')).filter(Boolean);
  const internal = new Set();
  const external = new Set();
  for (const a of anchors) {
    const u = normalize(a, pageUrl);
    if (!u) continue;
    const host = u.hostname.replace(/^www\./, '');
    if (host === new URL(ORIGIN).hostname.replace(/^www\./, '')) internal.add(u.href);
    else external.add(u.origin);
  }
  return {
    lang: attr(html.match(/<html\b[^>]*>/i)?.[0] || '', 'lang'),
    title: decode(head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),
    metaDescription: meta('description'),
    metaRobots: meta('robots'),
    canonical,
    hreflang,
    social,
    h1,
    wordCount: text ? text.split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0,
    internal: [...internal],
    externalHosts: [...external],
    jsonld,
  };
}

async function sitemapUrls(url, seen = new Set()) {
  if (seen.has(url)) return [];
  seen.add(url);
  const { res, status } = await fetchChain(url);
  if (!res || status !== 200) return [];
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => decode(m[1]));
  if (/<sitemapindex/i.test(xml)) {
    const nested = await Promise.all(locs.map((l) => sitemapUrls(l, seen)));
    return nested.flat();
  }
  return locs;
}

const slug = (u) => {
  const p = new URL(u);
  return (p.pathname.replace(/^\/|\/$/g, '').replace(/[^a-z0-9._-]+/gi, '_') || 'index') + (p.search ? '_q' + p.search.replace(/[^a-z0-9]+/gi, '_') : '');
};

const csvCell = (v) => {
  const s = Array.isArray(v) ? v.join(' | ') : v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

async function main() {
  await mkdir(join(OUT, 'jsonld'), { recursive: true });
  if (SAVE_HTML) await mkdir(join(OUT, 'html'), { recursive: true });

  const fromSitemap = new Set(await sitemapUrls(`${ORIGIN}/sitemap.xml`));
  const sources = new Map();
  const queue = [];
  const enqueue = (u, src) => {
    const key = u.replace(/\/$/, '') || u;
    if (sources.has(key)) { sources.get(key).add(src); return; }
    sources.set(key, new Set([src]));
    queue.push(u);
  };
  enqueue(`${ORIGIN}/`, 'seed');
  for (const u of fromSitemap) enqueue(u, 'sitemap');

  const inlinks = new Map();
  const records = [];
  let i = 0;
  async function worker() {
    while (i < queue.length && records.length < MAX) {
      const url = queue[i++];
      const { chain, status, finalUrl, res, error } = await fetchChain(url);
      const headers = res ? Object.fromEntries(res.headers) : {};
      const rec = {
        url, sources: [], status, error: error || null, finalUrl, redirectChain: chain,
        contentType: headers['content-type'] || '', xRobotsTag: headers['x-robots-tag'] || '',
      };
      const isHtml = res && /text\/html/.test(rec.contentType);
      if (isHtml) {
        const html = await res.text();
        const p = parse(html, finalUrl);
        Object.assign(rec, p, { bytes: Buffer.byteLength(html) });
        const sameHost = new URL(finalUrl).origin === ORIGIN;
        if (sameHost) {
          for (const l of p.internal) {
            const u = new URL(l);
            inlinks.set(u.href, (inlinks.get(u.href) || 0) + 1);
            if (!ASSET_EXT.test(u.pathname) && !u.search) enqueue(u.href, 'link');
          }
        }
        if (p.jsonld.length)
          await writeFile(join(OUT, 'jsonld', slug(url) + '.json'), JSON.stringify(p.jsonld.map((j) => j.parsed ?? { _invalid: j.error, _raw: j.raw }), null, 2));
        if (SAVE_HTML) await writeFile(join(OUT, 'html', slug(url) + '.html'), html);
      } else if (res) {
        await res.arrayBuffer().catch(() => {});
      }
      records.push(rec);
      process.stderr.write(`${records.length}/${queue.length} ${status} ${url}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  for (const r of records) {
    const key = r.url.replace(/\/$/, '') || r.url;
    r.sources = [...(sources.get(key) || [])];
    r.inSitemap = fromSitemap.has(r.url) || fromSitemap.has(r.url.replace(/\/$/, ''));
    r.internalInlinks = inlinks.get(r.url) || inlinks.get(r.url + '/') || inlinks.get(r.url.replace(/\/$/, '')) || 0;
  }
  records.sort((a, b) => a.url.localeCompare(b.url));

  const cols = [
    ['url', (r) => r.url], ['sources', (r) => r.sources], ['in_sitemap', (r) => r.inSitemap],
    ['status', (r) => r.status], ['final_url', (r) => r.finalUrl], ['redirect_chain', (r) => r.redirectChain],
    ['canonical', (r) => r.canonical], ['canonical_matches_final', (r) => (r.canonical ? r.canonical.length === 1 && r.canonical[0] === r.finalUrl : '')],
    ['meta_robots', (r) => r.metaRobots], ['x_robots_tag', (r) => r.xRobotsTag],
    ['title', (r) => r.title], ['title_len', (r) => r.title?.length ?? ''],
    ['meta_description', (r) => r.metaDescription], ['meta_description_len', (r) => r.metaDescription?.length ?? ''],
    ['h1', (r) => r.h1], ['h1_count', (r) => r.h1?.length ?? ''],
    ['hreflang', (r) => r.hreflang], ['lang', (r) => r.lang],
    ['og_title', (r) => r.social?.['og:title']], ['og_description', (r) => r.social?.['og:description']],
    ['og_image', (r) => r.social?.['og:image']], ['og_type', (r) => r.social?.['og:type']], ['og_url', (r) => r.social?.['og:url']],
    ['twitter_card', (r) => r.social?.['twitter:card']], ['twitter_title', (r) => r.social?.['twitter:title']],
    ['twitter_description', (r) => r.social?.['twitter:description']], ['twitter_image', (r) => r.social?.['twitter:image']],
    ['word_count', (r) => r.wordCount], ['internal_outlinks', (r) => r.internal?.length ?? ''], ['internal_inlinks', (r) => r.internalInlinks],
    ['jsonld_blocks', (r) => r.jsonld?.length ?? ''],
    ['jsonld_types', (r) => (r.jsonld || []).flatMap((j) => collectTypes(j.parsed)).join(' ')],
    ['jsonld_invalid', (r) => (r.jsonld || []).filter((j) => j.error).length || ''],
    ['bytes', (r) => r.bytes ?? ''], ['error', (r) => r.error],
  ];
  const csv = [cols.map((c) => c[0]).join(',')].concat(records.map((r) => cols.map(([, f]) => csvCell(f(r))).join(','))).join('\n') + '\n';
  await writeFile(join(OUT, 'urls.csv'), csv);
  await writeFile(join(OUT, 'urls.json'), JSON.stringify(records.map(({ jsonld, ...r }) => r), null, 2));
  process.stderr.write(`done: ${records.length} urls, sitemap had ${fromSitemap.size}\n`);
}

function collectTypes(node, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) { node.forEach((n) => collectTypes(n, acc)); return acc; }
  if (node['@type']) acc.push([].concat(node['@type']).join('+'));
  for (const v of Object.values(node)) if (v && typeof v === 'object') collectTypes(v, acc);
  return acc;
}

main().catch((e) => { console.error(e); process.exit(1); });
