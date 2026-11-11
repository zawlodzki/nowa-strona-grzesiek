import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
process.env.CHROME_BIN = '/opt/agent-vm/chromium/chrome';
const { launch } = await import('../../../../../apps/web/src/components/diagrams/port/cdp.mjs');
const [scratch, evidence] = process.argv.slice(2);
if (!scratch || !evidence) throw new Error('Usage: node compare.mjs scratch-dir web-sh-evidence-dir');
const browser = await launch();
try {
  for (const file of readdirSync(scratch).filter(f => /^live-.*\.png$/.test(f))) {
    const label = file.slice(5, -4);
    const images = [readFileSync(`${scratch}/${file}`), readFileSync(`${evidence}/${label}-w1280.png`)].map(b => `data:image/png;base64,${b.toString('base64')}`);
    const png = await browser.eval(`(async()=>{
      const canvas=document.createElement('canvas');canvas.width=2560;canvas.height=940;
      const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,2560,940);
      for(const [i,src] of ${JSON.stringify(images)}.entries()) {const img=new Image();img.src=src;await img.decode();ctx.drawImage(img,i*1280,40);}
      ctx.fillStyle='black';ctx.font='18px sans-serif';ctx.fillText('LIVE www.zawlodzki.pl',15,26);ctx.fillText('NEW local Worker, current data BEFORE T42',1295,26);
      return canvas.toDataURL('image/png').split(',')[1];
    })()`);
    writeFileSync(new URL(`compare-${label}.png`, import.meta.url), Buffer.from(png, 'base64'));
  }
} finally { await browser.close(); }
