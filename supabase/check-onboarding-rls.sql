-- Read-only: run in Supabase SQL Editor BEFORE the onboarding RLS migration.
-- Share the results to identify live policies, restrictive conflicts, and indexes.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name in ('user_courses', 'course_progress')
order by table_name, ordinal_position;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('user_courses', 'course_progress');

select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('user_courses', 'course_progress')
order by tablename, policyname;

select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename in ('user_courses', 'course_progress')
order by tablename, indexname;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name in ('user_courses', 'course_progress')
  and grantee in ('authenticated', 'anon')
order by table_name, grantee, privilege_type;

-- Also inspect triggers: a trigger could raise an RLS error from a different write.
select c.relname as table_name, t.tgname, pg_get_triggerdef(t.oid) as trigger_definition
from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('user_courses', 'course_progress')
  and not t.tgisinternal;
