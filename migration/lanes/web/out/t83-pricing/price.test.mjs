import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from '../../../../../node_modules/typescript/lib/typescript.js';
const source = readFileSync(new URL('../../../../../apps/web/src/components/blocks/Pricing.astro', import.meta.url), 'utf8');
const code = source.split('---')[1].replace(/^import .*;$/gm, '').replace(/interface Props.*\n/, '').replace(/const \{ data.*\n/, '').replace(/const plans.*\n/, '');
const { priceParts } = vm.runInNewContext(ts.transpileModule(code + '\n;({priceParts});', { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.None } }).outputText, { Intl });
for (const [name, plan, expected] of [
 ['currency in unit', { price:3900, unit:'zł netto' }, ['3 900 zł','netto']],
 ['currency absent from unit', {price:6000,unit:'netto / mies.'}, ['6 000 zł','netto / mies.']],
 ['no amount', {unit:'Wycena indywidualna'}, ['Wycena indywidualna','']],
 ['null amount', {price:null,priceNote:'Porozmawiajmy'}, ['Porozmawiajmy','']],
 ['zero amount', {price:0,unit:'zł'}, ['0 zł','']],
]) test(name,()=>{const result=priceParts(plan);assert.deepEqual([result.value,result.unit],expected);});
