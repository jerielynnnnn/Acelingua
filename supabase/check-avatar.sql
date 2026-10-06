-- Read-only. Run each query separately in Supabase SQL Editor and share all results.
select table_name, column_name, data_type, udt_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('avatar_items', 'user_avatar_items', 'user_avatar_equipped')
order by table_name, ordinal_position;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
  p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check
from pg_class c join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in ('avatar_items', 'user_avatar_items', 'user_avatar_equipped')
order by c.relname, p.policyname;

select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public'
  and tablename in ('avatar_items', 'user_avatar_items', 'user_avatar_equipped')
order by tablename, indexname;

select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('avatar_items', 'user_avatar_items', 'user_avatar_equipped')
order by c.relname, con.conname;

select c.relname as table_name, t.tgname, pg_get_triggerdef(t.oid) as definition
from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('avatar_items', 'user_avatar_items', 'user_avatar_equipped')
  and not t.tgisinternal;

-- Catalog data only: no learner ownership rows or account information.
select * from public.avatar_items order by id;
