-- READ ONLY. Run manually in the Supabase SQL Editor for full coverage beyond
-- the anonymous first-lesson policy. No learner data or credentials are read.
select lang.code, lang.name, c.id as course_id, c.title, c.is_published,
  (select count(*) from public.units u where u.course_id = c.id and u.is_published) as published_units,
  (select count(*) from public.lessons l join public.units u on u.id = l.unit_id
    where u.course_id = c.id and u.is_published and l.is_published) as published_lessons,
  (select count(*) from public.vocabulary v join public.lessons l on l.id = v.lesson_id
    join public.units u on u.id = l.unit_id where u.course_id = c.id and u.is_published and l.is_published) as published_vocabulary,
  (select count(*) from public.vocabulary v join public.lessons l on l.id = v.lesson_id
    join public.units u on u.id = l.unit_id where u.course_id = c.id and u.is_published and l.is_published
      and nullif(btrim(v.pronunciation), '') is null) as vocabulary_without_pronunciation,
  (select count(*) from public.activities a join public.lessons l on l.id = a.lesson_id
    join public.units u on u.id = l.unit_id where u.course_id = c.id and u.is_published and l.is_published) as published_activities,
  (select count(*) from public.questions q join public.activities a on a.id = q.activity_id
    join public.lessons l on l.id = a.lesson_id join public.units u on u.id = l.unit_id
    where u.course_id = c.id and u.is_published and l.is_published) as published_questions,
  (select count(*) from public.questions q join public.activities a on a.id = q.activity_id
    join public.lessons l on l.id = a.lesson_id join public.units u on u.id = l.unit_id
    where u.course_id = c.id and u.is_published and l.is_published
      and q.question_type not in ('multiple_choice', 'true_false', 'translation')) as questions_needing_assessment_extension
from public.languages lang left join public.courses c on c.language_id = lang.id
where lang.is_active order by lang.name, c.title;

-- Published lessons with no vocabulary or questions must not appear playable.
select lang.code, c.id as course_id, l.id as lesson_id, l.title,
  (select count(*) from public.vocabulary v where v.lesson_id = l.id) as vocabulary,
  (select count(*) from public.activities a where a.lesson_id = l.id) as activities,
  (select count(*) from public.questions q join public.activities a on a.id = q.activity_id where a.lesson_id = l.id) as questions
from public.lessons l join public.units u on u.id = l.unit_id
join public.courses c on c.id = u.course_id join public.languages lang on lang.id = c.language_id
where lang.is_active and c.is_published and u.is_published and l.is_published
order by lang.code, c.id, u.unit_order, u.id, l.lesson_order, l.id;
