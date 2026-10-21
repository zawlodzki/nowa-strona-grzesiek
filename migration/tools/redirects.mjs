#!/usr/bin/env node
// Host/path canonicalization probe. Records each hop of every redirect chain.
// Usage: node redirects.mjs --out redirects.csv [--host www.zawlodzki.pl] [--cases cases.txt]
// cases.txt: one URL or path per line ("# label" comments allowed); paths are resolved against https://<host>.
import { writeFile, readFile } from 'node:fs/promises';

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const HOST = arg('host', 'www.zawlodzki.pl');
const OUT = arg('out', 'redirects.csv');
const CASES = arg('cases');

const defaultCases = `
# protocol and host
http://zawlodzki.pl/
http://www.zawlodzki.pl/
https://zawlodzki.pl/
https://www.zawlodzki.pl/
http://zawlodzki.pl/blog/ai-w-sprzedazy
https://zawlodzki.pl/blog/ai-w-sprzedazy
https://zawlodzki.pl/o-mnie?x=1
# .com domain
http://zawlodzki.com/
https://zawlodzki.com/
http://www.zawlodzki.com/
https://www.zawlodzki.com/
https://zawlodzki.com/blog/ai-w-sprzedazy
https://www.zawlodzki.com/o-mnie
https://zawlodzki.com/robots.txt
# webflow staging
https://zawlodzki.webflow.io/
https://zawlodzki.webflow.io/robots.txt
# trailing slash
/o-mnie/
/blog/
/blog/ai-w-sprzedazy/
# uppercase
/O-Mnie
/BLOG/AI-W-SPRZEDAZY
/Blog
# query and index
/?utm_source=test
/index.html
/blog?f95bbc04_page=2
/blog?f95bbc04_page=99
/search?query=crm
# common legacy paths
/home
/index
/about
/o-nas
/contact
/kontakt.html
/oferta
/uslugi
/en
/en/
/feed
/rss
/rss.xml
/blog/feed
/blog/rss.xml
/wp-admin
/wp-login.php
/sitemap_index.xml
/post-sitemap.xml
/category/crm
/tag/crm
/author/grzesiek
/blog/page/2
/blog/category/crm
/post/ai-w-sprzedazy
/posts/ai-w-sprzedazy
/llms-full.txt
/.well-known/security.txt
/favicon.ico
/apple-touch-icon.png
/ads.txt
/humans.txt
# 404 handling
/this-page-does-not-exist-404-test
/blog/this-post-does-not-exist
`;

async function chain(url) {
  const hops = [];
  let cur = url;
  for (let i = 0; i < 10; i++) {
    let res;
    try {
      res = await fetch(cur, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (compatible; zawlodzki-migration-crawler/1.0)' } });
    } catch (e) {
      hops.push({ url: cur, status: 'ERR ' + (e.cause?.code || e.message) });
      return hops;
    }
    const loc = res.headers.get('location');
    const body = res.status === 200 ? await res.text() : (await res.arrayBuffer(), '');
    hops.push({
      url: cur, status: res.status, server: res.headers.get('server') || '',
      robots: res.headers.get('x-robots-tag') || (body.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1] ?? ''),
      title: body.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim() ?? '',
    });
    if (res.status >= 300 && res.status < 400 && loc) { cur = new URL(loc, cur).href; continue; }
    return hops;
  }
  return hops;
}

const text = CASES ? await readFile(CASES, 'utf8') : defaultCases;
let group = '';
const rows = [];
for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
  if (line.startsWith('#')) { group = line.slice(1).trim(); continue; }
  const url = /^https?:/.test(line) ? line : `https://${HOST}${line}`;
  const hops = await chain(url);
  const last = hops.at(-1);
  rows.push({
    group, input: url,
    first_status: hops[0].status,
    hops: hops.length - 1,
    chain: hops.map((h) => `${h.status} ${h.url}`).join(' -> '),
    final_url: last.url, final_status: last.status, final_robots: last.robots || '', final_title: last.title || '',
  });
  process.stderr.write(`${hops[0].status} ${url} => ${last.status} ${last.url}\n`);
}
const cols = Object.keys(rows[0]);
const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
await writeFile(OUT, [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');
