#!/usr/bin/env node
// CHROME_BIN adapter for verify-web shot: preserve its Worker URL and output names,
// capture the entire document at the measured 1280x900 viewport, then mark proposals.
import { writeFileSync } from 'node:fs';
process.env.CHROME_BIN='/opt/agent-vm/chromium/chrome';
const {launch}=await import('../../../../tools/cdp.mjs');
const args=process.argv.slice(2), url=args.find(a=>a.startsWith('http://'));
const output=args.find(a=>a.startsWith('--screenshot='))?.split('=').slice(1).join('=');
const marks={
 '/kurs-ai-w-sprzedazy': ['Osiem modułów, osiem rozwiązań na koniec','Automatyzacje CRM i porządek w danych'],
 '/wdrozenie-ai-w-sprzedazy-b2b':['Pięć kroków do pierwszych procesów sprzedaży obsługiwanych przez AI'],
 '/audyt-ai-sprzedaz':['Dwa tygodnie pracy. Pięć kroków do decyzji.'],
 '/sales-atlas-system':['Skąd wziął się system sprzedaży'],
 '/blog/ai-w-sprzedazy':['Jak wdrożyć AI w sprzedaży krok po kroku?'],
};
const browser=await launch();
try{
 await browser.goto(url);
 await browser.eval('document.fonts.ready');
 // Reveal lazy content before measuring, without changing layout or CTA copy.
 await browser.eval(`(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=800){scrollTo(0,y);await new Promise(r=>setTimeout(r,20))}scrollTo(0,0)})()`);
 if(!output){console.log(await browser.eval('document.documentElement.outerHTML'));}
 else{
 const height=await browser.eval('document.documentElement.scrollHeight');
 const capture=async()=>{const r=await browser.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:1280,height,scale:1}});return Buffer.from(r.data,'base64')};
 writeFileSync(output,await capture());
 const anchors=marks[new URL(url).pathname]||[];
 const positions=await browser.eval(`(()=>{const anchors=${JSON.stringify(anchors)};return anchors.map(t=>{const h=[...document.querySelectorAll('h2,h3')].find(e=>e.textContent.trim()===t);if(!h)throw Error('Missing anchor '+t);return {anchor:t,y:Math.round(h.getBoundingClientRect().top+scrollY)-35}})})()`);
 await browser.eval(`(()=>{const ns='http://www.w3.org/2000/svg';const s=document.createElementNS(ns,'svg');s.setAttribute('width','1280');s.setAttribute('height','${height}');s.style.position='absolute';s.style.insetBlockStart='0';s.style.insetInlineStart='0';s.style.pointerEvents='none';s.style.zIndex='2147483647';s.innerHTML=${JSON.stringify(positions.map((p,i)=>`<line x1="16" x2="1264" y1="${p.y}" y2="${p.y}" stroke="#d0463b" stroke-width="5"/><rect x="16" y="${p.y-32}" width="650" height="32" fill="#d0463b"/><text x="28" y="${p.y-10}" fill="white" font-family="sans-serif" font-size="18">T41 / ${i+1}: proponowane CTA przed kolejną sekcją</text>`).join(''))};document.body.append(s)})()`);
 writeFileSync(output.replace('.png','-annotated.png'),await capture());
 writeFileSync(output.replace('.png','-marks.json'),JSON.stringify({url,height,positions},null,2));
 }
}finally{await browser.close()}
