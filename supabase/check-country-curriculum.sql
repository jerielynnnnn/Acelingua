-- Read-only audit for Supabase SQL Editor. No learner identities or answers.
-- Unlike anonymous REST discovery, the SQL Editor can inspect unpublished rows.
select lang.code,c.id,c.title,c.level,c.is_published,
 count(distinct u.id) as units,count(distinct l.id) as lessons,
 count(distinct l.id) filter(where l.is_published) as published_lessons
from public.languages lang join public.courses c on c.language_id=lang.id
left join public.units u on u.course_id=c.id left join public.lessons l on l.unit_id=u.id
group by lang.code,c.id,c.title,c.level,c.is_published order by lang.code,c.level,c.id;

select lang.code,u.id as unit_id,u.title,u.unit_order,u.is_published,l.id as lesson_id,l.title as lesson_title,l.lesson_order,l.is_published as lesson_published,
 (select count(*) from public.vocabulary v where v.lesson_id=l.id) as words,
 (select count(*) from public.activities a where a.lesson_id=l.id) as activities,
 (select count(*) from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=l.id) as questions,
 (select count(*) from public.lesson_progress p where p.lesson_id=l.id and p.status='completed') as completions
from public.languages lang join public.courses c on c.language_id=lang.id
join public.units u on u.course_id=c.id left join public.lessons l on l.unit_id=u.id
order by lang.code,c.id,u.unit_order,u.id,l.lesson_order,l.id;

select u.course_id,u.unit_order,count(*) from public.units u group by u.course_id,u.unit_order having count(*)>1;
select l.unit_id,l.lesson_order,count(*) from public.lessons l group by l.unit_id,l.lesson_order having count(*)>1;
select l.unit_id,lower(btrim(l.title)),count(*) from public.lessons l group by l.unit_id,lower(btrim(l.title)) having count(*)>1;
select v.lesson_id,v.word,count(*) from public.vocabulary v group by v.lesson_id,v.word having count(*)>1;

select u.id,u.title,c.title as course,lang.code
from public.units u join public.courses c on c.id=u.course_id join public.languages lang on lang.id=c.language_id
where u.is_published and c.is_published and not exists(select 1 from public.travel_country_units cu where cu.unit_id=u.id);
select cu.country_id,cu.unit_id from public.travel_country_units cu join public.units u on u.id=cu.unit_id
join public.courses c on c.id=u.course_id where not exists(select 1 from public.travel_country_languages cl where cl.country_id=cu.country_id and cl.language_id=c.language_id);

select q.id,q.question_type,q.question_text from public.questions q
where btrim(coalesce(q.correct_answer,''))='' or btrim(coalesce(q.question_text,''))=''
or q.question_type not in ('multiple_choice','true_false','translation')
or (q.question_type in ('multiple_choice','true_false') and (jsonb_typeof(q.options)<>'array' or not q.options @> jsonb_build_array(q.correct_answer)));

select lang.code,w.slug,w.title,w.is_published from public.writing_studio_lessons w join public.languages lang on lang.id=w.language_id order by lang.code,w.display_order;
select lang.code,s.* from public.writing_systems s join public.languages lang on lang.id=s.language_id;
select schemaname,tablename,policyname,cmd,roles,qual,with_check from pg_policies where schemaname='public'
and tablename in('lesson_progress','course_progress','question_answers','travel_visits','user_passport_stamps');
select r.rolname,has_table_privilege(r.oid,'public.lesson_progress','INSERT') as insert_progress,
has_table_privilege(r.oid,'public.lesson_progress','UPDATE') as update_progress,
has_table_privilege(r.oid,'public.user_passport_stamps','INSERT') as insert_stamps
from pg_roles r where r.rolname in('anon','authenticated');
