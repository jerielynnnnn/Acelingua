-- NOT APPLIED. Uses the existing lesson, six activities and five vocabulary rows.
-- Transaction preflight stops on unexpected/misassociated questions or content.
-- Reruns verify matching rows and never overwrite or duplicate questions.
begin;
select pg_advisory_xact_lock(hashtextextended('acelingua:saying-hello:questions', 0));
do $seed$
declare
  target uuid := '973d6664-259a-415e-a2b1-aa08fe71306b';
  hello public.vocabulary%rowtype; morning public.vocabulary%rowtype;
  evening public.vocabulary%rowtype; goodbye public.vocabulary%rowtype;
  thanks public.vocabulary%rowtype;
  plan jsonb; entry jsonb; activity uuid; position integer;
  existing public.questions%rowtype;
begin
  if not exists (select 1 from public.lessons l join public.units u on u.id=l.unit_id
    where l.id=target and l.title='Saying Hello'
      and u.id='6fa3790a-9162-4f49-98e9-3bf1148d7e10'
      and u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
      and u.unit_order=4) then raise exception 'Lesson/parent no longer matches inspection; stop and inspect'; end if;
  if (select count(*) from public.activities where lesson_id=target) <> 6
    or (select count(*) from public.activities where lesson_id=target and
      (id,activity_type,activity_order) in (
      ('aabda464-428b-4a03-93df-f56196d641a8'::uuid,'vocabulary',1),
      ('74991be2-cab4-437c-a37a-722b0f8cc9fe'::uuid,'grammar',2),
      ('14a15679-e416-480d-849c-c3d3df544a83'::uuid,'listening',3),
      ('1049d82c-209c-4058-98b3-6e4f81e263a7'::uuid,'speaking',4),
      ('993cfd31-65b3-4cfa-904a-8cffa20cc802'::uuid,'conversation',5),
      ('2d89fd1c-9c89-4e94-b5ca-050c84063785'::uuid,'quiz',6))) <> 6 then
    raise exception 'Existing activities differ from inspection; no inserts performed';
  end if;
  -- Search Japanese content regardless of publication; also catch greetings
  -- associated with a similarly titled lesson under another course/language.
  if exists (select 1 from public.questions q join public.activities a on a.id=q.activity_id
    join public.lessons l on l.id=a.lesson_id join public.units u on u.id=l.unit_id
    join public.courses c on c.id=u.course_id join public.languages lang on lang.id=c.language_id
    where l.id<>target and (lang.code='ja' or l.title ilike '%Saying Hello%'
      or q.question_text ~ '(こんにちは|こんばんは|おはようございます|さようなら|ありがとう)')) then
    raise exception 'Existing Japanese/greeting questions found elsewhere. STOP: inspect associations before seeding';
  end if;
  if exists (select 1 from public.questions q left join public.activities a on a.id=q.activity_id where a.id is null) then
    raise exception 'Orphaned questions exist. STOP and inspect before seeding';
  end if;
  select * into strict hello from public.vocabulary where lesson_id=target and word='こんにちは';
  select * into strict morning from public.vocabulary where lesson_id=target and word='おはようございます';
  select * into strict evening from public.vocabulary where lesson_id=target and word='こんばんは';
  select * into strict goodbye from public.vocabulary where lesson_id=target and word='さようなら';
  select * into strict thanks from public.vocabulary where lesson_id=target and word='ありがとう';
  if (select count(*) from public.vocabulary where lesson_id=target)<>5 then raise exception 'Vocabulary differs from inspection'; end if;
  plan := jsonb_build_array(
    jsonb_build_object('activity','aabda464-428b-4a03-93df-f56196d641a8','order',1,'type','multiple_choice','prompt',format('What does %s mean?',hello.word),'options',jsonb_build_array(hello.translation,morning.translation,goodbye.translation),'answer',hello.translation,'explanation',format('%s means %s.',hello.word,hello.translation)),
    jsonb_build_object('activity','aabda464-428b-4a03-93df-f56196d641a8','order',2,'type','multiple_choice','prompt',format('Choose the meaning of %s.',evening.word),'options',jsonb_build_array(morning.translation,evening.translation,thanks.translation),'answer',evening.translation,'explanation',format('%s means %s.',evening.word,evening.translation)),
    jsonb_build_object('activity','74991be2-cab4-437c-a37a-722b0f8cc9fe','order',1,'type','multiple_choice','prompt',format('Which expression means "%s"?',morning.translation),'options',jsonb_build_array(evening.word,goodbye.word,morning.word),'answer',morning.word,'explanation',format('Use %s to say %s.',morning.word,morning.translation)),
    jsonb_build_object('activity','74991be2-cab4-437c-a37a-722b0f8cc9fe','order',2,'type','true_false','prompt',format('%s means "%s".',thanks.word,goodbye.translation),'options',jsonb_build_array('true','false'),'answer','false','explanation',format('%s means %s, not %s.',thanks.word,thanks.translation,goodbye.translation)),
    jsonb_build_object('activity','993cfd31-65b3-4cfa-904a-8cffa20cc802','order',1,'type','multiple_choice','prompt','You meet someone in the morning. Which greeting should you use?','options',jsonb_build_array(morning.word,evening.word,goodbye.word),'answer',morning.word,'explanation',format('%s means %s.',morning.word,morning.translation)),
    jsonb_build_object('activity','993cfd31-65b3-4cfa-904a-8cffa20cc802','order',2,'type','multiple_choice','prompt','You are leaving. Which expression says goodbye?','options',jsonb_build_array(hello.word,thanks.word,goodbye.word),'answer',goodbye.word,'explanation',format('%s means %s.',goodbye.word,goodbye.translation)),
    jsonb_build_object('activity','2d89fd1c-9c89-4e94-b5ca-050c84063785','order',1,'type','multiple_choice','prompt',format('What does %s mean?',goodbye.word),'options',jsonb_build_array(hello.translation,goodbye.translation,thanks.translation),'answer',goodbye.translation,'explanation',format('%s means %s.',goodbye.word,goodbye.translation)),
    jsonb_build_object('activity','2d89fd1c-9c89-4e94-b5ca-050c84063785','order',2,'type','translation','prompt',format('Translate %s into English.',thanks.word),'options',null,'answer',thanks.translation,'explanation',format('%s means %s.',thanks.word,thanks.translation))
  );
  -- Check all existing target rows against the complete plan BEFORE insertion.
  if exists (select 1 from public.questions q join public.activities a on a.id=q.activity_id
    where a.lesson_id=target and not exists (select 1 from jsonb_array_elements(plan) e
      where (e->>'activity')::uuid=q.activity_id and (e->>'order')::integer=q.question_order
        and e->>'type'=q.question_type and e->>'prompt'=q.question_text
        and e->>'answer'=q.correct_answer and nullif(e->'options','null'::jsonb) is not distinct from q.options
        and e->>'explanation' is not distinct from q.explanation)) then
    raise exception 'Existing questions differ from this seed. STOP and inspect; nothing overwritten';
  end if;
  for entry in select value from jsonb_array_elements(plan) loop
    activity := (entry->>'activity')::uuid; position := (entry->>'order')::integer;
    select * into existing from public.questions where activity_id=activity and question_order=position;
    if not found then
      insert into public.questions(activity_id,question_type,question_text,options,correct_answer,explanation,question_order)
        values(activity,entry->>'type',entry->>'prompt',nullif(entry->'options','null'::jsonb),entry->>'answer',entry->>'explanation',position);
    end if;
  end loop;
end;
$seed$;
commit;

select a.id,a.activity_order,a.activity_type,a.title,count(q.id) as questions
from public.activities a left join public.questions q on q.activity_id=a.id
where a.lesson_id='973d6664-259a-415e-a2b1-aa08fe71306b'
group by a.id order by a.activity_order;
