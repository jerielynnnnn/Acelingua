import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function validateAdventure(plan) {
  if (plan.language !== "ja" || plan.country !== "jp" || plan.units.length !== 8) throw new Error("Expected the reconciled eight-destination Japan pilot.");
  const slugs = new Set();
  for (const unit of plan.units) {
    if (slugs.has(unit.slug) || !unit.culture || !unit.grammar || unit.objectives.length < 3 || unit.words.length < 6 || unit.roles.length !== 5) throw new Error(`Incomplete unit ${unit.slug}`);
    slugs.add(unit.slug);
    if (new Set(unit.words.map(w => w[0])).size !== unit.words.length || unit.words.some(w => w.length !== 3 || w.some(x => !x.trim()))) throw new Error(`Invalid vocabulary ${unit.slug}`);
    if (!unit.scenario.choices.includes(unit.scenario.answer) || new Set(unit.scenario.choices).size !== 3 || !unit.words.some(w => w[0] === unit.scenario.answer)) throw new Error(`Invalid scenario ${unit.slug}`);
  }
  for (const [title, override] of Object.entries(plan.lesson_overrides ?? {})) {
    if (!slugs.has(override.source) || (override.words && (override.words.length < 3 || override.words.some(word => word.length !== 3 || word.some(text => typeof text !== "string" || !text.trim()))))) throw new Error(`Invalid legacy content ${title}`);
  }
}

