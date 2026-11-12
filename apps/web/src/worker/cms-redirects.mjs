// Redirects edited in Sanity ("Przekierowanie"). The build writes them to `dist/_redirects`,
// which Workers static assets applies when the Worker calls `env.ASSETS.fetch`.
// Contract redirects from url-map.csv stay in redirects.data.ts and run first.
import { writeFile } from 'node:fs/promises';

const QUERY = '*[_type == "redirect" && defined(from) && defined(to)] | order(from asc, _updatedAt desc){from, to}';
const CLEAN_PATH = /^\/(?!\/)[A-Za-z0-9._~\/-]*$/;
const TARGET = /^\/(?!\/)[^\s]*$/;
const RESERVED = ['/api/', '/_astro/'];
const withoutSlash = (path) => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path);

/**
 * Keeps the rules that cannot break a page or a contract redirect.
 * @param {{from?: unknown, to?: unknown}[]} docs published redirect documents
 * @param {{served: Iterable<string>, contract: Iterable<string>}} site paths the build serves and contract redirect paths
 */
export function selectRedirects(docs, { served, contract }) {
  const servedPaths = new Set(served);
  const contractPaths = new Set(contract);
  const rules = [];
  const skipped = [];
  const taken = new Set();
  for (const { from, to } of docs) {
    const skip = (reason) => skipped.push({ from: String(from), reason });
    if (typeof from !== 'string' || !CLEAN_PATH.test(from) || from === '/') skip('source is not a clean absolute path');
    else if (typeof to !== 'string' || !TARGET.test(to)) skip('target is not a site-relative path');
    else if (withoutSlash(to.split(/[?#]/)[0]) === withoutSlash(from)) skip('target equals source');
    else if (RESERVED.some((prefix) => from.startsWith(prefix))) skip('source is a reserved path');
    else if (contractPaths.has(from)) skip('source is a contract redirect (url-map.csv)');
    else if (servedPaths.has(withoutSlash(from))) skip('source is a live page');
    else if (taken.has(from)) skip('duplicate source, newest kept');
    else taken.add(from), rules.push({ from, to });
  }
  const sources = new Set([...taken, ...contractPaths]);
  const kept = rules.filter(({ from, to }) => {
    if (!sources.has(to.split(/[?#]/)[0])) return true;
    skipped.push({ from, reason: 'target is itself redirected (chain)' });
    return false;
  });
  return { rules: kept, skipped };
}

/** `_redirects` body: one `source destination 301` line per rule. */
export function renderRedirects(rules) {
  return rules.map(({ from, to }) => `${from} ${to} 301\n`).join('');
}

/** Astro integration: after the build, write `_redirects` from the build dataset. */
export function cmsRedirects() {
  return {
    name: 'cms-redirects',
    hooks: {
      'astro:build:done': async ({ dir, pages, logger }) => {
        const [{ sanityQuery }, { REDIRECTS }] = await Promise.all([import('../lib/sanity/client.ts'), import('./redirects.data.ts')]);
        const docs = await sanityQuery(QUERY);
        if (!Array.isArray(docs)) throw new Error('Sanity redirects query: expected a list');
        const served = pages.map(({ pathname }) => withoutSlash(`/${pathname}`));
        const { rules, skipped } = selectRedirects(docs, { served, contract: REDIRECTS.map((rule) => rule.path) });
        for (const { from, reason } of skipped) logger.warn(`skipped redirect ${from}: ${reason}`);
        await writeFile(new URL('_redirects', dir), renderRedirects(rules));
        logger.info(`${rules.length} redirect(s) from Sanity, checked against ${served.length} pages`);
      },
    },
  };
}
