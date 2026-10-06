-- READ ONLY. Query 1: run BEFORE and AFTER and retain both results.
-- Unchanged fingerprints prove preservation only when compared with a baseline.
-- Pause learning writes during this comparison; new activity legitimately changes hashes.
-- Includes archived lessons because they remain in this course after restructuring.
with lesson_ids as (
  select l.id from public.lessons l join public.units u on u.id=l.unit_id
  where u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
), activity_ids as (
  select a.id from public.activities a where a.lesson_id in(select id from lesson_ids)
), question_ids as (
  select q.id from public.questions q where q.activity_id in(select id from activity_ids)
), evidence as (
  select 'lesson_progress' as relation,p.id,to_jsonb(p) as payload from public.lesson_progress p where p.lesson_id in(select id from lesson_ids)
  union all select 'activity_progress',p.id,to_jsonb(p) from public.activity_progress p where p.activity_id in(select id from activity_ids)
  union all select 'question_answers',p.id,to_jsonb(p) from public.question_answers p where p.question_id in(select id from question_ids)
  union all select 'xp_transactions',p.id,to_jsonb(p) from public.xp_transactions p where p.source_id in(select id from lesson_ids union select id from activity_ids union select id from question_ids)
  union all select 'coin_transactions',p.id,to_jsonb(p) from public.coin_transactions p where p.source_id in(select id from lesson_ids union select id from activity_ids union select id from question_ids)
  union all select 'vocabulary',p.id,to_jsonb(p) from public.vocabulary p where p.lesson_id in(select id from lesson_ids)
  union all select 'activities',p.id,to_jsonb(p) from public.activities p where p.id in(select id from activity_ids)
  union all select 'questions',p.id,to_jsonb(p) from public.questions p where p.id in(select id from question_ids)
  union all select 'course_progress',p.id,to_jsonb(p) from public.course_progress p where p.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
)
select names.relation,count(e.id) as row_count,
  md5(coalesce(jsonb_agg(e.payload order by e.id) filter(where e.id is not null),'[]'::jsonb)::text) as fingerprint
from unnest(array['lesson_progress','activity_progress','question_answers','xp_transactions','coin_transactions','vocabulary','activities','questions','course_progress']) names(relation)
left join evidence e on e.relation=names.relation group by names.relation order by names.relation;

-- Baseline overview: run BEFORE and AFTER and save results.
-- course_progress fingerprint is EXPECTED to change when summaries are recalculated.
-- Its row count/IDs must remain stable; validate recalculated values with Query 6.
select c.id as course_id,c.title,
  (select count(*) from public.units u where u.course_id=c.id) as physical_units,
  (select count(*) from public.units u where u.course_id=c.id and u.is_published) as published_units,
  (select count(*) from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=c.id) as physical_lessons,
  (select count(*) from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=c.id and l.is_published) as published_lessons,
  (select count(*) from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=c.id and u.is_published and l.is_published) as roadmap_lessons,
  (select array_agg(cp.id order by cp.id) from public.course_progress cp where cp.course_id=c.id) as course_progress_ids
from public.courses c where c.id='c293f603-993b-4332-8dd8-afc0fd50ae04';

-- Query 2: AFTER only. Expected eight units, six lessons each, 48 overall;
-- exact lesson titles/positions and existing unit IDs checked independently.
with expected(position,existing_id,title,lesson_titles) as (values
(1,'6fa3790a-9162-4f49-98e9-3bf1148d7e10'::uuid,'Greetings & Introductions',array['Saying Hello','Introducing Yourself','Asking Someone''s Name','Polite Expressions','Basic Conversation','Unit Review']),
(2,'b735bff3-2b4f-4ad9-9a42-5dc3f907eb63'::uuid,'Numbers & Time',array['Numbers 1–10','Numbers 11–100','Asking the Time','Days of the Week','Dates','Unit Review']),
(3,'5ba31a7f-11c3-4c10-bb2a-42063762d6c3'::uuid,'Daily Life',array['Morning Routine','Family','School & Work','Everyday Actions','Likes & Dislikes','Unit Review']),
(4,'531834cc-9151-4f36-b8e4-b27cf9e05ada'::uuid,'Food & Eating Out',array['Food & Drinks','At a Café','Ordering Food','Asking for the Bill','Restaurant Conversation','Unit Review']),
(5,'1b829d7e-32b9-4bdf-a21e-c03272f52962'::uuid,'Around the City',array['Places in Town','Asking Where Something Is','Directions','Transportation','Finding a Destination','Unit Review']),
(6,null::uuid,'Shopping',array['Shopping Vocabulary','Asking the Price','Colors & Sizes','Numbers & Money','Buying Something','Unit Review']),
(7,null::uuid,'Travel & Experiences',array['At the Station','At the Hotel','Sightseeing','Asking for Help','Travel Conversation','Unit Review']),
(8,null::uuid,'Beginner Final Journey',array['Greeting Challenge','Daily Life Challenge','Food Challenge','City Challenge','Travel Challenge','Final Beginner Review'])
), course_units as (
  select * from public.units where course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
), inspected as (
  select e.position,e.title,u.id,u.is_published,
    count(l.id) as lesson_count,
    coalesce(array_agg(l.title order by l.lesson_order,l.id) filter(where l.id is not null)=e.lesson_titles,false) as titles_match,
    coalesce(array_agg(l.lesson_order order by l.lesson_order,l.id) filter(where l.id is not null)=array[1,2,3,4,5,6],false) as positions_match
  from expected e left join course_units u on u.unit_order=e.position and u.title=e.title
    and (e.existing_id is null or u.id=e.existing_id)
  left join public.lessons l on l.unit_id=u.id group by e.position,e.title,e.lesson_titles,u.id,u.is_published
)
select *,sum(lesson_count) over() as logical_lesson_total,
  (select count(*) from course_units where is_published) as published_unit_total,
  count(id) over() as matched_target_units
