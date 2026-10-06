-- READ ONLY. Run each numbered SELECT separately and share every result.
-- Do not run japanese-restructure-review.sql. No browser session is required.

-- 1. Exact PK/FK/UNIQUE/CHECK (and any other) constraints from PostgreSQL.
select c.relname as table_name,con.conname as constraint_name,
  case con.contype when 'p' then 'PRIMARY KEY' when 'f' then 'FOREIGN KEY'
    when 'u' then 'UNIQUE' when 'c' then 'CHECK' when 'x' then 'EXCLUSION'
    when 'n' then 'NOT NULL' else con.contype::text end as constraint_type,
  pg_get_constraintdef(con.oid,true) as definition,
  con.condeferrable,con.condeferred,con.convalidated
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('units','lessons')
order by c.relname,con.conname;

-- 2. All indexes, including standalone, partial, expression, and INCLUDE indexes.
select t.relname as table_name,idx.relname as index_name,
  i.indisprimary,i.indisunique,i.indisvalid,i.indisready,
  pg_get_indexdef(i.indexrelid) as definition,
  pg_get_expr(i.indpred,i.indrelid) as predicate,
  array(select pg_get_indexdef(i.indexrelid,k,true)
    from generate_series(1,i.indnkeyatts) k) as key_expressions,
  con.conname as associated_constraint
from pg_index i join pg_class t on t.oid=i.indrelid
join pg_namespace n on n.oid=t.relnamespace
join pg_class idx on idx.oid=i.indexrelid
left join pg_constraint con on con.conindid=i.indexrelid and con.conrelid=t.oid
where n.nspname='public' and t.relname in ('units','lessons')
order by t.relname,idx.relname;

-- 3. Exact column types/defaults/NOT NULL/identity/generated attributes.
-- These results, not an assumed gen_random_uuid(), establish UUID defaults.
select c.relname as table_name,a.attname as column_name,
  format_type(a.atttypid,a.atttypmod) as data_type,a.attnotnull as not_null,
  pg_get_expr(d.adbin,d.adrelid) as default_expression,
  a.attidentity as identity_kind,a.attgenerated as generated_kind
from pg_class c join pg_namespace n on n.oid=c.relnamespace
join pg_attribute a on a.attrelid=c.oid and a.attnum>0 and not a.attisdropped
left join pg_attrdef d on d.adrelid=c.oid and d.adnum=a.attnum
where n.nspname='public' and c.relname in ('units','lessons')
order by c.relname,a.attnum;

-- 4. Simulate EXACT temporary unit orders used by the draft (no writes).
-- bigint arithmetic exposes integer overflow before attempting a migration.
with occupied as (
  select id,unit_order from public.units
  where course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
), proposed as (
  select id,unit_order,(select coalesce(max(unit_order),0)::bigint+100 from occupied)
    +row_number() over(order by unit_order,id) as temporary_order from occupied
)
select p.id,p.unit_order as current_order,p.temporary_order,
  exists(select 1 from occupied o where o.unit_order=p.temporary_order) as collision_in_course,
  p.temporary_order>2147483647 as integer_overflow,
  array(select distinct unit_order from occupied order by unit_order) as occupied_orders
from proposed p order by p.unit_order,p.id;

-- 5. Simulate EXACT temporary lesson orders used by draft; IDs order only
-- determines temporary allocation, not the final learning progression.
with occupied as (
  select l.id,l.unit_id,l.lesson_order from public.lessons l
  join public.units u on u.id=l.unit_id
  where u.course_id='c293f603-993b-4332-8dd8-afc0fd50ae04'
), proposed as (
  select *, (select coalesce(max(lesson_order),0)::bigint+100 from occupied)
    +row_number() over(order by id) as temporary_order from occupied
)
select p.id,p.unit_id,p.lesson_order as current_order,p.temporary_order,
  exists(select 1 from occupied o where o.unit_id=p.unit_id
    and o.lesson_order=p.temporary_order) as collision_in_parent,
  exists(select 1 from occupied o where o.lesson_order=p.temporary_order) as collision_anywhere_in_course,
  p.temporary_order>2147483647 as integer_overflow
from proposed p order by p.id;

-- 6. Triggers can impose rules beyond catalog constraints. Inspect before approval.
select c.relname as table_name,t.tgname,pg_get_triggerdef(t.oid) as trigger_definition,
  pg_get_functiondef(t.tgfoid) as function_definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('units','lessons') and not t.tgisinternal
order by c.relname,t.tgname;
