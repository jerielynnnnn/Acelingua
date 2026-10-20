import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync(new URL('../lib/level-progress.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};vm.runInNewContext(code,{exports});
test('XP fills each level bar and rolls over at the exact threshold',()=>{
 const zero=exports.levelProgress(0);assert.equal(zero.level,1);assert.equal(zero.current,0);assert.equal(zero.remaining,100);
 const almost=exports.levelProgress(99);assert.equal(almost.level,1);assert.equal(almost.current,99);assert.equal(almost.remaining,1);
 const next=exports.levelProgress(100);assert.equal(next.level,2);assert.equal(next.current,0);assert.equal(next.remaining,100);
 const multiple=exports.levelProgress(325);assert.equal(multiple.level,4);assert.equal(multiple.current,25);assert.equal(multiple.remaining,75);
});
test('higher historical levels are preserved without inventing XP',()=>{
 const historical=exports.levelProgress(50,5);assert.equal(historical.level,5);assert.equal(historical.current,0);assert.equal(historical.totalXp,50);assert.equal(historical.remaining,450);
});
