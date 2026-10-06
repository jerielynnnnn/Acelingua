-- NOT APPLIED. Apply 003 and question seed 004 first.
-- Extends the existing atomic reward architecture; no new tables or columns.
-- All answers are graded against stored questions inside the reward transaction.
begin;
create or replace function public.acelingua_normalize_answer(answer text)
returns text language sql immutable set search_path='' as $$
  select lower(btrim(regexp_replace(answer,'[[:space:]]+',' ','g')));
$$;
revoke all on function public.acelingua_normalize_answer(text) from public,anon,authenticated;
create or replace function public.acelingua_complete_assessed_lesson(p_lesson_id uuid, p_answers jsonb, p_acknowledged uuid[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid(); course uuid; previous_status text;
  question_count integer; correct_count integer := 0; attempt_number integer;
  question_row record; activity_row record; response text; matched boolean;
  reward_xp integer; reward_coins integer; lesson_title text; total integer; completed integer;
begin
  course := public.acelingua_lesson_course(p_lesson_id);
  perform pg_advisory_xact_lock(hashtextextended(learner::text || ':' || course::text, 0));
  perform public.acelingua_lesson_course(p_lesson_id);
  select status into previous_status from public.lesson_progress
    where user_id = learner and lesson_id = p_lesson_id for update;
  if previous_status is null or previous_status not in ('in_progress', 'completed') then
    raise exception 'Start the lesson before completing it';
  end if;
  select count(*) into question_count from public.questions q
    join public.activities a on a.id=q.activity_id where a.lesson_id=p_lesson_id;
  if question_count=0 and exists(select 1 from public.activities where lesson_id=p_lesson_id) then raise exception 'This assessed lesson has no questions yet'; end if;
  if question_count=0 and not exists(select 1 from public.vocabulary where lesson_id=p_lesson_id) then raise exception 'This lesson has no learning content yet'; end if;
  if jsonb_typeof(p_answers) is distinct from 'array' then raise exception 'Answers must be an array'; end if;
  if jsonb_array_length(p_answers)<>question_count
    or (select count(distinct entry->>'question_id') from jsonb_array_elements(p_answers) entry)<>question_count
    or exists (select 1 from jsonb_array_elements(p_answers) entry where
      jsonb_typeof(entry->'answer') is distinct from 'string'
      or coalesce(btrim(entry->>'answer'),'')=''
      or not exists (select 1 from public.questions q join public.activities a on a.id=q.activity_id
        where a.lesson_id=p_lesson_id and q.id::text=entry->>'question_id')) then
    raise exception 'Answer every lesson question exactly once before completing';
  end if;
  if exists (select 1 from public.questions q join public.activities a on a.id=q.activity_id
    where a.lesson_id=p_lesson_id and q.question_type not in ('multiple_choice','true_false','translation')) then
    raise exception 'This lesson contains an unsupported assessment type';
  end if;
  if exists (select 1 from public.activities a where a.lesson_id=p_lesson_id
    and not exists (select 1 from public.questions q where q.activity_id=a.id)
    and a.activity_type<>'listening' and not (a.id=any(coalesce(p_acknowledged,array[]::uuid[])))) then
    raise exception 'Complete all instructional steps before finishing';
  end if;
  select attempts into attempt_number from public.lesson_progress
    where user_id=learner and lesson_id=p_lesson_id;
  for question_row in select q.* from public.questions q join public.activities a on a.id=q.activity_id
    where a.lesson_id=p_lesson_id order by a.activity_order,q.question_order,q.id loop
    select entry->>'answer' into response from jsonb_array_elements(p_answers) entry where entry->>'question_id'=question_row.id::text;
    if question_row.question_type in ('multiple_choice','true_false') and not exists
      (select 1 from jsonb_array_elements_text(question_row.options) option_value where option_value=response) then
      raise exception 'Selected answer is not one of the stored options';
    end if;
    matched := public.acelingua_normalize_answer(response)=public.acelingua_normalize_answer(question_row.correct_answer);
    if matched then correct_count:=correct_count+1; end if;
    -- Stable per-attempt identifiers deduplicate network retries without a new
    -- answer-history schema. Replays started again have a new attempt number.
    insert into public.question_answers(id,user_id,question_id,answer,is_correct,answered_at)
      values (md5(learner::text||':'||p_lesson_id::text||':'||attempt_number::text||':'||question_row.id::text)::uuid,
        learner,question_row.id,response,matched,now()) on conflict(id) do nothing;
  end loop;
  for activity_row in select a.* from public.activities a where a.lesson_id=p_lesson_id loop
    -- No audio is available: do not pretend a listening assessment happened.
    if activity_row.activity_type='listening' and not exists(select 1 from public.questions q where q.activity_id=activity_row.id) then continue; end if;
    insert into public.activity_progress as existing(user_id,activity_id,status,score,attempts,completed_at,last_accessed_at)
      select learner,activity_row.id,'completed',
        case when count(q.id)=0 then null else 100.0 * count(q.id) filter (where
          public.acelingua_normalize_answer(q.correct_answer)=public.acelingua_normalize_answer(entry->>'answer')) / count(q.id) end,
        attempt_number,now(),now()
      from public.questions q left join jsonb_array_elements(p_answers) entry on entry->>'question_id'=q.id::text
      where q.activity_id=activity_row.id
    on conflict(user_id,activity_id) do update set status='completed',score=excluded.score,
      attempts=greatest(existing.attempts,attempt_number),completed_at=coalesce(existing.completed_at,now()),last_accessed_at=now(),updated_at=now();
  end loop;
  select xp_reward, coin_reward, title into reward_xp, reward_coins, lesson_title
    from public.lessons where id = p_lesson_id;
  if reward_xp < 0 or reward_coins < 0 then raise exception 'Lesson rewards must not be negative'; end if;
  if previous_status <> 'completed' then
    -- Atomic increments also serialize completions from different courses.
    update public.profiles set xp = public.profiles.xp + reward_xp,
      coins = public.profiles.coins + reward_coins, updated_at = now() where id = learner;
    if not found then raise exception 'Learner profile is missing'; end if;
    if reward_xp > 0 then
      insert into public.xp_transactions(id, user_id, amount, source_type, source_id, description, created_at)
        values (gen_random_uuid(), learner, reward_xp, 'lesson', p_lesson_id, 'Completed: ' || lesson_title, now());
    end if;
    if reward_coins > 0 then
      insert into public.coin_transactions(id, user_id, amount, transaction_type, source_id, description, created_at)
        values (gen_random_uuid(), learner, reward_coins, 'lesson', p_lesson_id, 'Completed: ' || lesson_title, now());
    end if;
    update public.lesson_progress set status = 'completed', completed_at = now(),
      last_accessed_at = now(), updated_at = now()
      where user_id = learner and lesson_id = p_lesson_id;
  end if;
  select count(*), count(*) filter (where p.status = 'completed') into total, completed
  from public.lessons l join public.units u on u.id = l.unit_id
  left join public.lesson_progress p on p.lesson_id = l.id and p.user_id = learner
  where u.course_id = course and u.is_published and l.is_published;
  insert into public.course_progress(user_id, course_id, completed_lessons, total_lessons, progress_percentage, last_accessed_at)
    values (learner, course, completed, total, case when total = 0 then 0 else completed::numeric / total * 100 end, now())
  on conflict (user_id, course_id) do update set completed_lessons = excluded.completed_lessons,
    total_lessons = excluded.total_lessons, progress_percentage = excluded.progress_percentage,
    last_accessed_at = now(), updated_at = now();
  return jsonb_build_object('replay', previous_status = 'completed',
    'xp_awarded', case when previous_status = 'completed' then 0 else reward_xp end,
    'coins_awarded', case when previous_status = 'completed' then 0 else reward_coins end,
    'completed_lessons', completed, 'total_lessons', total, 'correct_answers', correct_count, 'total_questions', question_count);
end;
$$;
revoke all on function public.acelingua_complete_assessed_lesson(uuid,jsonb,uuid[]) from public,anon;
grant execute on function public.acelingua_complete_assessed_lesson(uuid,jsonb,uuid[]) to authenticated;
-- Preserve the original vocabulary-only RPC as a compatibility wrapper.
-- Both lesson types now share exactly one atomic reward implementation.
create or replace function public.acelingua_complete_lesson(p_lesson_id uuid)
returns jsonb language sql security definer set search_path='' as $$
  select public.acelingua_complete_assessed_lesson(p_lesson_id,'[]'::jsonb,array[]::uuid[]);
$$;
revoke all on function public.acelingua_complete_lesson(uuid) from public,anon;
grant execute on function public.acelingua_complete_lesson(uuid) to authenticated;
commit;