export function adventureSql(plan) {
  validateAdventure(plan);
  plan = structuredClone(plan);
  for (const [title, override] of Object.entries(plan.lesson_overrides ?? {})) {
    const base = plan.units.find(unit => unit.slug === override.source);
    if (!base) throw new Error('Unknown legacy content source: ' + title);
    plan.lesson_overrides[title] = { ...base, ...override };
  }
  const seedLessonContent = `declare unit_plan jsonb:=lesson_plan;
 phrase jsonb; ordering integer; quiz uuid; existing_word record; options jsonb;
begin
   -- Reuse original vocabulary and teaching activities. No UPDATE of learning content.
   if not exists(select 1 from public.vocabulary where lesson_id=target_lesson) then
    for phrase in select value from jsonb_array_elements(unit_plan->'words') with ordinality v(value,n)
     where case when role_index=1 then n<=3 when role_index=2 then n>=3 when role_index=3 then n%2=0 else true end loop
     insert into public.vocabulary(id,lesson_id,word,translation,pronunciation)
      values(md5(target_lesson::text||':word:'||(phrase->>0))::uuid,target_lesson,phrase->>0,phrase->>1,phrase->>2)
      on conflict(id) do nothing;
    end loop;
   end if;
   if not exists(select 1 from public.activities where lesson_id=target_lesson) then
    insert into public.activities(id,lesson_id,title,instructions,activity_type,activity_order)
    values(md5(target_lesson::text||':context')::uuid,target_lesson,'Your destination conversation',
      (unit_plan->>'culture')||E'\\n\\n'||(unit_plan->>'grammar')||E'\\n\\n'||
      case role_index when 1 then 'Read the expressions and their translations. Identify who is speaking and why.'
       when 2 then 'Compare the complete phrases. Notice the polite ending and the particles before making your own example.'
       when 3 then 'Read an expression, cover its translation, and recall its meaning. Repeat aloud using pronunciation playback if a voice is available.'
       when 4 then 'Take turns as the traveler and the guide or staff member. Read a request and give an appropriate reply from the expressions.'
       else 'Read each situation carefully. Choose the response that communicates your purpose, not just a familiar-looking word.' end,
      'grammar',1);
   end if;
   if not exists(select 1 from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=target_lesson) then
    select coalesce(max(activity_order),0)+1 into ordering from public.activities where lesson_id=target_lesson;
    quiz:=md5(target_lesson::text||':assessment')::uuid;
    insert into public.activities(id,lesson_id,title,instructions,activity_type,activity_order)
     values(quiz,target_lesson,case when role_index=5 then 'Destination Challenge' else 'Put it into practice' end,
     'Read each prompt and choose the meaning or response that fits. Feedback explains each answer. No recorded audio is assumed.','quiz',ordering) on conflict(id) do nothing;
    ordering:=0;
    for existing_word in select * from public.vocabulary where lesson_id=target_lesson order by id limit 4 loop
     ordering:=ordering+1;
     select jsonb_agg(answer order by sort_key,answer) into options from (
      select existing_word.translation as answer,(ordering%3) as sort_key union all
      select translation,case when row_number() over(order by translation)=1 then ((ordering+1)%3) else ((ordering+2)%3) end
      from (select distinct translation from public.vocabulary where lesson_id=target_lesson and translation<>existing_word.translation order by translation limit 2) alternatives
     ) candidates;
     if jsonb_array_length(options)<2 then options:=jsonb_build_array(existing_word.translation,'The speaker is asking something different.'); end if;
     insert into public.questions(id,activity_id,question_text,question_type,correct_answer,options,explanation,question_order)
     values(md5(target_lesson::text||':meaning:'||existing_word.id::text)::uuid,quiz,
      case role_index when 3 then 'Recall the meaning of: ' when 4 then 'In this exchange, what does the speaker communicate with: ' else 'Read the expression. What does it mean: ' end||existing_word.word,
      'multiple_choice',existing_word.translation,options,
      existing_word.word||' means '||existing_word.translation||'. Reading guide: '||coalesce(existing_word.pronunciation,'use the written expression')||'.',ordering) on conflict(id) do nothing;
    end loop;
    if role_index in (4,5) then
     insert into public.questions(id,activity_id,question_text,question_type,correct_answer,options,explanation,question_order)
     values(md5(target_lesson::text||':scenario')::uuid,quiz,unit_plan->'scenario'->>'prompt','multiple_choice',
      unit_plan->'scenario'->>'answer',unit_plan->'scenario'->'choices',unit_plan->'scenario'->>'explanation',ordering+1) on conflict(id) do nothing;
    end if;
   end if;

end;`;
  return `-- GENERATED by scripts/build-country-adventure.mjs; NOT APPLIED.
-- Review after 007. Reconciles existing IDs, never deletes or reorders records.
-- Unknown empty published lessons stop the transaction rather than fake content.
begin;
do $seed$
declare plan jsonb := $plan$${JSON.stringify(plan)}$plan$::jsonb;
 unit_plan jsonb; lesson_plan jsonb; lookup_title text; role_plan jsonb; phrase jsonb; target_unit uuid; target_lesson uuid; challenge uuid;
 course uuid := '${plan.courseId}'; country uuid; language uuid; role_index integer; ordering integer;
 lesson_label text; role_names text[]:=array['Discover','Learn','Practice','Real-Life Conversation','Destination Challenge'];
 words_for_lesson jsonb; quiz uuid; existing_word record; lesson_row record; prompt text; options jsonb; key text;
begin
 perform pg_advisory_xact_lock(hashtextextended('acelingua:japan:adventure',0));
 lock table public.units,public.lessons in share row exclusive mode;
 select c.language_id into language from public.courses c join public.languages l on l.id=c.language_id where c.id=course and l.code='ja';
 if language is null then raise exception 'Japan course differs from audit; stop and inspect'; end if;
 select id into strict country from public.travel_countries where code='jp' and is_active;
 if not exists(select 1 from public.travel_country_languages where country_id=country and language_id=language) then raise exception 'Japan/Japanese association missing'; end if;
 for unit_plan in select value from jsonb_array_elements(plan->'units') loop
  if (select count(*) from public.units u where u.course_id=course and (u.title in(select jsonb_array_elements_text(unit_plan->'aliases')) or u.id=md5('ace:adventure:ja:unit:'||(unit_plan->>'slug'))::uuid))>1 then raise exception 'Ambiguous existing unit %',unit_plan->>'slug'; end if;
  select id into target_unit from public.units u where u.course_id=course and (u.title in(select jsonb_array_elements_text(unit_plan->'aliases')) or u.id=md5('ace:adventure:ja:unit:'||(unit_plan->>'slug'))::uuid);
  if target_unit is null then
   select coalesce(max(unit_order),0)+1 into ordering from public.units where course_id=course;
   target_unit:=md5('ace:adventure:ja:unit:'||(unit_plan->>'slug'))::uuid;
   insert into public.units(id,course_id,title,description,unit_order,location_name,is_published)
    values(target_unit,course,unit_plan->>'location',unit_plan->>'culture',ordering,unit_plan->>'location',false);
  end if;
  -- A country display label is additive; existing titles/orders/progress stay intact.
  update public.units set location_name=unit_plan->>'location' where id=target_unit and location_name is null;
  insert into public.travel_country_units(country_id,unit_id,is_required) values(country,target_unit,true) on conflict do nothing;
  role_index:=0; challenge:=null;
  for role_plan in select value from jsonb_array_elements(unit_plan->'roles') loop
   role_index:=role_index+1;
   key:='ace:adventure:ja:'||(unit_plan->>'slug')||':'||role_index::text;
   -- Prefer the stable seed-owned lesson on retries. Legacy drafts remain
   -- unchanged and are never selected as playable adventure roles.
   select id into target_lesson from public.lessons l where l.unit_id=target_unit and l.id=md5(key)::uuid;
   if target_lesson is null then
    if (select count(*) from public.lessons l where l.unit_id=target_unit and l.is_published
     and l.title in(select jsonb_array_elements_text(role_plan)))>1 then raise exception 'Ambiguous published lesson %/%',unit_plan->>'slug',role_index; end if;
    select id into target_lesson from public.lessons l where l.unit_id=target_unit and l.is_published
     and l.title in(select jsonb_array_elements_text(role_plan)) order by l.lesson_order,l.id limit 1;
   end if;
   if target_lesson is null then
    select coalesce(max(lesson_order),0)+1 into ordering from public.lessons where unit_id=target_unit;
    target_lesson:=md5(key)::uuid;
    lesson_label:=role_names[role_index]||' — '||(unit_plan->>'location');
    insert into public.lessons(id,unit_id,title,description,lesson_order,xp_reward,coin_reward,is_published)
    values(target_lesson,target_unit,lesson_label,
      case role_index when 1 then 'Explore the scene and its key expressions. '||(unit_plan->>'culture')
      when 2 then 'Build a useful sentence. '||(unit_plan->>'grammar')
      when 3 then 'Read, recall, and say the expressions without looking. Pronunciation playback uses available browser voices.'
      when 4 then 'Choose a response for a short exchange in this destination. Say both parts aloud.'
      else 'Use this destination’s phrases in a practical assessment. Aim for at least 80 percent correct.' end,
      ordering,20,5,false);
   end if;
   if role_index=5 then challenge:=target_lesson; end if;
   select title into lookup_title from public.lessons where id=target_lesson;
   lesson_plan:=unit_plan||coalesce(plan->'lesson_overrides'->lookup_title,'{}'::jsonb);
   ${seedLessonContent}
   -- Only seed-owned new lessons are published. Existing publication flags never change.
   update public.lessons set is_published=true where id=md5(key)::uuid and
    exists(select 1 from public.vocabulary where lesson_id=target_lesson) and
    exists(select 1 from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=target_lesson);
  end loop;
  if challenge is null or not exists(select 1 from public.lessons where id=challenge and unit_id=target_unit) then raise exception 'Challenge association invalid'; end if;
  if not exists(select 1 from public.lessons where id=challenge and is_published) then raise exception 'Existing challenge is unpublished; review its publishing decision before seeding this destination'; end if;
  -- Reconcile known supplemental legacy lessons without changing their IDs.
  for lesson_row in select l.id,l.title from public.lessons l where l.unit_id=target_unit and l.is_published
   and (not exists(select 1 from public.vocabulary v where v.lesson_id=l.id)
    or (exists(select 1 from public.activities a where a.lesson_id=l.id) and not exists(select 1 from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=l.id))) loop
   if plan->'lesson_overrides' ? lesson_row.title then
    lesson_plan:=unit_plan||(plan->'lesson_overrides'->lesson_row.title);
    target_lesson:=lesson_row.id;
    role_index:=3;
    ${seedLessonContent}
   end if;
  end loop;
  -- Unknown published empty lessons are never quietly bypassed or filled with
  -- unrelated words; an administrator must reconcile their actual objectives.
  if exists(select 1 from public.lessons l where l.unit_id=target_unit and l.is_published and (
    not exists(select 1 from public.vocabulary v where v.lesson_id=l.id)
    or (exists(select 1 from public.activities a where a.lesson_id=l.id) and not exists(select 1 from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=l.id))
    or exists(select 1 from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=l.id and (
      btrim(coalesce(q.correct_answer,''))='' or btrim(coalesce(q.question_text,''))=''
      or q.question_type not in ('multiple_choice','true_false','translation')
      or (q.question_type in ('multiple_choice','true_false') and (jsonb_typeof(q.options) is distinct from 'array' or not coalesce(q.options @> jsonb_build_array(q.correct_answer),false)))
    ))
  )) then raise exception 'Destination % has an existing incomplete published lesson. Inspect it before applying this seed.',unit_plan->>'location'; end if;
  insert into public.travel_unit_curriculum(unit_id,slug,cultural_introduction,learning_objectives,challenge_lesson_id,writing_recommendation,estimated_minutes)
   values(target_unit,unit_plan->>'slug',unit_plan->>'culture',unit_plan->'objectives',challenge,unit_plan->>'writing',35) on conflict(unit_id) do nothing;
  if exists(select 1 from public.travel_unit_curriculum where unit_id=target_unit and (slug<>unit_plan->>'slug' or challenge_lesson_id<>challenge)) then raise exception 'Existing destination metadata differs; inspect before remapping'; end if;
  if exists(select 1 from public.passport_stamp_definitions where country_id=country and slug=unit_plan->>'slug' and (unit_id is distinct from target_unit or requirement_type<>'unit_completion')) then raise exception 'Existing stamp association differs; inspect before remapping'; end if;
  insert into public.passport_stamp_definitions(id,country_id,unit_id,slug,name,description,requirement_type)
   values(md5('ace:stamp:'||target_unit::text)::uuid,country,target_unit,unit_plan->>'slug',(unit_plan->>'location')||' Explorer',
    'Complete every published lesson and the destination challenge in '||(unit_plan->>'location')||'.','unit_completion') on conflict(country_id,slug) do nothing;
  update public.units set is_published=true where id=md5('ace:adventure:ja:unit:'||(unit_plan->>'slug'))::uuid;
 end loop;
 insert into public.passport_stamp_definitions(id,country_id,slug,name,description,requirement_type)
 select md5('ace:stamp:japan-explorer')::uuid,country,'japan-explorer','Japan Explorer','Complete every required Japan destination and its challenge.','country_completion'
 where not exists(select 1 from public.passport_stamp_definitions where country_id=country and requirement_type='country_completion');
-- Extend compatible existing published units to all other active countries.
-- No courses are created or published, and no language is inferred from a flag.
insert into public.travel_country_units(country_id,unit_id,is_required)
 select cl.country_id,u.id,false from public.travel_country_languages cl
 join public.travel_countries country on country.id=cl.country_id and country.is_active
 join public.languages language on language.id=cl.language_id and language.is_active
 join public.courses c on c.language_id=cl.language_id and c.is_published
 join public.units u on u.course_id=c.id and u.is_published
 on conflict do nothing;
end;
$seed$;
commit;
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const plan = JSON.parse(fs.readFileSync(new URL("../supabase/japan-adventure.json", import.meta.url), "utf8"));
  fs.writeFileSync(new URL("../supabase/migrations/202610180008_japan_adventure.sql", import.meta.url), adventureSql(plan));
  console.log("Generated unapplied Japan adventure seed: 8 reconciled units, 5 lesson roles per unit.");
}
