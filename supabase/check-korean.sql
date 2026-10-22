-- READ ONLY. Run as a trusted database reviewer, before and after any approved seed.
-- Returns aggregate learner dependencies, never names, identities, or answers.
begin transaction read only;
select l.id,l.code,c.id as course_id,c.title,c.level,c.is_published,
 count(distinct u.id) as units,count(distinct s.id) as lessons,
 count(distinct s.id) filter(where s.is_published and u.is_published) as published_lessons
from public.languages l join public.courses c on c.language_id=l.id
left join public.units u on u.course_id=c.id left join public.lessons s on s.unit_id=u.id
where l.code='ko' group by l.id,l.code,c.id;

select u.id as unit_id,u.title,u.unit_order,u.location_name,u.is_published,
 l.id as lesson_id,l.title as lesson_title,l.lesson_order,l.is_published as published,
 (select count(*) from public.vocabulary v where v.lesson_id=l.id) as vocabulary,
 (select count(*) from public.activities a where a.lesson_id=l.id) as activities,
 (select count(*) from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=l.id) as questions,
 (select count(*) from public.lesson_progress p where p.lesson_id=l.id) as progress_dependencies,
 (select count(*) from public.lesson_progress p where p.lesson_id=l.id and p.status='completed') as historical_completions
from public.units u join public.courses c on c.id=u.course_id join public.languages lang on lang.id=c.language_id
left join public.lessons l on l.unit_id=u.id where lang.code='ko' order by u.unit_order,l.lesson_order;

select c.id as course_id,
 (select count(*) from public.user_courses e where e.course_id=c.id) as enrollments,
 (select count(*) from public.course_progress p where p.course_id=c.id) as progress_summaries
from public.courses c join public.languages l on l.id=c.language_id where l.code='ko';

select s.*, (select count(*) from public.writing_characters c where c.writing_system_id=s.id) as characters,
 (select count(*) from public.user_character_progress p join public.writing_characters c on c.id=p.character_id where c.writing_system_id=s.id) as character_progress_dependencies
from public.writing_systems s join public.languages l on l.id=s.language_id where l.code='ko';
select c.id,c.slug,c.character,c.stroke_data is not null as has_strokes,c.audio_url,c.is_published
from public.writing_characters c join public.writing_systems s on s.id=c.writing_system_id join public.languages l on l.id=s.language_id where l.code='ko';
select w.id,w.slug,w.title,w.is_published,
 (select count(*) from public.writing_studio_activities a where a.lesson_id=w.id) as activities,
 (select count(*) from public.user_writing_lesson_progress p where p.lesson_id=w.id) as progress_dependencies
from public.writing_studio_lessons w join public.languages l on l.id=w.language_id where l.code='ko' order by w.display_order;

select c.*,cl.language_id from public.travel_countries c join public.travel_country_languages cl on cl.country_id=c.id
join public.languages l on l.id=cl.language_id where l.code='ko';
select cu.*,m.* from public.travel_country_units cu join public.units u on u.id=cu.unit_id
join public.courses c on c.id=u.course_id join public.languages l on l.id=c.language_id
left join public.travel_unit_curriculum m on m.unit_id=u.id where l.code='ko';
select d.id,d.slug,d.unit_id,d.requirement_type,d.is_active,
 (select count(*) from public.user_passport_stamps p where p.stamp_id=d.id) as earned_dependencies
from public.passport_stamp_definitions d join public.travel_countries c on c.id=d.country_id where c.code='kr';

-- Review actual schema and CHECK constraints; never relax allowed activity/question types.
select table_name,column_name,data_type from information_schema.columns where table_schema='public'
and table_name in('vocabulary','activities','questions','writing_studio_activities','travel_unit_curriculum') order by table_name,ordinal_position;
select conrelid::regclass as table_name,conname,pg_get_constraintdef(oid) as definition from pg_constraint
where connamespace='public'::regnamespace and contype in('c','u','f') and conrelid in
('public.activities'::regclass,'public.questions'::regclass,'public.units'::regclass,'public.lessons'::regclass,'public.writing_studio_activities'::regclass);
select schemaname,tablename,policyname,cmd,roles,qual,with_check from pg_policies where schemaname='public'
and tablename in('lesson_progress','user_character_progress','user_writing_lesson_progress','user_passport_stamps','travel_visits');
select p.proname,p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
and p.proname in('complete_authenticated_lesson','record_writing_workbook_attempt','acelingua_refresh_country_stamps','acelingua_guard_destination_challenge');
rollback;
