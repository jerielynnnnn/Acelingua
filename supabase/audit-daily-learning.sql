-- READ ONLY. Returns ONE report containing every audit section.
-- Copy the audit_report cell from Supabase SQL Editor and share its contents.
-- No learner rows, credentials, email addresses, or tokens are selected.
begin read only;
select jsonb_pretty(jsonb_build_object(
  'tables', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select requested.name as table_name, to_regclass('public.' || requested.name) is not null as exists
from unnest(array['profiles','daily_goals','streak_history','lesson_progress',
 'activity_progress','question_answers','achievements','user_achievements',
 'xp_transactions','coin_transactions','minigame_sessions','minigame_daily_rewards',
 'store_supply_offers','store_supply_receipts']) requested(name)
  ) audit_row), '[]'::jsonb),
  'columns', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select table_name,column_name,data_type,udt_name,is_nullable,column_default
from information_schema.columns where table_schema='public' and table_name=any(array[
 'profiles','daily_goals','streak_history','lesson_progress','activity_progress',
 'question_answers','achievements','user_achievements','xp_transactions',
 'coin_transactions','minigame_sessions','minigame_daily_rewards',
 'store_supply_offers','store_supply_receipts']) order by table_name,ordinal_position
  ) audit_row), '[]'::jsonb),
  'constraints', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname=any(array['profiles','daily_goals','streak_history',
 'lesson_progress','activity_progress','question_answers','achievements','user_achievements',
 'xp_transactions','coin_transactions']) order by c.relname,con.conname
  ) audit_row), '[]'::jsonb),
  'policies', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename=any(array['profiles','daily_goals','streak_history',
 'lesson_progress','activity_progress','question_answers','xp_transactions','coin_transactions',
 'achievements','user_achievements']) order by tablename,policyname
  ) audit_row), '[]'::jsonb),
  'triggers', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select c.relname as table_name,t.tgname,pg_get_triggerdef(t.oid) as definition,
 pg_get_functiondef(p.oid) as trigger_function
from pg_trigger t join pg_class c on c.oid=t.tgrelid
join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid
where not t.tgisinternal and n.nspname='public' and c.relname=any(array[
 'profiles','daily_goals','streak_history','lesson_progress','activity_progress',
 'question_answers','user_achievements','xp_transactions','coin_transactions'])
order by c.relname,t.tgname
  ) audit_row), '[]'::jsonb),
  'functions', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
 p.prosecdef as security_definer,p.proacl as permissions,pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f' and (
 p.proname ~ '(streak|daily|goal|reward|achievement|complete.*lesson|purchase_supply|travel_match)'
) order by p.proname
  ) audit_row), '[]'::jsonb),
  'table_grants', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select table_name,grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and grantee in ('anon','authenticated') and table_name=any(array[
 'profiles','daily_goals','streak_history','lesson_progress','activity_progress',
 'question_answers','xp_transactions','coin_transactions']) order by table_name,grantee,privilege_type
  ) audit_row), '[]'::jsonb),
  'profile_column_grants', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select table_name,column_name,grantee,privilege_type from information_schema.column_privileges
where table_schema='public' and table_name='profiles' and grantee in ('anon','authenticated')
order by column_name,grantee,privilege_type
  ) audit_row), '[]'::jsonb),
  'indexes', coalesce((select jsonb_agg(to_jsonb(audit_row)) from (
select tablename,indexname,indexdef from pg_indexes where schemaname='public'
and tablename=any(array['daily_goals','streak_history','lesson_progress','activity_progress',
 'question_answers','xp_transactions','coin_transactions','user_achievements'])
order by tablename,indexname
  ) audit_row), '[]'::jsonb)
)) as audit_report;
commit;
