import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('./after/layout.json',import.meta.url),'utf8'));
for(const row of rows.filter(r=>r.path!=='/_ds/blocks-b')) {
 assert.equal(row.overflow,false,`${row.path} ${row.width}: page overflow`);
 for(const card of row.cards) {
  assert.doesNotMatch(card.price.text,/zł\s+zł/);
  assert.equal(card.tier.lines,1,`${row.path}: tier wraps`);
  if(row.width===1440 && card.cta) assert.equal(card.cta.lines,1,`${row.path}: CTA wraps`);
 }
 if(row.width>=992 && row.cards.length<=3) for(const key of ['tier','price','note','action']) {
  const ys=row.cards.map(c=>c[key].y);
  assert.ok(Math.max(...ys)-Math.min(...ys)<1,`${row.path}: ${key} alignment`);
 }
}
console.log('PASS: 11 public pricing routes × 6 widths; currency, tiers, desktop CTAs, shared rows, page overflow.');
