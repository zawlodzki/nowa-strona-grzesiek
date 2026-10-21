// Finds every animated diagram embed in the live Webflow HTML snapshot. One
// key always maps to one embed, even when several pages carry it.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function embedAround(html, idAt) {
  const open = html.lastIndexOf('<div', html.lastIndexOf('w-embed', idAt));
  const token = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->|<div\b[^>]*>|<\/div>/g;
  token.lastIndex = open;
  let depth = 0;
  for (let m; (m = token.exec(html)); ) {
    if (m[0].startsWith('<div')) depth++;
    else if (m[0] === '</div>' && --depth === 0) {
      return html.slice(html.indexOf('>', open) + 1, m.index);
    }
  }
  throw new Error(`unbalanced embed at offset ${idAt}`);
}

export function collect(htmlDir) {
  const byKey = new Map();
  for (const file of readdirSync(htmlDir).filter((f) => f.endsWith('.html')).sort()) {
    const page = file.slice(0, -5);
    const html = readFileSync(join(htmlDir, file), 'utf8');
    for (const m of html.matchAll(/<div id="((?:zw|crm)-[\w-]+)"/g)) {
      const embed = embedAround(html, m.index);
      if (!/<script>/.test(embed)) continue;
      const seen = byKey.get(m[1]);
      if (seen && seen.embed !== embed) throw new Error(`key ${m[1]} has two different embeds (${seen.pages[0]}, ${page})`);
      if (seen) seen.pages.push(page);
      else byKey.set(m[1], { key: m[1], embed, pages: [page] });
    }
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}
