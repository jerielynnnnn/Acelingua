import fs from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {buildKoreanCurriculum} from '../lib/curriculum/korean-beginner.mjs';
import {koreanCharacters} from '../lib/curriculum/korean-characters.mjs';

export const koreanIds={language:'c3792eee-2458-45aa-859e-81e243a78c17',course:'a5c6b836-c1a8-70e6-b53b-cd1742d46707',unit:'e33f7bfa-d32c-c894-1d1b-127883930e64',lesson:'b654cb47-ce9a-0c43-0124-528b330cf24d',country:'d3c981a5-9bf7-469c-93de-8a7c5105c6eb'};
export const id=key=>{const h=createHash('md5').update(`acelingua:ko-beginner:v1:${key}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;};
const q=value=>value==null?'null':"'"+String(value).replaceAll("'","''")+"'";
const json=value=>`${q(JSON.stringify(value))}::jsonb`;
function enrichWord(word,lesson,unit){
 const numerals=new Set('하나 둘 셋 넷 다섯 여섯 일곱 여덟 일 이 삼 사 오 십 백 천'.split(' '));
 const adjectives=new Set('작은 큰 비싸요 싸요 맛있어요 맛없어요 매워요 달아요 짜요 추워요 더워요 예뻐요 커요 작아요 조용해요 복잡해요 깨끗해요 좋았어요 재미있었어요'.split(' '));
 const adverbs=new Set('조금 쭉 조용히 정말 같이 다시 어제 내일 지금'.split(' '));
 const particles=new Set(['하고']);
 const pronouns=new Set(['저','이거','그거','저거','뭐','어디','이분']);
 const verbs=new Set('좋아해요 가요 가세요 건너세요 타요 내려요 갈아타요 일어나요 먹어요 마셔요 공부해요 일해요 자요 갔어요 먹었어요 마셨어요 했어요 봤어요 쉬었어요 만나요 찍어요 읽어요 계세요 주무세요 드세요'.split(' '));
 const part_of_speech=/syllable/u.test(word.translation)?'syllable':numerals.has(word.word)?'numeral':adjectives.has(word.word)?'adjective':verbs.has(word.word)?'verb':adverbs.has(word.word)?'adverb':particles.has(word.word)?'particle':pronouns.has(word.word)?'pronoun':/[요?]|니다|고마워|안녕$/u.test(word.word)?'expression':word.word==='저는'?'topic phrase':'noun';
 let example_sentence=lesson.model??unit.lessons[0].model,example_translation=lesson.translation??unit.lessons[0].translation;
 if(!example_sentence.includes(word.word)){
  if(part_of_speech==='noun'){
   const last=word.word.codePointAt(word.word.length-1);const final=last>=0xac00&&last<=0xd7a3&&(last-0xac00)%28!==0;
   example_sentence=word.word+(final?'이에요.':'예요.');example_translation=`It is ${word.translation}.`;
  }else if(part_of_speech==='expression'||part_of_speech==='adjective'||part_of_speech==='verb') {example_sentence=word.word;example_translation=word.translation;}
  else if(part_of_speech==='syllable'){example_sentence='가, 나, 다, 마, 아, 어, 오, 우.';example_translation='Practice reading: ga, na, da, ma, a, eo, o, u.';}
  else if(part_of_speech==='numeral'){const native=/native/u.test(word.translation);example_sentence=native?'하나, 둘, 셋, 넷, 다섯, 여섯, 일곱, 여덟.':'일, 이, 삼, 사, 오, 십, 백, 천.';example_translation=native?'One, two, three, four, five, six, seven, eight.':'One, two, three, four, five, ten, hundred, thousand.';}
  else {const examples={저:['저는 학생이에요.','I am a student.'],저는:['저는 학생이에요.','I am a student.'],어디:['어디에 가요?','Where are you going?'],그거:['그거 뭐예요?','What is that (near you)?'],저거:['저거 뭐예요?','What is that over there?'],지금:['지금 몇 시예요?','What time is it now?'],이분:['이분은 선생님이에요.','This person is a teacher.'],조용히:['조용히 말해 주세요.','Please speak quietly.'],같이:['같이 가요.','Let us go together.'],다시:['다시 말해 주세요.','Please say it again.']};if(examples[word.word])[example_sentence,example_translation]=examples[word.word];}
 }
 return {...word,part_of_speech,example_sentence,example_translation};
}
export function prepareKorean(){
 const plan=buildKoreanCurriculum();
 for(const [u,unit]of plan.units.entries()){
  unit.id=u===0?koreanIds.unit:id(`unit:${unit.slug}`);
  for(const [l,lesson]of unit.lessons.entries()){
   lesson.id=u===0&&l===0?koreanIds.lesson:id(`lesson:${lesson.slug}`);
   lesson.words=lesson.words.map(word=>enrichWord(word,lesson,unit));
   const teaching=unit.lessons.filter(row=>row.kind==='teaching');
   const scenarios=lesson.kind==='challenge'?teaching:[lesson];
   const reviewTitle=plan.units.flatMap(row=>row.lessons).find(row=>row.slug===lesson.review_from)?.title;
   lesson.activities=[
    {slug:'story',title:'Your destination mission',activity_type:'grammar',instructions:[lesson.story,...lesson.objectives.map(s=>'• '+s),unit.culture].join('\n\n')},
    {slug:'usage',title:'Notice, understand, and speak',activity_type:'grammar',instructions:[lesson.grammar,...(lesson.examples??[]).map(row=>`${row.korean}\n${row.english}`),...lesson.dialogue,'Take both roles. Then change one detail using a phrase from this lesson.'].join('\n\n')},
    {slug:'listening',title:'Listen and recognize',activity_type:'listening',instructions:'Use the existing Korean browser voice when available, then choose the phrase meaning. If no Korean voice is installed, read aloud and use vocabulary review; no audio recording or listening score is claimed.'},
    {slug:'recall',title:'Word Match and spaced review',activity_type:'grammar',instructions:`Use the word-matching vocabulary practice. Cover each translation, recall it, then check. ${reviewTitle?`Revisit “${reviewTitle}” before this checkpoint.`:'Compare both polite farewells and identify who is staying.'}`},
    {slug:'checkpoint',title:lesson.kind==='challenge'?'Destination challenge':'End-of-lesson checkpoint',activity_type:'quiz',instructions:'Choose a meaning or response that fits the travel context. Read the feedback, then retry as needed. Lesson completion uses the existing server assessment and rewards.'},
   ];
   lesson.questions=lesson.words.slice(0,3).map((word,n)=>({slug:`word-${n+1}`,question_text:`At ${unit.destination}, what does “${word.word}” communicate?`,correct_answer:word.translation,options:[word.translation,...lesson.words.filter(w=>w.translation!==word.translation).slice(0,2).map(w=>w.translation)],explanation:`${word.word}: ${word.translation}. ${lesson.grammar}`}));
   for(const row of scenarios)lesson.questions.push({slug:`scenario-${row.slug}`,question_text:`Ace asks you to communicate: “${row.translation}” Which Korean response fits?`,correct_answer:row.model,options:[row.model,...teaching.filter(r=>r.model!==row.model).slice(0,2).map(r=>r.model)],explanation:`${row.model} — ${row.translation}. ${row.grammar}`});
   if(lesson.kind==='teaching')lesson.questions.push({slug:'reading',question_text:`Read “${lesson.model}”. Which meaning fits this exchange?`,correct_answer:lesson.translation,options:[lesson.translation,...teaching.filter(r=>r.translation!==lesson.translation).slice(0,2).map(r=>r.translation)],explanation:lesson.grammar});
   if(u>0){const previous=plan.units[u-1].lessons[l%4];const word=previous.words[0];lesson.questions.push({slug:'spaced-review',question_text:`Remember your visit to ${plan.units[u-1].destination}: what does “${word.word}” mean?`,correct_answer:word.translation,options:[word.translation,...previous.words.filter(w=>w.translation!==word.translation).slice(0,2).map(w=>w.translation)],explanation:`From “${previous.title}”: ${word.word} means ${word.translation}.`});}
  }
 }
 return plan;
}

export function validateKorean(plan){
 if(plan.units.length!==10||plan.units.some(u=>u.lessons.length!==5))throw Error('Expected 10 units and 50 lessons.');
 const ids=[];
 for(const unit of plan.units)for(const lesson of unit.lessons){
  ids.push(lesson.id);if(lesson.kind==='teaching'&&(lesson.words.length<8||lesson.words.length>12))throw Error(`Vocabulary count ${lesson.slug}`);
  if(new Set(lesson.words.map(w=>w.word)).size!==lesson.words.length)throw Error(`Duplicate words ${lesson.slug}`);
  for(const question of lesson.questions)if(new Set(question.options).size<2||!question.options.includes(question.correct_answer))throw Error(`Bad question ${lesson.slug}`);
  if(lesson.audio_url)throw Error('No recorded audio has been verified.');
 }
 if(new Set(ids).size!==50)throw Error('Lesson IDs are not unique.');
}

export async function writeKoreanArtifacts(){
 const plan=prepareKorean();validateKorean(plan);
 const compiled=ts.transpileModule(fs.readFileSync('lib/writing/korean-curriculum.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
 const {koreanWritingCourse}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
 fs.writeFileSync('supabase/korean-beginner.json',JSON.stringify(plan,null,2)+'\n');
 fs.writeFileSync('supabase/korean-writing-workbook.json',JSON.stringify(koreanWritingCourse,null,2)+'\n');
 fs.writeFileSync('supabase/korean-characters-review.json',JSON.stringify(koreanCharacters,null,2)+'\n');
 fs.writeFileSync('lib/curriculum/korean-destinations.json',JSON.stringify(plan.units.map(u=>({title:u.title,destination:u.destination,culture:u.culture,objectives:u.lessons.slice(0,4).map(l=>l.goal),challenge:u.lessons[4].title,writingStage:u.order})),null,2)+'\n');
 let sql=`-- REVIEW ONLY. Generated by scripts/build-korean.mjs. NEVER executed by this script.
-- Reuses the audited course, first unit, first lesson, travel country and writing systems.
-- New units, lessons, characters, and workbook rows remain UNPUBLISHED.
-- Existing publication flags and all learner/reward/passport records remain intact.
-- Run check-korean.sql as a privileged read-only audit BEFORE approving this transaction.
begin;
set local lock_timeout='5s';
select pg_advisory_xact_lock(20261022,1);
lock table public.units,public.lessons,public.activities,public.vocabulary,public.questions in share row exclusive mode;
do $guard$
begin
 if not exists(select 1 from public.courses c join public.languages l on l.id=c.language_id where c.id=${q(koreanIds.course)} and l.code='ko' and c.language_id=${q(koreanIds.language)} and lower(c.level)='beginner') then raise exception 'Korean course identity changed; re-audit'; end if;
 if not exists(select 1 from public.units where id=${q(koreanIds.unit)} and course_id=${q(koreanIds.course)} and unit_order=1) then raise exception 'Original Korean unit changed; re-audit'; end if;
 if not exists(select 1 from public.lessons where id=${q(koreanIds.lesson)} and unit_id=${q(koreanIds.unit)} and lesson_order=1) then raise exception 'Original Korean lesson changed; re-audit'; end if;
 if exists(select 1 from public.units where course_id=${q(koreanIds.course)} and id not in (${plan.units.map(u=>q(u.id)).join(',')})) then raise exception 'Unmapped Korean units exist (possibly unpublished); re-audit, do not overwrite'; end if;
 if exists(select 1 from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=${q(koreanIds.course)} and l.id not in (${plan.units.flatMap(u=>u.lessons).map(l=>q(l.id)).join(',')})) then raise exception 'Unmapped Korean lessons exist; preserve them and revise mapping'; end if;
 if not exists(select 1 from public.travel_country_languages where country_id=${q(koreanIds.country)} and language_id=${q(koreanIds.language)}) then raise exception 'South Korea travel mapping missing; re-audit'; end if;
 if exists(select 1 from public.activities where lesson_id=${q(koreanIds.lesson)} and id not in (${plan.units[0].lessons[0].activities.map(a=>q(id(`activity:${koreanIds.lesson}:${a.slug}`))).join(',')})) then raise exception 'Original lesson gained activities; inspect them before adding assessments'; end if;
 if exists(select 1 from public.units where id=${q(koreanIds.unit)} and title not in ('Korean: First conversations','Welcome to Korea')) or exists(select 1 from public.lessons where id=${q(koreanIds.lesson)} and title not in ('Korean: Hello and goodbye','Saying Hello')) then raise exception 'Original Korean content changed; review before changing metadata'; end if;
 if (select count(*) from public.writing_systems where language_id=${q(koreanIds.language)} and slug in ('consonants','vowels','syllables'))<>3 then raise exception 'Expected existing Korean writing systems; re-audit'; end if;
 if exists(select 1 from public.writing_studio_lessons where language_id=${q(koreanIds.language)} and id not in (${koreanWritingCourse.map(l=>q(id(`workbook:${l.slug}`))).join(',')})) then raise exception 'Existing Korean workbook content requires a progress-preserving mapping'; end if;
end $guard$;
`;
 for(const unit of plan.units){
  sql+=`do $mapping$ begin if exists(select 1 from public.units where id=${q(unit.id)} and (course_id<>${q(koreanIds.course)} or unit_order<>${unit.order})) then raise exception 'Unit mapping changed; re-audit'; end if; end $mapping$;\n`;
  if(unit.id===koreanIds.unit)sql+=`update public.units set title=${q(unit.title)},description=${q(unit.culture)},location_name=${q(unit.destination)} where id=${q(unit.id)};\n`;
  else sql+=`insert into public.units(id,course_id,title,description,unit_order,location_name,is_published) values(${q(unit.id)},${q(koreanIds.course)},${q(unit.title)},${q(unit.culture)},${unit.order},${q(unit.destination)},false) on conflict(id) do nothing;\n`;
  for(const lesson of unit.lessons){
   sql+=`do $mapping$ begin if exists(select 1 from public.lessons where id=${q(lesson.id)} and (unit_id<>${q(unit.id)} or lesson_order<>${lesson.order})) then raise exception 'Lesson mapping changed; re-audit'; end if; end $mapping$;\n`;
   if(lesson.id===koreanIds.lesson)sql+=`update public.lessons set title=${q(lesson.title)},description=${q(lesson.story)} where id=${q(lesson.id)};\n`;
   else sql+=`insert into public.lessons(id,unit_id,title,description,lesson_order,xp_reward,coin_reward,is_published) values(${q(lesson.id)},${q(unit.id)},${q(lesson.title)},${q(lesson.story)},${lesson.order},20,5,false) on conflict(id) do nothing;\n`;
   for(const word of lesson.words)sql+=`insert into public.vocabulary(id,lesson_id,word,translation,pronunciation,part_of_speech,example_sentence,example_translation) select ${q(id(`word:${lesson.id}:${word.word}`))},${q(lesson.id)},${q(word.word)},${q(word.translation)},${q(word.pronunciation)},${q(word.part_of_speech)},${q(word.example_sentence)},${q(word.example_translation)} where not exists(select 1 from public.vocabulary where lesson_id=${q(lesson.id)} and word=${q(word.word)}) on conflict(id) do nothing;\n`;
   // Improve only the audited legacy fields; retain the three original vocabulary IDs.
   if(lesson.id===koreanIds.lesson)for(const word of lesson.words)sql+=`update public.vocabulary set translation=${q(word.translation)},part_of_speech=${q(word.part_of_speech)},example_sentence=${q(word.example_sentence)},example_translation=${q(word.example_translation)} where lesson_id=${q(lesson.id)} and word=${q(word.word)};\n`;
   for(const [order,a]of lesson.activities.entries())sql+=`insert into public.activities(id,lesson_id,title,instructions,activity_type,activity_order) values(${q(id(`activity:${lesson.id}:${a.slug}`))},${q(lesson.id)},${q(a.title)},${q(a.instructions)},${q(a.activity_type)},${order+1}) on conflict(id) do nothing;\n`;
   for(const [order,question]of lesson.questions.entries())sql+=`insert into public.questions(id,activity_id,question_text,question_type,correct_answer,options,explanation,question_order) values(${q(id(`question:${lesson.id}:${question.slug}`))},${q(id(`activity:${lesson.id}:checkpoint`))},${q(question.question_text)},'multiple_choice',${q(question.correct_answer)},${json(question.options)},${q(question.explanation)},${order+1}) on conflict(id) do nothing;\n`;
  }
  sql+=`insert into public.travel_country_units(country_id,unit_id,is_required) values(${q(koreanIds.country)},${q(unit.id)},true) on conflict do nothing;\n`;
  sql+=`insert into public.travel_unit_curriculum(unit_id,slug,cultural_introduction,learning_objectives,challenge_lesson_id,writing_recommendation,estimated_minutes) values(${q(unit.id)},${q('ko-'+unit.slug)},${q(unit.culture)},${json(unit.lessons.slice(0,4).map(l=>l.goal))},${q(unit.lessons[4].id)},'Open the Korean Hangul workbook for the matching stage; verified stroke assets require review.',90) on conflict(unit_id) do nothing;\n`;
  sql+=`do $meta$ begin if exists(select 1 from public.travel_unit_curriculum where unit_id=${q(unit.id)} and (slug<>${q('ko-'+unit.slug)} or challenge_lesson_id<>${q(unit.lessons[4].id)})) then raise exception 'Existing Korean travel metadata differs; review before remapping'; end if; end $meta$;\n`;
  sql+=`insert into public.passport_stamp_definitions(id,country_id,unit_id,slug,name,description,requirement_type,is_active) select ${q(id(`stamp:${unit.slug}`))},${q(koreanIds.country)},${q(unit.id)},${q('ko-'+unit.slug)},${q(unit.destination+' Explorer')},${q('Complete the published lessons and destination challenge at '+unit.destination+'.')},'unit_completion',false where not exists(select 1 from public.passport_stamp_definitions where country_id=${q(koreanIds.country)} and unit_id=${q(unit.id)} and requirement_type='unit_completion') on conflict do nothing;\n`;
 }
 for(const [order,lesson]of koreanWritingCourse.entries()){
  const lessonId=id(`workbook:${lesson.slug}`);
  sql+=`insert into public.writing_studio_lessons(id,language_id,slug,title,stage,description,blocks,display_order,is_published) values(${q(lessonId)},${q(koreanIds.language)},${q(lesson.slug)},${q(lesson.title)},${q(lesson.stage)},${q(lesson.description)},${json(lesson.blocks)},${order},false) on conflict(language_id,slug) do nothing;\n`;
  for(const [i,exercise]of lesson.exercises.entries())sql+=`insert into public.writing_studio_activities(id,lesson_id,slug,kind,definition,display_order,is_published) select ${q(id(`writing:${lesson.slug}:${exercise.slug}`))},id,${q(exercise.slug)},${q(exercise.kind)},${json(exercise)},${i},false from public.writing_studio_lessons where language_id=${q(koreanIds.language)} and slug=${q(lesson.slug)} on conflict(lesson_id,slug) do nothing;\n`;
 }
 for(const [order,c]of koreanCharacters.entries())sql+=`insert into public.writing_characters(id,writing_system_id,slug,character,romanization,group_name,example_word,example_translation,note,display_order,stroke_count,stroke_data,audio_url,is_published) select ${q(id(`character:${c.system}:${c.slug}`))},id,${q(c.slug)},${q(c.character)},${q(c.romanization)},${q(c.group)},${q(c.example_word)},${q(c.example_translation)},${q(c.note)},${order},null,null,null,false from public.writing_systems where language_id=${q(koreanIds.language)} and slug=${q(c.system)} on conflict(writing_system_id,slug) do nothing;\n`;
 sql+=`-- Deliberately no writes to user_courses, lesson_progress, course_progress,
-- character or writing progress, profiles, verified events, travel_visits, or passport stamps.
-- Publication, progress-summary reconciliation, and stamp definitions require separate review.
commit;\n`;
 fs.writeFileSync('supabase/proposals/202610220001_korean_beginner_draft.sql',sql);
 const unitIds=plan.units.map(u=>q(u.id)).join(',');
 const lessonIds=plan.units.flatMap(u=>u.lessons).map(l=>q(l.id)).join(',');
 fs.writeFileSync('supabase/proposals/202610220002_korean_publish_after_review.sql',`-- SEPARATE REVIEW ONLY. Not executed. Apply only after reviewing the draft catalog,
-- live schema/constraints, learner dependency audit, Korean language quality and regressions.
-- Explicit gate: a reviewer must SET LOCAL acelingua.korean_review_approved = 'yes'
-- inside this transaction after approval. There is no automatic publication.
begin;
select pg_advisory_xact_lock(20261022,1);
do $guard$ begin
 if current_setting('acelingua.korean_review_approved',true) is distinct from 'yes' then raise exception 'Publication requires explicit review approval'; end if;
 if (select count(*) from public.units where course_id=${q(koreanIds.course)} and id in (${unitIds}))<>10 then raise exception 'Expected 10 mapped units'; end if;
 if (select count(*) from public.lessons where id in (${lessonIds}))<>50 then raise exception 'Expected 50 mapped lessons'; end if;
 if exists(select 1 from public.lessons l where l.id in (${lessonIds}) and (not exists(select 1 from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=l.id) or not exists(select 1 from public.vocabulary v where v.lesson_id=l.id))) then raise exception 'Incomplete Korean lesson content'; end if;
end $guard$;
update public.units set is_published=true where course_id=${q(koreanIds.course)} and id in (${unitIds});
update public.lessons set is_published=true where id in (${lessonIds});
update public.writing_studio_lessons set is_published=true where language_id=${q(koreanIds.language)} and slug in (${koreanWritingCourse.map(l=>q(l.slug)).join(',')});
update public.writing_studio_activities set is_published=true where lesson_id in (select id from public.writing_studio_lessons where language_id=${q(koreanIds.language)} and slug in (${koreanWritingCourse.map(l=>q(l.slug)).join(',')}));
update public.passport_stamp_definitions set is_active=true where country_id=${q(koreanIds.country)} and unit_id in (${unitIds}) and id in (${plan.units.map(u=>q(id(`stamp:${u.slug}`))).join(',')});
-- Reconcile counters against current published lessons, without touching completion rows or balances.
update public.course_progress cp set total_lessons=t.total,completed_lessons=t.completed,
 progress_percentage=case when t.total=0 then 0 else round(100.0*t.completed/t.total) end
from (select cp2.user_id,count(l.id)::integer as total,count(l.id) filter(where p.status='completed')::integer as completed
 from public.course_progress cp2 join public.units u on u.course_id=cp2.course_id and u.is_published
 join public.lessons l on l.unit_id=u.id and l.is_published
 left join public.lesson_progress p on p.user_id=cp2.user_id and p.lesson_id=l.id
 where cp2.course_id=${q(koreanIds.course)} group by cp2.user_id) t
where cp.course_id=${q(koreanIds.course)} and cp.user_id=t.user_id;
-- Character rows remain UNPUBLISHED: verified stroke-order assets require a separate review.
-- Do not delete old stamps or award new stamps here; existing verified RPCs handle eligibility.
commit;
`);
 console.log(`Prepared ${plan.units.length} units, ${plan.units.flatMap(u=>u.lessons).length} lessons, ${koreanWritingCourse.length} workbook stages. No SQL executed.`);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/build-korean.mjs')||process.argv[1]==='scripts/build-korean.mjs')await writeKoreanArtifacts();
