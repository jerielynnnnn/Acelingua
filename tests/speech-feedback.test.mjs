import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {phraseMatches} from '../lib/voice-learning.ts';
const exports={};
const code=ts.transpileModule(fs.readFileSync(new URL('../lib/speech-feedback.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{exports,require:()=>({phraseMatches})});
test('speech corrections isolate a changed middle without marking shared context',()=>{
 const feedback=exports.speechFeedback('ありがとう','ありがと');
 assert.equal(feedback.matches,false);assert.equal(feedback.expected.before,'ありがと');assert.equal(feedback.expected.different,'う');assert.equal(feedback.heard.different,'');
 const changed=exports.speechFeedback('cat','cot');assert.equal(changed.expected.different,'a');assert.equal(changed.heard.different,'o');assert.equal(changed.expected.after,'t');
});
test('punctuation, case and spacing do not create false corrections or duplicate examples',()=>{
 assert.equal(exports.speechFeedback('こんにちは。','こんにちは').matches,true);
 assert.equal(exports.speechFeedback('Thank you!',' thank   YOU ').matches,true);
 assert.equal(phraseMatches('こんにちは','こんにちは。'),true);
 assert.equal(phraseMatches('ありがとう','ありがとうございます。'),false);
});
test('extra words and empty recognition cannot be marked as correct',()=>{
 assert.equal(exports.speechFeedback('hello','hello there').matches,false);
 const empty=exports.speechFeedback('hello','');assert.equal(empty.matches,false);assert.equal(empty.expected.different,'hello');
});
