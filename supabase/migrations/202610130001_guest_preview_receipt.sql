-- Preview-only rules: retain results; never complete a curriculum lesson or
-- award permanent currency from client-scored guest answers. No new tables.
begin;
create or replace function public.acelingua_save_guest_preview(p_preview jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid();
  course uuid; lesson uuid; lang uuid;
  metadata jsonb; receipt jsonb;
begin
  if learner is null then raise exception 'Sign in to save a preview'; end if;
  if p_preview->>'version' is distinct from '1' or p_preview->>'source' is distinct from 'guest_preview'
    or p_preview->>'completed' is distinct from 'true'
    or jsonb_typeof(p_preview->'answers') is distinct from 'array'
    or jsonb_array_length(p_preview->'answers') not between 1 and 100
    or octet_length(p_preview::text) > 60000 then
    raise exception 'Invalid preview';
  end if;
  if exists (select 1 from jsonb_array_elements(p_preview->'answers') a
    where jsonb_typeof(a->'id') is distinct from 'string'
      or jsonb_typeof(a->'answer') is distinct from 'string'
      or jsonb_typeof(a->'correct') is distinct from 'boolean'
      or coalesce(a->>'kind', '') not in ('practice', 'quiz', 'game')) then
    raise exception 'Invalid preview answers';
  end if;
  course := (p_preview->>'courseId')::uuid;
  lesson := (p_preview->>'lessonId')::uuid;
  lang := (p_preview->>'languageId')::uuid;
  if not exists (
    select 1 from public.lessons l join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    join public.languages language on language.id = c.language_id
    where l.id = lesson and c.id = course and language.id = lang
      and language.code = p_preview->>'languageCode'
      and l.is_published and u.is_published and c.is_published and language.is_active
      and exists (select 1 from public.user_courses e where e.user_id = learner and e.course_id = course)
      and not exists (select 1 from public.lessons earlier join public.units eu on eu.id = earlier.unit_id
        where eu.course_id = course and eu.is_published and earlier.is_published
          and (eu.unit_order, eu.id, earlier.lesson_order, earlier.id) < (u.unit_order, u.id, l.lesson_order, l.id))
  ) then raise exception 'Preview is not the enrolled introductory lesson'; end if;
  select coalesce(raw_user_meta_data, '{}'::jsonb) into metadata from auth.users where id = learner for update;
  receipt := nullif(metadata->'acelingua_preview_result', 'null'::jsonb);
  -- One preview receipt per account; retries cannot overwrite older saved work.
  if receipt is null then
    receipt := p_preview || jsonb_build_object('ownerId', learner, 'savedAt', now(), 'accountXp', 0, 'accountCoins', 0, 'rewardPolicy', 'preview_only');
  end if;
  update auth.users set raw_user_meta_data = metadata || jsonb_build_object(
    'acelingua_preview_result', receipt, 'acelingua_guest_preview', null)
    where id = learner;
  return receipt;
end;
$$;
revoke all on function public.acelingua_save_guest_preview(jsonb) from public, anon;
grant execute on function public.acelingua_save_guest_preview(jsonb) to authenticated;
commit;
