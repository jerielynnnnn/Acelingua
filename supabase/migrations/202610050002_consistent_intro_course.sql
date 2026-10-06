-- Keep course metadata visible even before its lessons are published, and
-- choose the same first playable unit as the shared course/lesson frontend.
begin;

create or replace function public.guest_first_lesson_ids()
returns table(course_id uuid, unit_id uuid, lesson_id uuid)
language sql stable security definer
set search_path = ''
as $$
  select c.id, u.id, lesson.id
  from public.languages lang
  cross join lateral (
    select courses.id from public.courses
    where courses.language_id = lang.id and courses.is_published
    order by courses.created_at, courses.id limit 1
  ) c
  left join lateral (
    select units.id from public.units
    where units.course_id = c.id and units.is_published
      and exists (
        select 1 from public.lessons
        where lessons.unit_id = units.id and lessons.is_published
      )
    order by units.unit_order, units.id limit 1
  ) u on true
  left join lateral (
    select lessons.id from public.lessons
    where lessons.unit_id = u.id and lessons.is_published
    order by lessons.lesson_order, lessons.id limit 1
  ) lesson on true
  where lang.is_active;
$$;

revoke all on function public.guest_first_lesson_ids() from public;
grant execute on function public.guest_first_lesson_ids() to anon;

commit;
