#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
process.env.CHROME_BIN = '/opt/agent-vm/chromium/chrome';
const { launch } = await import('../../../../../apps/web/src/components/diagrams/port/cdp.mjs');
const args = process.argv.slice(2);
const url = args.find(a => /^(https?|file):/.test(a));
const output = args.find(a => a.startsWith('--screenshot='))?.slice(13);
const width = Number(args.find(a => a.startsWith('--window-size='))?.slice(14).split(',')[0] || 1280);
const browser = await launch({ width });
try {
  await browser.goto(url);
  await browser.eval('document.fonts.ready');
  await browser.eval('new Promise(resolve => setTimeout(resolve, 1800))');
  if (!output) console.log(await browser.eval('document.documentElement.outerHTML'));
  else {
    const r = await browser.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(output, Buffer.from(r.data, 'base64'));
  }
} finally { await browser.close(); }
