import {spawn} from 'node:child_process';
import {writeFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
const profile = await mkdtemp(`${tmpdir()}/t45-chrome-`);
if (!process.env.CHROME_BIN) throw new Error('Set CHROME_BIN to a Chromium executable (wrapper permitted)');
import assert from 'node:assert/strict';
const chrome=spawn(process.env.CHROME_BIN,['--headless=new','--disable-gpu','--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4','--remote-debugging-port=19245',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
try {
let page;
for(let i=0;i<60;i++){try{page=(await(await fetch('http://127.0.0.1:19245/json')).json()).find(x=>x.type==='page');if(page)break;}catch{}await new Promise(r=>setTimeout(r,100));}
const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map();ws.onmessage=e=>{const v=JSON.parse(e.data);if(pending.has(v.id)){pending.get(v.id)(v);pending.delete(v.id)}};
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result.result.value;
await send('Page.enable');
const results=[];
const colors=[];
for(const width of [1440,390]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width===390});
 await send('Page.navigate',{url:'http://127.0.0.1:8791/_ds/blocks-a'});
 for(let i=0;i<80;i++){if(await evaluate('!!document.querySelector("#t45-tabs [data-ready]")'))break;await new Promise(r=>setTimeout(r,100));}
 const first=await evaluate(`(()=>{const r=document.querySelector('#t45-tabs');const a=[...r.querySelectorAll('.panel:not([hidden]) .actions a')];return {width:innerWidth,scroll:document.documentElement.scrollWidth,labels:a.map(x=>x.textContent.trim()),hrefs:a.map(x=>x.getAttribute('href')),y:a.map(x=>x.getBoundingClientRect().y),primary:a[0].classList.contains('primary'),secondary:a[1].classList.contains('secondary')}})()`);
 assert.equal(first.width,width);assert(first.scroll<=width);assert.equal(first.labels.length,2);assert.deepEqual(first.hrefs,['/kontakt','/kontakt']);assert(first.primary&&first.secondary);if(width===1440)assert.equal(first.y[0],first.y[1]);
 if(width===1440){
 const readColors=()=>evaluate(`(()=>{const a=document.querySelector('#t45-tabs .secondary');const s=getComputedStyle(a);const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');const rgb=v=>{x.clearRect(0,0,1,1);x.fillStyle=v;x.fillRect(0,0,1,1);return [...x.getImageData(0,0,1,1).data].slice(0,3)};const luminance=v=>rgb(v).map(t=>{t/=255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const l1=luminance(s.color),l2=luminance(s.backgroundColor);return {text:rgb(s.color),border:rgb(s.borderTopColor),background:rgb(s.backgroundColor),outline:rgb(s.outlineColor),hover:a.matches(':hover'),hoverMedia:matchMedia('(hover: hover) and (pointer: fine)').matches,focus:a.matches(':focus-visible'),contrast:(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)}})()`);
 colors.push({state:'default',...await readColors()});
 const point=await evaluate(`(()=>{const r=document.querySelector('#t45-tabs .secondary').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});
 await new Promise(r=>setTimeout(r,350));
 colors.push({state:'hover',...await readColors()});
 assert(colors.at(-1).hover && colors.at(-1).hoverMedia);
 await evaluate(`document.querySelector('#t45-tabs .secondary').focus()`);
 colors.push({state:'hover-focus',...await readColors()});
 const shot=await send('Page.captureScreenshot',{format:'png'});
 await writeFile(process.argv[2].replace(/[^/]+$/, 'atlas-hover-focus.png'),Buffer.from(shot.result.data,'base64'));
 for(const c of colors){assert(c.contrast>=4.5);assert.deepEqual(c.text,[58,72,204]);assert.deepEqual(c.border,[58,72,204]);}assert(colors.at(-1).focus);assert.deepEqual(colors.at(-1).outline,[58,72,204]);
 }
 await evaluate(`document.querySelectorAll('#t45-tabs [role=tab]')[0].dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))`);
 assert.equal(await evaluate(`document.querySelectorAll('#t45-tabs .panel:not([hidden]) .actions').length`),0);
 await evaluate(`document.querySelectorAll('#t45-tabs [role=tab]')[2].click()`);
 assert.equal(await evaluate(`document.querySelectorAll('#t45-tabs .panel:not([hidden]) .actions a.secondary').length`),1);
 results.push({width,first,noCtaAfterArrowDown:true,secondaryOnlyAfterClick:true});
}
await send('Page.navigate',{url:'http://127.0.0.1:8791/sales-atlas-system'});await new Promise(r=>setTimeout(r,1200));
assert.equal(await evaluate(`document.querySelectorAll('[data-tabs] .actions').length`),0);
await writeFile(process.argv[2],JSON.stringify({results,colors,atlasHasNoCtaActions:true},null,2)+'\n');ws.close();
}finally{chrome.kill();await new Promise(r=>chrome.once('exit',r));await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
