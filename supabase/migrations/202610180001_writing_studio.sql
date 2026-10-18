-- REVIEW ONLY: additive Writing Studio schema. Do not execute without approval.
begin;

create table public.writing_systems (
  id uuid primary key default gen_random_uuid(),
  language_id uuid not null references public.languages(id) on delete restrict,
  name text not null, slug text not null check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '', display_order integer not null default 0,
  is_published boolean not null default false,
  unique(language_id, slug)
);
create table public.writing_characters (
  id uuid primary key default gen_random_uuid(),
  writing_system_id uuid not null references public.writing_systems(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9-]+$'), character text not null,
  romanization text not null, meaning text,
  group_name text not null default 'Characters', example_word text, example_translation text, note text,
  stroke_count integer check(stroke_count > 0), stroke_data jsonb, audio_url text,
  display_order integer not null default 0, is_published boolean not null default false,
  unique(writing_system_id, slug), unique(writing_system_id, character),
  check (stroke_data is null or coalesce((stroke_count is not null and jsonb_typeof(stroke_data) = 'object'
    and jsonb_typeof(stroke_data->'paths') = 'array'
    and stroke_count = jsonb_array_length(stroke_data->'paths')), false))
);
create table public.user_character_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  character_id uuid not null references public.writing_characters(id) on delete restrict,
  status text not null default 'learning' check(status in ('learning','learned','mastered')),
  practice_count integer not null default 0 check(practice_count >= 0),
  mastery_score integer not null default 0 check(mastery_score between 0 and 100),
  last_practiced_at timestamptz, mastered_at timestamptz,
  unique(user_id, character_id)
);
create index writing_characters_system_order on public.writing_characters(writing_system_id, display_order);
create index writing_systems_language_order on public.writing_systems(language_id, display_order);
create index user_character_progress_owner_status on public.user_character_progress(user_id, status);

alter table public.writing_systems enable row level security;
alter table public.writing_characters enable row level security;
alter table public.user_character_progress enable row level security;
revoke all on public.writing_systems, public.writing_characters, public.user_character_progress from anon, authenticated;
grant select on public.writing_systems, public.writing_characters to anon, authenticated;
grant select, insert, update, delete on public.user_character_progress to authenticated;
grant all on public.writing_systems, public.writing_characters, public.user_character_progress to service_role;

create policy writing_systems_published on public.writing_systems for select to anon, authenticated using(is_published);
create policy writing_characters_published on public.writing_characters for select to anon, authenticated
  using(is_published and exists(select 1 from public.writing_systems s where s.id=writing_system_id and s.is_published));
create policy writing_progress_owner on public.user_character_progress for all to authenticated
  using((select auth.uid())=user_id)
  with check((select auth.uid())=user_id and exists(select 1 from public.writing_characters c where c.id=character_id and c.is_published));

-- Recall mastery is separate from handwriting accuracy, lesson progress, and rewards.
create function public.record_writing_practice(p_character_id uuid, p_correct boolean, p_traced boolean)
returns public.user_character_progress language plpgsql security invoker set search_path='' as $$
declare result public.user_character_progress; gain integer;
begin
  if auth.uid() is null then raise exception 'Sign in to save writing progress'; end if;
  if p_correct is null or p_traced is null then raise exception 'Missing practice result'; end if;
  if not exists(select 1 from public.writing_characters where id=p_character_id and is_published)
    then raise exception 'Character unavailable'; end if;
  gain := case when p_correct and p_traced then 25 else 0 end;
  insert into public.user_character_progress(user_id,character_id,status,practice_count,mastery_score,last_practiced_at)
    values(auth.uid(),p_character_id,case when gain>0 then 'learned' else 'learning' end,1,gain,now())
  on conflict(user_id,character_id) do update set
    practice_count=public.user_character_progress.practice_count+1,
    mastery_score=least(100,public.user_character_progress.mastery_score+gain),
    status=case when public.user_character_progress.mastery_score+gain>=100 then 'mastered'
      when public.user_character_progress.mastery_score+gain>0 then 'learned' else 'learning' end,
    last_practiced_at=now(),
    mastered_at=case when public.user_character_progress.mastery_score+gain>=100
      then coalesce(public.user_character_progress.mastered_at,now()) else null end
  returning * into result;
  return result;
end;
$$;
revoke all on function public.record_writing_practice(uuid,boolean,boolean) from public,anon;
grant execute on function public.record_writing_practice(uuid,boolean,boolean) to authenticated;
commit;
