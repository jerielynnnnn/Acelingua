-- Apply migrations 003, 004, 005 first. SQL Editor only; test writes roll back.
-- Replace the learner UUID. Existing prerequisites must be complete: this test
-- deliberately DOES NOT change prerequisites or bypass Unit 4's unlock rule.
begin;
select set_config('request.jwt.claim.sub','REPLACE_WITH_LEARNER_UUID',true);
select set_config('request.jwt.claims',json_build_object('sub','REPLACE_WITH_LEARNER_UUID','role','authenticated')::text,true);
do $test$
declare
  target uuid := '973d6664-259a-415e-a2b1-aa08fe71306b';
  learner uuid := auth.uid(); responses jsonb; acknowledgments uuid[];
  result jsonb; rejected boolean := false; was_completed boolean;
  xp_before integer; coins_before integer; xp_reward integer; coin_reward integer;
  answer_rows bigint; next_lesson uuid;
begin
  -- This raises "still locked" if the learner has not completed earlier lessons.
  perform public.acelingua_start_lesson(target);
  select status='completed' into was_completed from public.lesson_progress where user_id=learner and lesson_id=target;
  select xp,coins into xp_before,coins_before from public.profiles where id=learner;
  select l.xp_reward,l.coin_reward into xp_reward,coin_reward from public.lessons l where l.id=target;
  select array_agg(id) into acknowledgments from public.activities where lesson_id=target and activity_type<>'listening';
  if (select count(*) from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=target)<>8 then raise exception 'Expected eight seeded questions'; end if;
  begin
    perform public.acelingua_complete_assessed_lesson(target,'[]'::jsonb,acknowledgments);
  exception when others then
    if sqlerrm not like '%Answer every lesson question%' then raise; end if;
    rejected:=true;
  end;
  if not rejected then raise exception 'Incomplete assessment was accepted'; end if;
  -- Seven correct answers and one wrong answer, using a real stored option.
  select jsonb_agg(jsonb_build_object('question_id',q.id,'answer',
    case when a.activity_order=1 and q.question_order=1 then
      (select option from jsonb_array_elements_text(q.options) option where option<>q.correct_answer limit 1)
    else q.correct_answer end) order by a.activity_order,q.question_order,q.id)
  into responses from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=target;
  result:=public.acelingua_complete_assessed_lesson(target,responses,acknowledgments);
  if (result->>'correct_answers')::integer<>7 or (result->>'total_questions')::integer<>8 then
    raise exception 'Server score was not 7/8'; end if;
  if (result->>'replay')::boolean is distinct from was_completed then raise exception 'First/replay flag incorrect'; end if;
  select count(*) into answer_rows from public.question_answers where user_id=learner;
  result:=public.acelingua_complete_assessed_lesson(target,responses,acknowledgments);
  if not (result->>'replay')::boolean or (result->>'xp_awarded')::integer<>0 or (result->>'coins_awarded')::integer<>0 then
    raise exception 'Retry awarded duplicate rewards'; end if;
  if (select count(*) from public.question_answers where user_id=learner)<>answer_rows then
    raise exception 'Retry duplicated answer history'; end if;
  perform public.acelingua_start_lesson(target);
  result:=public.acelingua_complete_assessed_lesson(target,responses,acknowledgments);
  if (result->>'xp_awarded')::integer<>0 or (result->>'coins_awarded')::integer<>0 then raise exception 'Replay awarded duplicate rewards'; end if;
  if (select xp from public.profiles where id=learner)<>xp_before+case when was_completed then 0 else xp_reward end
    or (select coins from public.profiles where id=learner)<>coins_before+case when was_completed then 0 else coin_reward end then
    raise exception 'Profile reward totals incorrect'; end if;
  if exists (select 1 from public.activity_progress p join public.activities a on a.id=p.activity_id
    where p.user_id=learner and a.lesson_id=target and a.activity_type='listening' and p.status='completed') then
    raise exception 'Unavailable listening was falsely marked completed'; end if;
  select l.id into next_lesson from public.lessons l where l.unit_id=(select unit_id from public.lessons where id=target)
    and l.is_published and l.lesson_order=2 order by l.id limit 1;
  if next_lesson is not null then perform public.acelingua_start_lesson(next_lesson); end if;
  raise notice 'PASS: 7/8 completion allowed; retry/replay rewards zero; answer retry deduplication; listening skipped; next lesson available';
end;
$test$;
rollback;
