import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { INDEXNOW_KEY, INDEXNOW_HOST } from '../../apps/web/src/lib/indexnow.mjs';

export function payloadFor(urls) {
  const urlList = [...new Set(urls)].sort();
  if (!urlList.length || urlList.length > 10000) throw new Error('Expected 1–10000 URLs');
  for (const value of urlList) {
    const url = new URL(value);
    if (url.origin !== `https://${INDEXNOW_HOST}` || url.username || url.password || url.search || url.hash) {
      throw new Error(`Not a canonical production URL: ${value}`);
    }
  }
  return { host: INDEXNOW_HOST, key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`, urlList };
}

export async function deployedUrls(dist) {
  const index = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
  const locations = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replaceAll('&amp;', '&'));
  const urls = [];
  for (const child of locations(index)) {
    const url = new URL(child);
    if (url.origin !== `https://${INDEXNOW_HOST}` || !/^\/sitemap-(pl|en)\.xml$/.test(url.pathname)) {
      throw new Error('Unexpected sitemap child');
    }
    urls.push(...locations(await readFile(resolve(dist, url.pathname.slice(1)), 'utf8')));
  }
  return urls;
}

export async function submit(payload, { env = process.env, dryRun = false, fetchImpl = fetch, print = console.log } = {}) {
  payload = payloadFor(payload.urlList);
  if (dryRun) { print(JSON.stringify(payload, null, 2)); return; }
  if (env.INDEXNOW_ENABLED !== '1' || env.INDEXNOW_DEPLOYMENT !== 'production' ||
      env.INDEXNOW_HOST !== INDEXNOW_HOST || env.WORKERS_CI !== '1' ||
      env.WORKERS_CI_BRANCH !== 'main' || env.GITHUB_ACTIONS || env.VITEST || env.NODE_ENV === 'test') {
    throw new Error('IndexNow refused: requires enabled production Workers Builds on main with the canonical host');
  }
  const response = await fetchImpl('https://api.indexnow.org/indexnow', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow HTTP ${response.status}`);
  print(`IndexNow accepted ${payload.urlList.length} URLs (${response.status})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== '--dry-run')) throw new Error('Usage: node migration/tools/indexnow.mjs [--dry-run]');
    const dist = new URL('../../apps/web/dist/', import.meta.url).pathname;
    await submit(payloadFor(await deployedUrls(dist)), { dryRun: args.includes('--dry-run') });
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
