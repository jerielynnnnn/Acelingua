-- READ ONLY. Copy the single installation_report result cell.
select jsonb_pretty(jsonb_build_object(
 'foundation_installed',to_regclass('public.user_daily_missions') is not null
   and to_regprocedure('public.acelingua_daily_day(uuid,timestamptz)') is not null,
 'fixed_quests_installed',to_regprocedure('public.acelingua_fixed_quests_snapshot()') is not null,
 'quest_columns',coalesce((select jsonb_agg(column_name order by column_name)
   from information_schema.columns where table_schema='public' and table_name='user_daily_missions'
   and column_name in ('reward_xp','cadence','period_start','period_end')),'[]'::jsonb),
 'progress_triggers',coalesce((select jsonb_agg(jsonb_build_object(
   'table',c.relname,'name',t.tgname,'enabled',t.tgenabled,
   'definition',pg_get_triggerdef(t.oid),'function',pg_get_functiondef(p.oid))
   order by c.relname,t.tgname)
   from pg_trigger t join pg_class c on c.oid=t.tgrelid
   join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid
   where n.nspname='public' and not t.tgisinternal and c.relname in (
    'profiles','daily_goals','streak_history','activity_progress','question_answers',
    'user_achievements','coin_transactions','xp_transactions','lesson_progress')),'[]'::jsonb)
)) as installation_report;
