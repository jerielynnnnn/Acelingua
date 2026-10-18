-- REVIEW ONLY: additive extension. Apply after 202610180001_writing_studio.sql.
-- No ordinary lessons, activities, questions, rewards, or constraints are changed.
begin;
create table public.writing_studio_lessons (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages(id) on delete restrict,
  slug text not null check(slug ~ '^[a-z0-9-]+$'), title text not null,
  stage text not null, description text not null default '',
  blocks jsonb not null default '[]' check(jsonb_typeof(blocks)='array'),
  display_order integer not null default 0, is_published boolean not null default false,
  unique(language_id,slug)
);
create table public.writing_studio_activities (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.writing_studio_lessons(id) on delete restrict,
  character_id uuid references public.writing_characters(id) on delete restrict,
  slug text not null, kind text not null check(kind in ('choice','word','sentence','character')),
  definition jsonb not null check(jsonb_typeof(definition)='object'),
  display_order integer not null default 0, is_published boolean not null default false,
  unique(lesson_id,slug)
);
create table public.user_writing_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.writing_studio_lessons(id) on delete restrict,
  completed_activity_ids uuid[] not null default '{}',
  completed_at timestamptz, updated_at timestamptz not null default now(),
  unique(user_id,lesson_id)
);
create table public.user_sentence_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references public.writing_studio_activities(id) on delete restrict,
  response text not null check(length(response)<=1000),
  mode text not null check(mode in ('choice','tiles','typing','independent','handwriting')),
  is_correct boolean not null, created_at timestamptz not null default now()
);
create index writing_workbook_language_order on public.writing_studio_lessons(language_id,display_order);
create index writing_workbook_activity_order on public.writing_studio_activities(lesson_id,display_order);
create index writing_workbook_progress_owner on public.user_writing_lesson_progress(user_id,updated_at);
create index writing_sentence_attempt_owner on public.user_sentence_practice_attempts(user_id,activity_id,created_at);

alter table public.writing_studio_lessons enable row level security;
alter table public.writing_studio_activities enable row level security;
alter table public.user_writing_lesson_progress enable row level security;
alter table public.user_sentence_practice_attempts enable row level security;
revoke all on public.writing_studio_lessons,public.writing_studio_activities,public.user_writing_lesson_progress,public.user_sentence_practice_attempts from anon,authenticated;
grant select on public.writing_studio_lessons,public.writing_studio_activities to anon,authenticated;
grant select,insert,update on public.user_writing_lesson_progress to authenticated;
grant select,insert on public.user_sentence_practice_attempts to authenticated;
grant all on public.writing_studio_lessons,public.writing_studio_activities,public.user_writing_lesson_progress,public.user_sentence_practice_attempts to service_role;
create policy writing_workbook_published on public.writing_studio_lessons for select to anon,authenticated using(is_published);
create policy writing_workbook_activities_published on public.writing_studio_activities for select to anon,authenticated
  using(is_published and exists(select 1 from public.writing_studio_lessons l where l.id=lesson_id and l.is_published));
create policy writing_workbook_progress_owner on public.user_writing_lesson_progress for all to authenticated
  using((select auth.uid())=user_id)
  with check((select auth.uid())=user_id and exists(select 1 from public.writing_studio_lessons l where l.id=lesson_id and l.is_published));
create policy writing_sentence_attempt_select on public.user_sentence_practice_attempts for select to authenticated using((select auth.uid())=user_id);
create policy writing_sentence_attempt_insert on public.user_sentence_practice_attempts for insert to authenticated
  with check((select auth.uid())=user_id and exists(select 1 from public.writing_studio_activities a where a.id=activity_id and a.is_published));

-- Practice-only self-reported results, never used to award currencies or course XP.
create function public.record_writing_workbook_attempt(p_activity_id uuid,p_response text,p_correct boolean,p_mode text)
returns public.user_writing_lesson_progress language plpgsql security invoker set search_path='' as $$
declare target_lesson uuid; result public.user_writing_lesson_progress;
begin
  if auth.uid() is null then raise exception 'Sign in to save workbook progress'; end if;
  if p_response is null or length(p_response)>1000 or p_correct is null then raise exception 'Invalid practice response'; end if;
  if p_mode is null or p_mode not in ('choice','tiles','typing','independent','handwriting') then raise exception 'Invalid activity mode'; end if;
  select lesson_id into target_lesson from public.writing_studio_activities where id=p_activity_id and is_published;
  if target_lesson is null then raise exception 'Activity unavailable'; end if;
  insert into public.user_sentence_practice_attempts(user_id,activity_id,response,mode,is_correct)
    values(auth.uid(),p_activity_id,p_response,p_mode,p_correct);
  insert into public.user_writing_lesson_progress(user_id,lesson_id,completed_activity_ids)
    values(auth.uid(),target_lesson,case when p_correct then array[p_activity_id] else '{}'::uuid[] end)
  on conflict(user_id,lesson_id) do update set completed_activity_ids=
    case when p_correct and not(p_activity_id=any(public.user_writing_lesson_progress.completed_activity_ids))
      then array_append(public.user_writing_lesson_progress.completed_activity_ids,p_activity_id)
      else public.user_writing_lesson_progress.completed_activity_ids end,updated_at=now();
  update public.user_writing_lesson_progress p set completed_at=case
    when not exists(select 1 from public.writing_studio_activities a where a.lesson_id=target_lesson and a.is_published and not(a.id=any(p.completed_activity_ids)))
    then coalesce(p.completed_at,now()) else null end
    where p.user_id=auth.uid() and p.lesson_id=target_lesson returning * into result;
  return result;
end;
$$;
revoke all on function public.record_writing_workbook_attempt(uuid,text,boolean,text) from public,anon;
grant execute on function public.record_writing_workbook_attempt(uuid,text,boolean,text) to authenticated;
commit;