from inspected order by position;

-- Query 3: approved existing lesson identities. Every mapping_matches must be true.
with expected(id,unit_order,lesson_order,title) as (values
('973d6664-259a-415e-a2b1-aa08fe71306b'::uuid,1,1,'Saying Hello'),
('4a779a6e-843f-494d-ad97-cee11eda57a3'::uuid,1,2,'Introducing Yourself'),
('1ff41ea4-d5ea-417b-8191-cc8d1928bc84'::uuid,1,3,'Asking Someone''s Name'),
('ba7bc0a6-d26e-e894-9e2f-756683f5f12b'::uuid,1,4,'Polite Expressions'),
('1ecd32f1-fd52-4dbb-8f93-d40392b6a528'::uuid,1,5,'Basic Conversation'),
('69beefe2-3dc3-465b-b918-e446e8b709ca'::uuid,1,6,'Unit Review'),
('55093eaa-3366-b53f-e82f-e0b9a67cb45e'::uuid,2,1,'Numbers 1–10'),
('5aa65196-db60-464d-2a4c-6bee7d92b7e6'::uuid,4,2,'At a Café'),
('49134800-ec00-2804-4057-0321cadc50e9'::uuid,5,1,'Places in Town'),
('9444a40d-3762-44fc-f507-2615cd50b347'::uuid,6,3,'Colors & Sizes'))
select e.*,l.is_published,coalesce(l.title=e.title and l.lesson_order=e.lesson_order
  and u.unit_order=e.unit_order and u.is_published
  and u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04',false) as mapping_matches
from expected e left join public.lessons l on l.id=e.id left join public.units u on u.id=l.unit_id
order by e.unit_order,e.lesson_order;

-- Query 4: both historical records must exist, be unpublished, and be outside target units.
select wanted.id,l.title,l.is_published,u.is_published as parent_published,
  coalesce(l.id is not null and not l.is_published and not u.is_published
    and u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04',false) as archive_valid
from (values('d89e8b91-8bf0-1092-fe5b-3179a295f7a1'::uuid),('49521111-6a03-456b-84d5-f6d0bbf46cf7'::uuid)) wanted(id)
left join public.lessons l on l.id=wanted.id left join public.units u on u.id=l.unit_id;

-- Query 5: global broken-reference counts must be zero (FK verification).
select
  (select count(*) from public.lesson_progress p left join public.lessons l on l.id=p.lesson_id where l.id is null) as orphan_lesson_progress,
  (select count(*) from public.activity_progress p left join public.activities a on a.id=p.activity_id where a.id is null) as orphan_activity_progress,
  (select count(*) from public.question_answers p left join public.questions q on q.id=p.question_id where q.id is null) as orphan_question_answers;

-- Query 6: course_progress vs actual published units/lessons, for every existing summary.
with actual as (
  select cp.id,cp.user_id,count(l.id) as actual_total,
    count(l.id) filter(where p.status='completed') as actual_completed
  from public.course_progress cp
  left join public.units u on u.course_id=cp.course_id and u.is_published
  left join public.lessons l on l.unit_id=u.id and l.is_published
  left join public.lesson_progress p on p.lesson_id=l.id and p.user_id=cp.user_id
  where cp.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04' group by cp.id,cp.user_id
), calculated as (
  select *,case when actual_total=0 then 0 else actual_completed::numeric/actual_total*100 end as actual_percentage from actual
)
select a.*,cp.completed_lessons,cp.total_lessons,cp.progress_percentage,
  cp.completed_lessons=a.actual_completed and cp.total_lessons=a.actual_total
    and abs(cp.progress_percentage-a.actual_percentage)<0.01 as summary_matches
from calculated a join public.course_progress cp on cp.id=a.id;

-- Query 7: published roadmap order, exactly the same tuple as current implementation.
select u.unit_order,u.id as unit_id,l.lesson_order,l.id as lesson_id,l.title
from public.units u join public.lessons l on l.unit_id=u.id
where u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04' and u.is_published and l.is_published
order by u.unit_order,u.id,l.lesson_order,l.id;

-- Query 8: save BEFORE and compare AFTER; existing destination values must not change.
select id,location_name,map_x,map_y from public.units
where course_id='c293f603-993b-4332-8dd8-afc0fd50ae04' order by id;

-- Query 9: BEFORE/AFTER publication of six reused content-bearing records must match.
select id,is_published from public.lessons where id in
('973d6664-259a-415e-a2b1-aa08fe71306b'::uuid,'ba7bc0a6-d26e-e894-9e2f-756683f5f12b'::uuid,
 '55093eaa-3366-b53f-e82f-e0b9a67cb45e'::uuid,'9444a40d-3762-44fc-f507-2615cd50b347'::uuid,
 '5aa65196-db60-464d-2a4c-6bee7d92b7e6'::uuid,'49134800-ec00-2804-4057-0321cadc50e9'::uuid)
order by id;

-- Query 10: AFTER, no empty target lessons should be published. Expected no rows.
select l.id,l.title,u.unit_order,l.lesson_order from public.lessons l
join public.units u on u.id=l.unit_id
where u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04' and u.is_published and l.is_published
and not exists(select 1 from public.vocabulary v where v.lesson_id=l.id)
and not exists(select 1 from public.activities a where a.lesson_id=l.id);
