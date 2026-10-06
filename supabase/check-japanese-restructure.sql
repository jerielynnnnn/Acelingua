-- READ ONLY. Run before approving the restructuring draft.
select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('units','lessons') order by c.relname,con.conname;
select tablename,indexname,indexdef from pg_indexes
where schemaname='public' and tablename in ('units','lessons') order by tablename,indexname;
select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns where table_schema='public' and table_name in ('units','lessons')
order by table_name,ordinal_position;
select l.id,l.title,u.id as unit_id,u.unit_order,
  (select jsonb_agg(to_jsonb(v) order by v.id) from public.vocabulary v where v.lesson_id=l.id) as vocabulary,
  (select count(*) from public.lesson_progress p where p.lesson_id=l.id) as progress_rows_all_learners,
  (select count(*) from public.lesson_progress p where p.lesson_id=l.id and p.status='completed') as completions_all_learners
from public.lessons l join public.units u on u.id=l.unit_id
where u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
order by u.unit_order,u.id,l.lesson_order,l.id;
