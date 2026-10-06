-- Allow guests to preview only the first published lesson of the earliest
-- published course for each active language. No guest writes or answer keys.
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
  cross join lateral (
    select units.id from public.units
    where units.course_id = c.id and units.is_published
    order by units.unit_order, units.id limit 1
  ) u
  cross join lateral (
    select lessons.id from public.lessons
    where lessons.unit_id = u.id and lessons.is_published
    order by lessons.lesson_order, lessons.id limit 1
  ) lesson
  where lang.is_active;
$$;

revoke all on function public.guest_first_lesson_ids() from public;
grant execute on function public.guest_first_lesson_ids() to anon;
grant select on public.languages, public.courses, public.units, public.lessons, public.vocabulary to anon;

alter table public.languages enable row level security;
alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.lessons enable row level security;
alter table public.vocabulary enable row level security;

drop policy if exists guest_active_languages on public.languages;
create policy guest_active_languages on public.languages for select to anon
using (is_active);
drop policy if exists guest_intro_courses on public.courses;
create policy guest_intro_courses on public.courses for select to anon
using (id in (select course_id from public.guest_first_lesson_ids()));
drop policy if exists guest_intro_units on public.units;
create policy guest_intro_units on public.units for select to anon
using (id in (select unit_id from public.guest_first_lesson_ids()));
drop policy if exists guest_intro_lessons on public.lessons;
create policy guest_intro_lessons on public.lessons for select to anon
using (id in (select lesson_id from public.guest_first_lesson_ids()));
drop policy if exists guest_intro_vocabulary on public.vocabulary;
create policy guest_intro_vocabulary on public.vocabulary for select to anon
using (lesson_id in (select lesson_id from public.guest_first_lesson_ids()));

-- Restrictive guards keep existing broad SELECT policies from exposing later
-- lessons to guests. Authenticated learners retain access to published content.
drop policy if exists guest_active_language_guard on public.languages;
create policy guest_active_language_guard on public.languages as restrictive for select to anon
using (is_active);
drop policy if exists guest_intro_course_guard on public.courses;
create policy guest_intro_course_guard on public.courses as restrictive for select to anon
using (id in (select course_id from public.guest_first_lesson_ids()));
drop policy if exists guest_intro_unit_guard on public.units;
create policy guest_intro_unit_guard on public.units as restrictive for select to anon
using (id in (select unit_id from public.guest_first_lesson_ids()));
drop policy if exists guest_intro_lesson_guard on public.lessons;
create policy guest_intro_lesson_guard on public.lessons as restrictive for select to anon
using (id in (select lesson_id from public.guest_first_lesson_ids()));
drop policy if exists guest_intro_vocabulary_guard on public.vocabulary;
create policy guest_intro_vocabulary_guard on public.vocabulary as restrictive for select to anon
using (lesson_id in (select lesson_id from public.guest_first_lesson_ids()));

grant select on public.languages, public.courses, public.units, public.lessons, public.vocabulary to authenticated;
drop policy if exists learner_active_languages on public.languages;
create policy learner_active_languages on public.languages for select to authenticated using (is_active);
drop policy if exists learner_published_courses on public.courses;
create policy learner_published_courses on public.courses for select to authenticated
using (is_published and language_id in (select id from public.languages where is_active));
drop policy if exists learner_published_units on public.units;
create policy learner_published_units on public.units for select to authenticated
using (is_published and course_id in (select id from public.courses where is_published));
drop policy if exists learner_published_lessons on public.lessons;
create policy learner_published_lessons on public.lessons for select to authenticated
using (is_published and unit_id in (select id from public.units where is_published));
drop policy if exists learner_published_vocabulary on public.vocabulary;
create policy learner_published_vocabulary on public.vocabulary for select to authenticated
using (lesson_id in (select id from public.lessons where is_published));

commit;
