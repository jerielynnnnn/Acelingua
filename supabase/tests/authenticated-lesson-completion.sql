-- Apply migration 202610060003 first. Replace the UUID below with your current
-- enrolled learner's auth UUID. Run in SQL Editor. All test writes ROLL BACK.
-- Requires the first published lesson to be uncompleted and vocabulary-only.
begin;
select set_config('request.jwt.claim.sub', 'REPLACE_WITH_LEARNER_UUID', true);
select set_config('request.jwt.claims', json_build_object('sub', 'REPLACE_WITH_LEARNER_UUID', 'role', 'authenticated')::text, true);

do $test$
declare
  learner uuid := auth.uid(); first_lesson uuid; second_lesson uuid;
  course uuid; reward_xp integer; reward_coins integer;
  xp_before integer; coins_before integer; xp_rows bigint; coin_rows bigint;
  result jsonb; denied boolean := false; lesson_rows bigint;
begin
  if not has_function_privilege('authenticated', 'public.acelingua_start_lesson(uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.acelingua_complete_lesson(uuid)', 'execute')
    or has_function_privilege('anon', 'public.acelingua_complete_lesson(uuid)', 'execute') then
    raise exception 'RPC grants are incorrect';
  end if;
  select e.course_id into course from public.user_courses e
    where e.user_id = learner and e.status = 'active';
  if (select count(*) from public.user_courses where user_id = learner and status = 'active') <> 1 then
    raise exception 'Use a learner with exactly one active course for this test';
  end if;
  select l.id, l.xp_reward, l.coin_reward into first_lesson, reward_xp, reward_coins
    from public.lessons l join public.units u on u.id = l.unit_id
    where u.course_id = course and u.is_published and l.is_published
    order by u.unit_order, u.id, l.lesson_order, l.id limit 1;
  select l.id into second_lesson from public.lessons l join public.units u on u.id = l.unit_id
    where u.course_id = course and u.is_published and l.is_published
    order by u.unit_order, u.id, l.lesson_order, l.id offset 1 limit 1;
  if first_lesson is null or second_lesson is null then raise exception 'Two published lessons are required'; end if;
  if exists (select 1 from public.lesson_progress where user_id = learner and lesson_id in (first_lesson, second_lesson) and status = 'completed') then
    raise exception 'Use an enrolled learner whose first two lessons are not completed';
  end if;
  select xp, coins into xp_before, coins_before from public.profiles where id = learner;
  if xp_before is null then raise exception 'Learner profile is required'; end if;
  select count(*) into xp_rows from public.xp_transactions where user_id = learner;
  select count(*) into coin_rows from public.coin_transactions where user_id = learner;
  select count(*) into lesson_rows from public.lesson_progress where user_id = learner;
  begin
    perform public.acelingua_start_lesson(second_lesson);
  exception when others then
    if sqlerrm not like '%still locked%' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Locked lesson start was accepted'; end if;
  if (select count(*) from public.lesson_progress where user_id = learner) <> lesson_rows then
    raise exception 'Rejected start created progress';
  end if;
  perform public.acelingua_start_lesson(first_lesson);
  if not exists (select 1 from public.lesson_progress where user_id = learner and lesson_id = first_lesson and status = 'in_progress') then
    raise exception 'Start did not create/reuse in-progress state';
  end if;
  if (select xp from public.profiles where id = learner) <> xp_before
    or (select coins from public.profiles where id = learner) <> coins_before then
    raise exception 'Starting a lesson awarded rewards';
  end if;
  result := public.acelingua_complete_lesson(first_lesson);
  if (result->>'replay')::boolean or (result->>'xp_awarded')::integer <> reward_xp
    or (result->>'coins_awarded')::integer <> reward_coins then
    raise exception 'First completion rewards were incorrect';
  end if;
  perform public.acelingua_complete_lesson(first_lesson); -- Network retry.
  perform public.acelingua_start_lesson(first_lesson); -- Replay.
  result := public.acelingua_complete_lesson(first_lesson);
  if not (result->>'replay')::boolean or (result->>'xp_awarded')::integer <> 0
    or (result->>'coins_awarded')::integer <> 0 then raise exception 'Replay awarded rewards'; end if;
  if (select xp from public.profiles where id = learner) <> xp_before + reward_xp
    or (select coins from public.profiles where id = learner) <> coins_before + reward_coins then
    raise exception 'Profile balances are inconsistent';
  end if;
  if (select count(*) from public.xp_transactions where user_id = learner) <> xp_rows + case when reward_xp > 0 then 1 else 0 end
    or (select count(*) from public.coin_transactions where user_id = learner) <> coin_rows + case when reward_coins > 0 then 1 else 0 end then
    raise exception 'Reward transaction count is inconsistent';
  end if;
  if (select completed_lessons from public.course_progress where user_id = learner and course_id = course) <> 1 then
    raise exception 'Expected one completed course lesson for this new learner';
  end if;
  perform public.acelingua_start_lesson(second_lesson);
  raise notice 'PASS: locked URL, start without rewards, completion, retry, replay, balances, course progress, next lesson unlocked';
end;
$test$;
rollback;
