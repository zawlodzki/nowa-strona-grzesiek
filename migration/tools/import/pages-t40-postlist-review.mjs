import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const out = 'migration/lanes/design/out/t40-asana';
const origin = process.env.VERIFY_ORIGIN || 'http://127.0.0.1:8791';
const query = '*[_type == "page" && count(sections[_type == "postList"]) > 0]{"path":slug.current}';
const response = await fetch('https://8u2zjhvn.api.sanity.io/v2025-02-19/data/query/production?' + new URLSearchParams({ query, perspective: 'published' }));
assert.ok(response.ok);
const { result } = await response.json();
const paths = [...new Set([...result.map(d => d.path), '/blog'])];
const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN || '/opt/agent-vm/chromium/chrome', args: ['--no-sandbox'] });
const facts = [];
try {
 const page = await browser.newPage();
 const ready = async url => {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
   await document.fonts.ready;
   await Promise.race([Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })), new Promise(r => setTimeout(r, 8000))]);
  });
 };
 for (const width of [1440,1024,390]) {
  await page.setViewportSize({width,height:1000});
  for (const path of paths) {
   await ready(origin + path);
   const measured = await page.evaluate(() => {
    const rect = el => { const r = el.getBoundingClientRect(); return {left:r.left,right:r.right,width:r.width,top:r.top}; };
    return {
     overflow:document.documentElement.scrollWidth > innerWidth,
     lists:[...document.querySelectorAll('.posts-block')].map(block => ({
      container:rect(block.closest('.block-inner')), heading:rect(block.querySelector('.head')), grid:rect(block.querySelector('.cards')),
      cards:[...block.querySelectorAll('.card')].map(rect),
     })),
     blog:[...document.querySelectorAll('ul.posts')].map(grid=>({grid:rect(grid),cards:[...grid.children].map(rect)})),
    };
   });
   assert.equal(measured.overflow,false,`${path} ${width} overflow`);
   if(path !== '/blog') assert.ok(measured.lists.length,`No PostList on ${path}`);
   for(const list of measured.lists) {
    assert.ok(Math.abs(list.cards[0].left-list.container.left)<1);
    assert.ok(Math.abs(list.heading.left-list.container.left)<1);
    assert.ok(Math.abs(list.grid.right-list.container.right)<1);
    const top=list.cards[0].top;
    const row=list.cards.filter(c=>Math.abs(c.top-top)<1);
    assert.ok(Math.abs(row.at(-1).right-list.container.right)<1,`${path} ${width} last edge`);
    if(width>=1024)assert.equal(row.length,3);
    if(width===390)assert.equal(row.length,1);
   }
   if(path==='/blog') {
    assert.ok(measured.blog.length);
    for(const list of measured.blog)for(const card of list.cards){assert.ok(card.left>=list.grid.left-1);assert.ok(card.right<=list.grid.right+1);}
   }
   facts.push({path,width,...measured});
   if(['/newsletter','/o-mnie','/blog'].includes(path)) {
    const target=path==='/blog'?page.locator('ul.posts'):page.locator('.post-list');
    const local=await target.screenshot({path:`${out}/review-new-${path.slice(1)}-${width}.png`});
    if(width===1440 && path!=='/blog') {
     await ready('https://zawlodzki.pl'+path);
     const reject=page.getByRole('button',{name:'Odrzucam opcjonalne',exact:true});if(await reject.count())await reject.click();
     await page.evaluate(()=>{for(const el of document.querySelectorAll('body *'))if(['fixed','sticky'].includes(getComputedStyle(el).position))el.style.visibility='hidden';});
     const heading=page.locator('h2').filter({hasText:'Ostatnie wpisy'}).first();
     const live=await heading.locator('xpath=ancestor::section[1]').screenshot({path:`${out}/review-live-${path.slice(1)}-${width}.png`});
     const compare=await browser.newPage({viewport:{width:width*2,height:1000}});
     await compare.setContent(`<style>body{margin:0;display:flex;align-items:start}img{width:50%;height:auto}</style><img src="data:image/png;base64,${live.toString('base64')}"><img src="data:image/png;base64,${local.toString('base64')}">`);
     const height=await compare.locator('img').evaluateAll(async els=>{await Promise.all(els.map(e=>e.decode()));return Math.ceil(Math.max(...els.map(e=>e.getBoundingClientRect().height)));});
     await compare.setViewportSize({width:width*2,height});
     await compare.screenshot({path:`${out}/compare-review-${path.slice(1)}-${width}.png`,fullPage:true});await compare.close();
    }
   }
   console.log('PASS',width,path);
  }
 }
 await writeFile(`${out}/postlist-review.json`,JSON.stringify(facts,null,2)+'\n');
} finally { await browser.close(); }
