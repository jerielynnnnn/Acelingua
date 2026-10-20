-- PROPOSED / NOT APPLIED. Review before running in Supabase SQL Editor.
-- Reuses achievements, user_achievements and existing XP/coin ledgers.
-- Requires the installed fixed-learning security grants and user/achievement unique key.
begin;

-- Stop if another reward writer was introduced; review it to avoid double payouts.
do $$ begin
 if exists(select 1 from pg_trigger where tgrelid='public.user_achievements'::regclass and not tgisinternal)
 then raise exception 'Review existing achievement triggers before enabling award collection'; end if;
end; $$;

insert into public.achievements(id,name,description,icon,requirement_type,requirement_value,xp_reward,coin_reward,is_active) values
 ('ace00001-0000-4000-8000-000000000001','First Footsteps','Complete your first language lesson.','book','lessons_completed',1,10,10,true),
 ('ace00001-0000-4000-8000-000000000002','Journey Explorer','Complete 10 distinct language lessons.','book','lessons_completed',10,30,30,true),
 ('ace00001-0000-4000-8000-000000000003','World Scholar','Complete 50 distinct language lessons.','book','lessons_completed',50,100,100,true),
 ('ace00001-0000-4000-8000-000000000004','Practice Pioneer','Complete 10 distinct learning activities.','graduation','activities_completed',10,20,20,true),
 ('ace00001-0000-4000-8000-000000000005','Bright Spark','Reach 100 total XP.','sparkles','xp_earned',100,0,20,true),
 ('ace00001-0000-4000-8000-000000000006','XP Adventurer','Reach 1,000 total XP.','sparkles','xp_earned',1000,0,75,true),
 ('ace00001-0000-4000-8000-000000000007','Seven Day Flame','Build a saved seven-day learning streak. Streak currency rewards are collected in Streak Society.','flame','streak',7,0,0,true),
 ('ace00001-0000-4000-8000-000000000008','Steady Flame','Build a saved 30-day learning streak. Streak currency rewards are collected in Streak Society.','flame','streak',30,0,0,true),
 ('ace00001-0000-4000-8000-000000000009','Quiz Voyager','Complete 10 distinct quiz activities.','trophy','quiz_completed',10,25,25,true)
on conflict(id) do nothing;

create function public.acelingua_achievement_claim_available()
returns boolean language sql stable set search_path='' as $$ select auth.uid() is not null; $$;

create function public.acelingua_claim_achievement(p_achievement uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); award public.achievements; receipt uuid; progress bigint:=0;
begin
 if learner is null then raise exception 'Sign in to collect an award'; end if;
 -- Same lock as mission claims and other balance writers.
 perform 1 from public.profiles where id=learner for update;
 if not found then raise exception 'Learner profile unavailable'; end if;
 select * into award from public.achievements where id=p_achievement and is_active;
 if not found then raise exception 'Award unavailable'; end if;
 if exists(select 1 from public.user_achievements where user_id=learner and achievement_id=award.id) then
  return jsonb_build_object('already_claimed',true,'xp',0,'coins',0);
 end if;
 case award.requirement_type
 when 'lessons_completed' then
  select count(distinct lesson_id) into progress from public.lesson_progress where user_id=learner and status='completed';
 when 'activities_completed' then
  select count(distinct activity_id) into progress from public.activity_progress where user_id=learner and status='completed';
 when 'xp_earned' then select xp into progress from public.profiles where id=learner;
 when 'streak' then
  -- Preserve saved historical awards, but don't mint a new badge for an expired streak.
  select case when s.last_counted_date>=((clock_timestamp() at time zone coalesce(p.timezone,'Asia/Manila'))::date-1)
   and not s.legacy_unanchored then s.current_streak else 0 end into progress
  from public.learner_streak_state s left join public.user_daily_goal_preferences p on p.user_id=s.user_id where s.user_id=learner;
 when 'quiz_completed','speaking_completed' then
  select count(distinct ap.activity_id) into progress from public.activity_progress ap
  join public.activities a on a.id=ap.activity_id where ap.user_id=learner and ap.status='completed'
  and a.activity_type=case award.requirement_type when 'quiz_completed' then 'quiz' else 'speaking' end;
 else raise exception 'This award type is not supported by collection yet';
 end case;
 if coalesce(progress,0)<award.requirement_value then raise exception 'Complete this award requirement first'; end if;
 -- Receipt and both ledgers commit together; an error rolls back the entire award.
 insert into public.user_achievements(user_id,achievement_id) values(learner,award.id)
 on conflict(user_id,achievement_id) do nothing returning id into receipt;
 if receipt is null then return jsonb_build_object('already_claimed',true,'xp',0,'coins',0); end if;
 update public.profiles set xp=xp+award.xp_reward,coins=coins+award.coin_reward,updated_at=clock_timestamp() where id=learner;
 if award.xp_reward>0 then
  insert into public.xp_transactions(user_id,amount,source_type,source_id,description)
  values(learner,award.xp_reward,'achievement',receipt,award.name);
 end if;
 if award.coin_reward>0 then
  insert into public.coin_transactions(user_id,amount,transaction_type,source_id,description)
  values(learner,award.coin_reward,'achievement',receipt,award.name);
 end if;
 return jsonb_build_object('already_claimed',false,'xp',award.xp_reward,'coins',award.coin_reward);
end; $$;

revoke all on function public.acelingua_claim_achievement(uuid),public.acelingua_achievement_claim_available() from public,anon,authenticated;
grant execute on function public.acelingua_claim_achievement(uuid),public.acelingua_achievement_claim_available() to authenticated;
-- Client writes remain forbidden; authenticated reads still follow installed owner RLS.
revoke insert,update,delete on public.user_achievements from public,anon,authenticated;
commit;
