-- Read-only checks: run in Supabase SQL Editor after the learning migrations.
-- The schema export does not show seeded rows, all indexes, or RLS policies.

-- 1. Actual course content. The starter seed adds 3 units / 6 lessons /
--    18 vocabulary items per supported course, in addition to existing content.
select lang.code, lang.name, course.id as course_id, course.title,
  course.is_published,
  count(distinct unit.id) filter (where unit.is_published) as published_units,
  count(distinct lesson.id) filter (where unit.is_published and lesson.is_published) as published_lessons,
  count(distinct word.id) filter (where unit.is_published and lesson.is_published) as vocabulary_items
from public.languages lang
left join public.courses course on course.language_id = lang.id
left join public.units unit on unit.course_id = course.id
left join public.lessons lesson on lesson.unit_id = unit.id
left join public.vocabulary word on word.lesson_id = lesson.id
group by lang.code, lang.name, course.id, course.title, course.is_published
order by lang.code, course.title;

-- 2. Indexes, including unique order rules omitted from the supplied export.
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('units', 'lessons', 'user_courses', 'lesson_progress', 'course_progress')
order by tablename, indexname;

-- 3. Whether row-level security is enabled on learning tables.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
  and relname in ('languages', 'courses', 'units', 'lessons', 'vocabulary',
    'user_courses', 'lesson_progress', 'course_progress')
order by relname;

-- 4. Content-read and learner-progress policies currently installed.
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('languages', 'courses', 'units', 'lessons', 'vocabulary',
    'user_courses', 'lesson_progress', 'course_progress')
order by tablename, policyname;

-- 5. Installed guest selector. Migration 002 uses LEFT JOIN LATERAL and
--    skips published units that do not have a published lesson yet.
select pg_get_functiondef(proc.oid) as installed_guest_selector
from pg_proc proc
join pg_namespace ns on ns.oid = proc.pronamespace
where ns.nspname = 'public' and proc.proname = 'guest_first_lesson_ids'
  and proc.pronargs = 0;
