-- PROPOSED / NOT APPLIED. Review and approve before running.
-- Requires travel 005/006 and assessed completion 202610060005.
begin;
create table public.travel_unit_curriculum (
 unit_id uuid primary key references public.units(id),
 slug text not null,
 cultural_introduction text not null,
 learning_objectives jsonb not null check(jsonb_typeof(learning_objectives)='array'),
 challenge_lesson_id uuid not null references public.lessons(id),
 estimated_minutes integer not null default 35 check(estimated_minutes between 5 and 120),
 writing_recommendation text,
 unique(slug,unit_id)
);
alter table public.travel_unit_curriculum enable row level security;
revoke all on public.travel_unit_curriculum from public,anon,authenticated;
grant select on public.travel_unit_curriculum to authenticated;
grant all on public.travel_unit_curriculum to service_role;
create policy travel_curriculum_read on public.travel_unit_curriculum for select to authenticated
 using(exists(select 1 from public.units u join public.courses c on c.id=u.course_id where u.id=unit_id and u.is_published and c.is_published));

create function public.acelingua_course_has_arrival(p_course_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(
  select 1 from public.courses course join public.travel_country_languages cl on cl.language_id=course.language_id
  join public.travel_countries country on country.id=cl.country_id and country.is_active
  join public.travel_visits visit on visit.country_id=country.id and visit.user_id=auth.uid() and visit.introduction_completed_at is not null
  where course.id=p_course_id and (
   not exists(select 1 from public.travel_country_units cu join public.units u on u.id=cu.unit_id where u.course_id=course.id)
   or exists(select 1 from public.travel_country_units cu join public.units u on u.id=cu.unit_id where u.course_id=course.id and cu.country_id=country.id)
  )
 );
$$;
revoke all on function public.acelingua_course_has_arrival(uuid) from public,anon,authenticated;

-- Shared validation is called by BOTH start and assessed completion RPCs.
create or replace function public.acelingua_lesson_course(p_lesson_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); course uuid; unit_position integer; lesson_position integer; unit_uuid uuid;
begin
 if learner is null then raise exception 'Sign in to open a lesson'; end if;
 select u.course_id,u.unit_order,l.lesson_order,u.id into course,unit_position,lesson_position,unit_uuid
 from public.lessons l join public.units u on u.id=l.unit_id join public.courses c on c.id=u.course_id
 join public.languages lang on lang.id=c.language_id
 where l.id=p_lesson_id and l.is_published and u.is_published and c.is_published and lang.is_active
 and exists(select 1 from public.user_courses e where e.user_id=learner and e.course_id=c.id and e.status='active');
 if course is null then raise exception 'Lesson is not part of an active published course'; end if;
 if not public.acelingua_course_has_arrival(course) then raise exception 'Complete your country arrival before opening lessons'; end if;
 -- A recorded historical completion remains reviewable even after reordering.
 if not exists(select 1 from public.lesson_progress p where p.user_id=learner and p.lesson_id=p_lesson_id and p.status='completed')
 and exists(select 1 from public.lessons l join public.units u on u.id=l.unit_id
 where u.course_id=course and u.is_published and l.is_published
 and (u.unit_order,u.id,l.lesson_order,l.id)<(unit_position,unit_uuid,lesson_position,p_lesson_id)
 and not exists(select 1 from public.lesson_progress p where p.user_id=learner and p.lesson_id=l.id and p.status='completed'))
 then raise exception 'This lesson is still locked'; end if;
 return course;
end;
$$;
revoke all on function public.acelingua_lesson_course(uuid) from public,anon,authenticated;
-- Do not rely on permissive legacy policies to protect authoritative progress.
revoke insert,update,delete on public.lesson_progress,public.activity_progress,public.question_answers from public,anon,authenticated;

create function public.acelingua_refresh_country_stamps(p_course_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); inserted integer:=0; n integer;
begin
 if learner is null then raise exception 'Sign in to collect stamps'; end if;
 if not exists(select 1 from public.user_courses e join public.courses c on c.id=e.course_id
   where e.user_id=learner and e.course_id=p_course_id and e.status='active' and c.is_published)
 or not public.acelingua_course_has_arrival(p_course_id) then raise exception 'Arrive and enroll before collecting destination stamps'; end if;
 insert into public.user_passport_stamps(user_id,stamp_id)
 select learner,d.id from public.passport_stamp_definitions d
 join public.travel_countries country on country.id=d.country_id and country.is_active
 join public.travel_country_units cu on cu.country_id=d.country_id and cu.unit_id=d.unit_id
 join public.units u on u.id=cu.unit_id and u.is_published and u.course_id=p_course_id
 join public.courses c on c.id=u.course_id and c.is_published
 join public.travel_country_languages cl on cl.country_id=d.country_id and cl.language_id=c.language_id
 join public.travel_unit_curriculum meta on meta.unit_id=u.id
 where d.is_active and d.requirement_type='unit_completion'
 and exists(select 1 from public.travel_visits v where v.user_id=learner and v.country_id=d.country_id and v.introduction_completed_at is not null)
 and exists(select 1 from public.lessons challenge join public.lesson_progress p on p.lesson_id=challenge.id
   where challenge.id=meta.challenge_lesson_id and challenge.unit_id=u.id and challenge.is_published and p.user_id=learner and p.status='completed')
 and not exists(select 1 from public.lessons l where l.unit_id=u.id and l.is_published
   and not exists(select 1 from public.lesson_progress p where p.user_id=learner and p.lesson_id=l.id and p.status='completed'))
 on conflict(user_id,stamp_id) do nothing;
 get diagnostics n=row_count; inserted:=inserted+n;
 insert into public.user_passport_stamps(user_id,stamp_id)
 select learner,d.id from public.passport_stamp_definitions d join public.travel_countries country on country.id=d.country_id and country.is_active
 where d.is_active and d.requirement_type='country_completion'
 and exists(select 1 from public.travel_visits v where v.user_id=learner and v.country_id=d.country_id and v.introduction_completed_at is not null)
 and exists(select 1 from public.travel_country_units cu join public.units u on u.id=cu.unit_id where cu.country_id=d.country_id and cu.is_required and u.course_id=p_course_id)
 and not exists(select 1 from public.travel_country_units cu left join public.units u on u.id=cu.unit_id
   left join public.courses c on c.id=u.course_id left join public.travel_unit_curriculum meta on meta.unit_id=u.id
   where cu.country_id=d.country_id and cu.is_required and (
    u.id is null or not u.is_published or not c.is_published or meta.unit_id is null
    or not exists(select 1 from public.travel_country_languages cl where cl.country_id=d.country_id and cl.language_id=c.language_id)
    or not exists(select 1 from public.user_courses e where e.user_id=learner and e.course_id=c.id and e.status='active')
    or not exists(select 1 from public.lessons l where l.unit_id=u.id and l.is_published)
    or not exists(select 1 from public.lessons l join public.lesson_progress p on p.lesson_id=l.id where l.id=meta.challenge_lesson_id and l.unit_id=u.id and l.is_published and p.user_id=learner and p.status='completed')
    or exists(select 1 from public.lessons l where l.unit_id=u.id and l.is_published and not exists(select 1 from public.lesson_progress p where p.user_id=learner and p.lesson_id=l.id and p.status='completed'))
   ))
 on conflict(user_id,stamp_id) do nothing;
 get diagnostics n=row_count; return inserted+n;
end;
$$;
revoke all on function public.acelingua_refresh_country_stamps(uuid) from public,anon;
grant execute on function public.acelingua_refresh_country_stamps(uuid) to authenticated;

-- A destination challenge needs at least 80% server-graded answers in this
-- attempt. Raising aborts the existing atomic XP/coin completion transaction.
create function public.acelingua_guard_destination_challenge()
returns trigger language plpgsql security definer set search_path='' as $$
declare total integer; correct integer;
begin
 if new.status<>'completed' or (tg_op='UPDATE' and old.status='completed') then return new; end if;
 if auth.uid() is null then return new; end if;
 if new.user_id<>auth.uid() then raise exception 'Invalid lesson owner'; end if;
 perform public.acelingua_lesson_course(new.lesson_id);
 if exists(select 1 from public.travel_unit_curriculum where challenge_lesson_id=new.lesson_id) then
  select count(*),count(*) filter(where a.is_correct) into total,correct
  from public.questions q join public.activities activity on activity.id=q.activity_id
  left join public.question_answers a on a.id=md5(new.user_id::text||':'||new.lesson_id::text||':'||new.attempts::text||':'||q.id::text)::uuid
   and a.user_id=new.user_id and a.question_id=q.id
  where activity.lesson_id=new.lesson_id;
  if total=0 or correct*100<total*80 then raise exception 'Destination challenge needs 80 percent correct. Review the phrases and retry the lesson.'; end if;
 end if;
 return new;
end;
$$;
revoke all on function public.acelingua_guard_destination_challenge() from public,anon,authenticated;
create trigger travel_challenge_guard before insert or update of status on public.lesson_progress
 for each row execute function public.acelingua_guard_destination_challenge();
create function public.acelingua_award_destination_after_lesson()
returns trigger language plpgsql security definer set search_path='' as $$
declare course uuid;
begin
 if new.status='completed' and auth.uid()=new.user_id and (tg_op='INSERT' or old.status is distinct from 'completed') then
  select u.course_id into course from public.lessons l join public.units u on u.id=l.unit_id where l.id=new.lesson_id;
  perform public.acelingua_refresh_country_stamps(course);
 end if;
 return new;
end;
$$;
revoke all on function public.acelingua_award_destination_after_lesson() from public,anon,authenticated;
create trigger travel_destination_reward after insert or update of status on public.lesson_progress
 for each row execute function public.acelingua_award_destination_after_lesson();
commit;
