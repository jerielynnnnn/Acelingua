import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {prepareKorean,validateKorean,koreanIds} from '../scripts/build-korean.mjs';
import {koreanCharacters} from '../lib/curriculum/korean-characters.mjs';

async function load(name){const source=fs.readFileSync(`lib/writing/${name}.ts`,'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);}
const {koreanWritingCourse}=await load('korean-curriculum');
const {checkWritingAnswer}=await load('sentence-check');
const {advanceWorkbookProgress}=await load('workbook-progress');
const {writingCourse}=await load('course-curriculum');
const plan=prepareKorean();

test('Korean plan has ten distinct destinations, forty teaching lessons and ten cumulative challenges',()=>{
 validateKorean(plan);assert.equal(plan.units.length,10);
 assert.equal(plan.units.flatMap(u=>u.lessons).filter(l=>l.kind==='teaching').length,40);
 assert.equal(plan.units.flatMap(u=>u.lessons).filter(l=>l.kind==='challenge').length,10);
 assert.equal(new Set(plan.units.map(u=>u.destination)).size,10);
 assert.equal(plan.units[0].id,koreanIds.unit);assert.equal(plan.units[0].lessons[0].id,koreanIds.lesson);
 assert.deepEqual(JSON.parse(fs.readFileSync('supabase/korean-beginner.json','utf8')),plan);
});
test('each teaching lesson has context, objectives, eight unique words, a dialogue, listening fallback and answerable checkpoints',()=>{
 for(const unit of plan.units)for(const lesson of unit.lessons){
  assert.ok(lesson.story&&lesson.objectives.length&&lesson.grammar&&lesson.dialogue.length>=2);
  assert.ok(lesson.activities.some(a=>a.activity_type==='listening'));
  assert.ok(lesson.activities.some(a=>a.activity_type==='quiz'));
  for(const q of lesson.questions){assert.ok(q.options.includes(q.correct_answer));assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.explanation);}
  if(lesson.kind==='teaching'){assert.equal(lesson.words.length,8);assert.ok(lesson.listening.fallback);for(const word of lesson.words){assert.ok(word.word&&word.translation&&word.part_of_speech&&word.example_sentence&&word.example_translation);assert.ok(word.example_sentence.includes(word.word));}}
 }
});
test('Korean spelling accepts NFC and explicitly equivalent answers, but rejects missing spaces, wrong particles and romanization',()=>{
 const exercises=koreanWritingCourse.at(-1).exercises;
 const negative=exercises.find(e=>e.slug==='negative');
 for(const value of ['저는 커피를 안 마셔요.','커피를 안 마셔요!','저는 커피를 안 마셔요'.normalize('NFD')])assert.equal(checkWritingAnswer(negative,value).correct,true,value);
 for(const value of ['저는커피를안마셔요','저는 커피가 안 마셔요.','jeoneun keopireul an masyeoyo','저는 커피를 마셔요.'])assert.equal(checkWritingAnswer(negative,value).correct,false,value);
});
test('all Korean workbook tiles produce supported answers and mastery does not advance on incorrect attempts',()=>{
 assert.equal(koreanWritingCourse.length,10);
 for(const lesson of koreanWritingCourse)for(const e of lesson.exercises){
  assert.equal(checkWritingAnswer(e,e.answer).correct,true,`${lesson.slug}/${e.slug}`);
  if(e.tiles){const letters=value=>[...value.replace(/[\s.!?]/gu,'')].sort().join('');assert.equal(letters(e.tiles.join('')),letters(e.answer),e.slug);}
 }
 const lesson=koreanWritingCourse[0];let progress=advanceWorkbookProgress(lesson,undefined,lesson.exercises[0].slug,false,'2026-10-22');
 assert.equal(progress.completed,false);assert.equal(progress.completed_activities.length,0);
 for(const e of lesson.exercises)progress=advanceWorkbookProgress(lesson,progress,e.slug,true,'2026-10-22');
 assert.equal(progress.completed,true);
});
test('character drafts disclose missing assets instead of fabricating demonstrations or audio',()=>{
 assert.equal(koreanCharacters.length,45);
 assert.equal(new Set(koreanCharacters.map(c=>`${c.system}/${c.slug}`)).size,45);
 for(const c of koreanCharacters){assert.equal(c.stroke_data,null);assert.equal(c.stroke_count,null);assert.equal(c.audio_url,null);assert.match(c.note,/requires review/);assert.ok(c.example_word&&c.example_translation);}
});
test('Korean and Japanese local workbook practice is isolated by language and account, and permission errors never enable fallback',async()=>{
 const saved=new Map();let dbError={code:'42P01'};let owner='owner';
 const client={from:()=>({select(){return this;},eq(){return this;},order:async()=>({error:dbError})}),auth:{getUser:async()=>({data:{user:{id:owner}},error:null})}};
 const imports={'@supabase/supabase-js':{isAuthSessionMissingError:()=>false},'@/lib/supabase/client':{createClient:()=>client},'./course-curriculum':{writingCourse},'./korean-curriculum':{koreanWritingCourse},'./workbook-progress':{advanceWorkbookProgress}};
 const source=fs.readFileSync('lib/writing/workbook-client.ts','utf8');const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(output,{exports,Date,JSON,localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},require:name=>{if(name in imports)return imports[name];throw Error(name);}});
 const studio=code=>({language:{id:code,code},userId:'owner'});
 const ko=await exports.loadWorkbook(studio('ko'));const ja=await exports.loadWorkbook(studio('ja'));
 await exports.recordWorkbookActivity(ko,ko.lessons[0].slug,ko.lessons[0].exercises[0].slug,'A syllable',true,'choice');
 assert.ok(saved.has('acelingua:writing-workbook:v1:owner:ko'));
 assert.ok(!saved.has('acelingua:writing-workbook:v1:owner:ja'));
 assert.equal((await exports.loadWorkbook(studio('ja'))).progress.length,0);
 await exports.recordWorkbookActivity(ja,ja.lessons[0].slug,ja.lessons[0].exercises[0].slug,'Katakana',true,'choice');
 assert.ok(saved.has('acelingua:writing-workbook:v1:owner:ja'));
 owner='other';await assert.rejects(()=>exports.recordWorkbookActivity(ko,ko.lessons[0].slug,ko.lessons[0].exercises[0].slug,'A syllable',true,'choice'),/account changed/);
 dbError={code:'42501',message:'permission denied'};await assert.rejects(()=>exports.loadWorkbook(studio('ko')),error=>error.code==='42501');
});
test('Korean roadmap renders current/challenge/completed states and enforces arrival before lesson links',()=>{
 const require=createRequire(import.meta.url);const React=require('react');const {renderToStaticMarkup}=require('react-dom/server');
 const css={__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
 const defaultImport=defaultExport=>({__esModule:true,default:defaultExport});
 const imports={'next/link':defaultImport(({children,href,...props})=>React.createElement('a',{href,...props},children)),'./JourneyRoadmap.module.css':css,'@/components/world/CountryScenery':defaultImport(()=>null),'@/components/writing/WritingStudioButton':defaultImport(()=>React.createElement('span',null,'Hangul & Writing')),'./UnitOverview':defaultImport(()=>null),'@/components/travel/ArrivalRequired':defaultImport(()=>React.createElement('p',null,'Arrival required')),'@/lib/curriculum/korean-destinations.json':defaultImport(JSON.parse(fs.readFileSync('lib/curriculum/korean-destinations.json','utf8')))};
 const source=fs.readFileSync('components/roadmap/JourneyRoadmap.tsx','utf8');const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const exports={};vm.runInNewContext(output,{exports,require:name=>name in imports?imports[name]:require(name)});
 const unit=plan.units[0];const units=[{id:unit.id,title:unit.title,location_name:unit.destination,unit_order:1,description:unit.culture,lessons:unit.lessons.map(l=>({id:l.id,title:l.title,lesson_order:l.order,xp_reward:20,coin_reward:5}))}];
 const states=new Map(unit.lessons.map((l,i)=>[l.id,i===0?'completed':i===1?'current':'locked']));
 const props={units,states,progress:[],courseId:koreanIds.course,languageCode:'ko',travelAccess:{arrived:true}};
 const html=renderToStaticMarkup(React.createElement(exports.default,props));assert.match(html,/Incheon Airport/);assert.match(html,/Destination challenge/);assert.match(html,/Hangul &amp; Writing/);
 assert.equal((html.match(/href="\/learn\/lesson/g)??[]).length,2);
 const blocked=renderToStaticMarkup(React.createElement(exports.default,{...props,travelAccess:{arrived:false}}));assert.match(blocked,/Arrival required/);assert.doesNotMatch(blocked,/href="\/learn\/lesson/);
});
test('draft SQL preserves learner identities, scopes writes to the audited course, and never publishes new content',()=>{
 const sql=fs.readFileSync('supabase/proposals/202610220001_korean_beginner_draft.sql','utf8');
 assert.ok(sql.includes(koreanIds.course));assert.match(sql,/Unmapped Korean lessons exist/);
 assert.doesNotMatch(sql,/(?:insert into|update|delete from|truncate) public\.(?:profiles|user_courses|lesson_progress|course_progress|user_character_progress|user_writing_lesson_progress|user_passport_stamps|travel_visits)\b/i);
 assert.doesNotMatch(sql,/set is_published=true|set is_active=true/i);
 assert.doesNotMatch(sql,/delete from|truncate|alter table|create table/i);
 const publish=fs.readFileSync('supabase/proposals/202610220002_korean_publish_after_review.sql','utf8');
 assert.match(publish,/Publication requires explicit review approval/);
 assert.doesNotMatch(publish,/update public\.writing_characters/i);
});
