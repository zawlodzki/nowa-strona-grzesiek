import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
if (process.argv[1]?.endsWith('/check-dist.mjs')) {
  const dist = resolve('dist');
  cpSync(dist, '/tmp/t62-good-dist', { recursive: true });
  cpSync(dist, '/tmp/t62-broken-dist', { recursive: true });
  const page = '/tmp/t62-broken-dist/index.html';
  writeFileSync(page, readFileSync(page, 'utf8').replace('</body>', '<h1>Deliberate T62 failure</h1></body>'));
  cpSync('/tmp/t62-broken-dist', dist, { recursive: true });
  console.log('T62 proof: replaced dist with deliberately broken copy just before gate');
}
