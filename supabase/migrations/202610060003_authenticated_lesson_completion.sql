-- NOT APPLIED. Based on the live columns, constraints, indexes and policies
-- supplied by the owner. No tables, columns, curriculum or triggers are added.
-- Completion and rewards use a single transaction with a course-scoped lock.
begin;

grant select on public.activities, public.questions, public.vocabulary,
  public.lesson_progress, public.activity_progress, public.question_answers,
  public.xp_transactions, public.coin_transactions to authenticated;

create or replace function public.acelingua_lesson_course(p_lesson_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid();
  course uuid;
  unit_position integer;
  lesson_position integer;
  unit_uuid uuid;
begin
  if learner is null then raise exception 'Sign in to open a lesson'; end if;
  select u.course_id, u.unit_order, l.lesson_order, u.id
    into course, unit_position, lesson_position, unit_uuid
  from public.lessons l join public.units u on u.id = l.unit_id
  join public.courses c on c.id = u.course_id
  join public.languages lang on lang.id = c.language_id
  where l.id = p_lesson_id and l.is_published and u.is_published
    and c.is_published and lang.is_active
    and exists (select 1 from public.user_courses e
      where e.user_id = learner and e.course_id = c.id and e.status = 'active');
  if course is null then raise exception 'Lesson is not part of an active published course'; end if;
  -- Match roadmap ordering exactly, including UUID tie breakers.
  if not exists (select 1 from public.lesson_progress p
    where p.user_id = learner and p.lesson_id = p_lesson_id and p.status = 'completed')
    and exists (
      select 1 from public.lessons l join public.units u on u.id = l.unit_id
      where u.course_id = course and u.is_published and l.is_published
        and (u.unit_order, u.id, l.lesson_order, l.id)
          < (unit_position, unit_uuid, lesson_position, p_lesson_id)
        and not exists (select 1 from public.lesson_progress p
          where p.user_id = learner and p.lesson_id = l.id and p.status = 'completed')
    ) then raise exception 'This lesson is still locked'; end if;
  return course;
end;
$$;
revoke all on function public.acelingua_lesson_course(uuid) from public, anon, authenticated;

create or replace function public.acelingua_start_lesson(p_lesson_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare learner uuid := auth.uid(); course uuid; previous_status text;
begin
  course := public.acelingua_lesson_course(p_lesson_id);
  perform pg_advisory_xact_lock(hashtextextended(learner::text || ':' || course::text, 0));
  -- Recheck after acquiring the lock in case another session finished a lesson.
  perform public.acelingua_lesson_course(p_lesson_id);
  select status into previous_status from public.lesson_progress
    where user_id = learner and lesson_id = p_lesson_id;
  insert into public.lesson_progress as existing(user_id, lesson_id, status, attempts, last_accessed_at)
    values (learner, p_lesson_id, 'in_progress', 1, now())
  on conflict (user_id, lesson_id) do update set
    status = case when existing.status = 'completed' then 'completed' else 'in_progress' end,
    attempts = existing.attempts + 1, last_accessed_at = now(), updated_at = now();
  return jsonb_build_object('replay', coalesce(previous_status = 'completed', false));
end;
$$;
revoke all on function public.acelingua_start_lesson(uuid) from public, anon;
grant execute on function public.acelingua_start_lesson(uuid) to authenticated;

create or replace function public.acelingua_complete_lesson(p_lesson_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid(); course uuid; previous_status text;
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
  -- Current content is vocabulary-only. Do not silently skip unfinished
  -- activities or pretend unsupported question types have been assessed.
  if exists (select 1 from public.activities where lesson_id = p_lesson_id) then
    raise exception 'Activity assessment is not available for this lesson yet';
  end if;
  if not exists (select 1 from public.vocabulary where lesson_id = p_lesson_id) then
    raise exception 'This lesson has no learning content yet';
  end if;
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
    'completed_lessons', completed, 'total_lessons', total);
end;
$$;
revoke all on function public.acelingua_complete_lesson(uuid) from public, anon;
grant execute on function public.acelingua_complete_lesson(uuid) to authenticated;

-- Ownership reads only. Writes for this flow are exclusively through the RPCs.
do $policies$
declare t text; policy_name text;
begin
  foreach t in array array['lesson_progress', 'activity_progress', 'question_answers', 'xp_transactions', 'coin_transactions'] loop
    policy_name := 'authenticated_lesson_read_own';
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = policy_name) then
      execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', policy_name, t);
    end if;
  end loop;
  foreach t in array array['activities', 'questions'] loop
    policy_name := 'authenticated_published_lesson_read';
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = policy_name) then
      if t = 'activities' then
        execute 'create policy authenticated_published_lesson_read on public.activities for select to authenticated using (exists (select 1 from public.lessons l join public.units u on u.id = l.unit_id join public.courses c on c.id = u.course_id where l.id = lesson_id and l.is_published and u.is_published and c.is_published))';
      else
        execute 'create policy authenticated_published_lesson_read on public.questions for select to authenticated using (exists (select 1 from public.activities a where a.id = activity_id))';
      end if;
    end if;
  end loop;
end;
$policies$;
commit;
