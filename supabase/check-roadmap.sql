-- Read-only verification. Use your enrolled learner UUID in place of the
-- placeholder; SQL Editor does not automatically share the browser session.
-- This exposes only this learner's selected course/progress. No writes.
with enrolled as (
  select course_id from public.user_courses
  where user_id = 'REPLACE_WITH_LEARNER_UUID'::uuid and status = 'active'
)
select c.id as course_id, c.title as course_title, lang.name as language,
  u.id as unit_id, u.unit_order, u.title as unit_title,
  u.location_name, u.map_x, u.map_y,
  l.id as lesson_id, l.lesson_order, l.title as lesson_title,
  coalesce(p.status, 'not_started') as lesson_status
from enrolled e
join public.courses c on c.id = e.course_id
join public.languages lang on lang.id = c.language_id
left join public.units u on u.course_id = c.id and u.is_published
left join public.lessons l on l.unit_id = u.id and l.is_published
left join public.lesson_progress p on p.lesson_id = l.id
  and p.user_id = 'REPLACE_WITH_LEARNER_UUID'::uuid
order by c.title, c.id, u.unit_order, u.id, l.lesson_order, l.id;
