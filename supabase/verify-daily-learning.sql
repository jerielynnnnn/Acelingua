-- READ ONLY. Run after successful application of the complete proposal.
-- This checks installed objects and permissions; it does not award rewards or change user data.
select name,to_regclass('public.'||name) is not null as installed from unnest(array[
 'daily_mission_definitions','user_daily_goal_preferences','user_learning_days',
 'verified_learning_events','user_daily_missions','daily_reward_claims',
 'streak_freeze_inventory','streak_freeze_grants','streak_freeze_uses',
 'streak_milestone_definitions','streak_milestone_claims','gem_transactions','learner_streak_state']) t(name);

select has_function_privilege('authenticated','public.acelingua_daily_learning_snapshot(date)','execute') as snapshot_allowed,
 has_function_privilege('authenticated','public.acelingua_claim_daily_reward(uuid)','execute') as daily_claim_allowed,
 has_function_privilege('authenticated','public.acelingua_daily_day(uuid,timestamp with time zone)','execute') as internal_day_must_be_false,
 has_function_privilege('authenticated','public.acelingua_grant_streak_freeze(uuid,text,integer)','execute') as freeze_grant_must_be_false,
 has_column_privilege('authenticated','public.profiles','coins','update') as coins_update_must_be_false,
 has_column_privilege('authenticated','public.profiles','gems','update') as gems_update_must_be_false,
 has_column_privilege('authenticated','public.profiles','role','update') as role_update_must_be_false,
 has_column_privilege('authenticated','public.profiles','display_name','update') as name_update_allowed;

select tgname,pg_get_triggerdef(oid) from pg_trigger where tgrelid='public.lesson_progress'::regclass
 and not tgisinternal order by tgname;
