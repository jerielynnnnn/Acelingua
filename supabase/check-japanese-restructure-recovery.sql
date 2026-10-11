-- READ ONLY. Run before considering v2. If counts/records differ, STOP.
-- Counts alone cannot prove a full rollback: also compare rows and saved fingerprints.
-- An aborted SQL Editor transaction must be resolved before SELECTs can run.
select c.id,c.title,
  (select count(*) from public.units u where u.course_id=c.id) as physical_units,
  (select count(*) from public.units u where u.course_id=c.id and u.is_published) as published_units,
  (select count(*) from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=c.id) as physical_lessons,
  (select count(*) from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=c.id and l.is_published) as published_lessons
from public.courses c where c.id='c293f603-993b-4332-8dd8-afc0fd50ae04';

-- Inspect exact unit changes including order, title, publication, destinations.
select id,title,unit_order,is_published,location_name,map_x,map_y
from public.units where course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
order by unit_order,id;

-- Inspect lesson parent/order/title/publication against the saved pre-migration audit.
select l.id,l.title,l.unit_id,u.unit_order,l.lesson_order,l.is_published
from public.lessons l join public.units u on u.id=l.unit_id
where u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
order by u.unit_order,u.id,l.lesson_order,l.id;

-- Session/search-path diagnostics only; rerun in the SAME session if possible.
select current_setting('search_path') as search_path,pg_my_temp_schema() as temp_schema,
  to_regclass('pg_temp.target_units') as temporary_target_units,
  to_regclass('pg_temp.reused_lessons') as temporary_reused_lessons;

-- Also compare BEFORE/AFTER fingerprints in validate-japanese-restructure.sql.
