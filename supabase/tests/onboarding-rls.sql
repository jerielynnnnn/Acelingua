-- Run in Supabase SQL Editor AFTER reviewing/applying the ownership migration.
-- Requires two existing normal test accounts and one published active-language course.
-- All test writes are rolled back. No real lesson progress, XP, or coins are written.
begin;

do $test$
declare
  learner_id uuid;
  other_id uuid;
  selected_course uuid;
  lesson_count integer;
  row_count integer;
  pass integer;
begin
  -- Use accounts with profiles so existing user_id foreign keys are satisfied.
  select id into learner_id from public.profiles order by id limit 1;
  select id into other_id from public.profiles where id <> learner_id order by id limit 1;
  select c.id into selected_course from public.courses c
  join public.languages l on l.id = c.language_id
  where c.is_published and l.is_active
  order by (lower(trim(c.level::text)) = 'beginner') desc nulls last, c.created_at, c.id limit 1;
  if learner_id is null or other_id is null or selected_course is null then
    raise exception 'Validation requires two existing accounts with profiles and a published course';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.user_courses'::regclass)
    or not (select relrowsecurity from pg_class where oid = 'public.course_progress'::regclass) then
    raise exception 'RLS must remain enabled on both tables';
  end if;

  perform set_config('request.jwt.claim.sub', learner_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', learner_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
  if current_user <> 'authenticated' or auth.uid() is distinct from learner_id then
    raise exception 'Validation is not running as the intended authenticated learner';
  end if;
  select count(*) into lesson_count from public.lessons l
  join public.units u on u.id = l.unit_id
  where u.course_id = selected_course and u.is_published and l.is_published;

  -- Same conflict strategy as the continuation helper; existing progress is preserved.
  for pass in 1..2 loop
    insert into public.user_courses (user_id, course_id, status)
      values (learner_id, selected_course, 'active')
      on conflict (user_id, course_id) do nothing;
    insert into public.course_progress
      (user_id, course_id, completed_lessons, total_lessons, progress_percentage)
      values (learner_id, selected_course, 0, lesson_count, 0)
      on conflict (user_id, course_id) do nothing;
  end loop;
  select count(*) into row_count from public.user_courses
    where user_id = learner_id and course_id = selected_course;
  if row_count <> 1 then raise exception 'Enrollment retry did not produce exactly one owned row'; end if;
  select count(*) into row_count from public.course_progress
    where user_id = learner_id and course_id = selected_course;
  if row_count <> 1 then raise exception 'Progress retry did not produce exactly one owned row'; end if;

  -- INSERT and ownership-changing UPDATE must fail, even if another permissive
  -- policy exists. The deliberate exceptions below are NOT caught as RLS failures.
  begin
    insert into public.user_courses (user_id, course_id, status)
      values (other_id, selected_course, 'active');
    raise exception 'SECURITY FAILURE: another learner enrollment insert was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.course_progress
      (user_id, course_id, completed_lessons, total_lessons, progress_percentage)
      values (other_id, selected_course, 0, lesson_count, 0);
    raise exception 'SECURITY FAILURE: another learner progress insert was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.user_courses set user_id = other_id
      where user_id = learner_id and course_id = selected_course;
    raise exception 'SECURITY FAILURE: enrollment ownership change was allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.course_progress set user_id = other_id
      where user_id = learner_id and course_id = selected_course;
    raise exception 'SECURITY FAILURE: progress ownership change was allowed';
  exception when insufficient_privilege then null;
  end;

  -- As the second account, the first learner's known rows must be invisible.
  perform set_config('request.jwt.claim.sub', other_id::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', other_id, 'role', 'authenticated')::text, true);
  select count(*) into row_count from public.user_courses where user_id = learner_id;
  if row_count <> 0 then raise exception 'SECURITY FAILURE: another learner enrollment was visible'; end if;
  select count(*) into row_count from public.course_progress where user_id = learner_id;
  if row_count <> 0 then raise exception 'SECURITY FAILURE: another learner progress was visible'; end if;
  update public.user_courses set status = 'active' where user_id = learner_id;
  get diagnostics row_count = row_count;
  if row_count <> 0 then raise exception 'SECURITY FAILURE: another learner enrollment was updated'; end if;
  update public.course_progress set progress_percentage = 0 where user_id = learner_id;
  get diagnostics row_count = row_count;
  if row_count <> 0 then raise exception 'SECURITY FAILURE: another learner progress was updated'; end if;
  raise notice 'PASS: own enrollment/progress, retries, and cross-user isolation; all test writes will roll back';
end;
$test$;

rollback;
