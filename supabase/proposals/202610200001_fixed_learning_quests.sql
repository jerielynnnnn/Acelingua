-- PROPOSED UPGRADE. NOT APPROVED / NOT APPLIED.
-- Requires 202610190003_daily_learning_complete.sql. Do not run both foundation drafts.
-- Reuses mission/event/receipt tables; historical goals, prices, claims and balances remain intact.
begin;
do $check$
begin
 if to_regclass('public.user_daily_missions') is null or to_regprocedure('public.acelingua_daily_day(uuid,timestamptz)') is null
 then raise exception 'Apply the reviewed daily-learning foundation 003 before this upgrade'; end if;
end; $check$;

alter table public.daily_mission_definitions add column reward_xp integer not null default 0 check(reward_xp>=0),
 add column cadence text not null default 'daily' check(cadence in ('daily','weekly'));
alter table public.user_daily_missions add column reward_xp integer not null default 0 check(reward_xp>=0),
 add column cadence text not null default 'daily' check(cadence in ('daily','weekly')),
 add column period_start date,add column period_end date;
update public.user_daily_missions m set period_start=d.local_date,period_end=d.local_date+1
 from public.user_learning_days d where d.id=m.day_id;
alter table public.user_daily_missions alter column period_start set not null,alter column period_end set not null,
 add constraint quest_period_valid check(period_end>period_start),
 add constraint quest_period_once unique(user_id,definition_id,period_start);
alter table public.user_learning_days add column bonus_xp integer not null default 0 check(bonus_xp>=0),
 add column bonus_required_quests integer not null default 6 check(bonus_required_quests>0);
alter table public.daily_reward_claims add column xp integer not null default 0 check(xp>=0);

alter table public.daily_mission_definitions drop constraint daily_mission_definitions_event_kind_check;
alter table public.daily_mission_definitions add check(event_kind in ('lesson','vocabulary','culture','writing','answer','perfect_lesson'));
alter table public.user_daily_missions drop constraint user_daily_missions_event_kind_check;
alter table public.user_daily_missions add check(event_kind in ('lesson','vocabulary','culture','writing','answer','perfect_lesson'));
alter table public.verified_learning_events drop constraint verified_learning_events_event_kind_check;
alter table public.verified_learning_events add check(event_kind in ('lesson','activity','vocabulary','culture','writing','answer','perfect_lesson'));

alter table public.xp_transactions drop constraint xp_transactions_source_type_check;
alter table public.xp_transactions add constraint xp_transactions_source_type_check check(source_type in (
 'lesson','activity','quiz','speaking','conversation','mini_game','achievement','daily_goal','daily_mission','daily_bonus','weekly_quest'));
alter table public.coin_transactions drop constraint coin_transactions_transaction_type_check;
alter table public.coin_transactions add constraint coin_transactions_transaction_type_check check(transaction_type in (
 'lesson','activity','quiz','speaking','conversation','mini_game','achievement','daily_goal','purchase','daily_mission','daily_bonus','streak_milestone','weekly_quest'));
create unique index fixed_quest_xp_once on public.xp_transactions(user_id,source_type,source_id)
 where source_type in ('daily_mission','daily_bonus','weekly_quest');
create unique index fixed_quest_coins_once on public.coin_transactions(user_id,transaction_type,source_id)
 where transaction_type in ('daily_mission','daily_bonus','weekly_quest');

-- Future days use the new catalog; assigned snapshots and old claims retain their original rewards.
update public.daily_mission_definitions set is_enabled=false;
insert into public.daily_mission_definitions(id,title,description,event_kind,target,reward_xp,reward_coins,reward_gems,is_enabled,display_order,cadence) values
 ('first-step-v2','First Step','Complete 1 distinct language lesson.','lesson',1,15,10,0,true,101,'daily'),
 ('answers-v2','Answer Explorer','Correctly answer 10 distinct server-graded questions.','answer',10,20,15,0,true,102,'daily'),
 ('perfect-practice-v2','Perfect Practice','Complete 1 assessed lesson with at least 90% accuracy.','perfect_lesson',1,25,20,0,true,103,'daily'),
 ('dedicated-learner-v2','Dedicated Learner','Complete 3 distinct language lessons.','lesson',3,40,30,1,true,104,'daily'),
 ('steady-practice-v2','Steady Practice','Complete 2 distinct language lessons.','lesson',2,20,15,0,true,105,'daily'),
 ('knowledge-builder-v2','Knowledge Builder','Correctly answer 5 distinct server-graded questions.','answer',5,20,15,0,true,106,'daily'),
 ('word-collector-v2','Word Collector','Correctly answer 10 distinct vocabulary questions.','vocabulary',10,20,15,0,false,107,'daily'),
 ('culture-explorer-v2','Culture Explorer','Complete 1 verified cultural challenge.','culture',1,20,15,0,false,108,'daily'),
 ('writing-explorer-v2','Writing Explorer','Complete 1 verified writing exercise.','writing',1,20,15,0,false,109,'daily'),
 ('weekly-lessons-v2','Weekly Adventurer','Complete 10 distinct lessons this week.','lesson',10,100,75,1,true,201,'weekly'),
 ('weekly-answers-v2','Weekly Knowledge','Correctly answer 100 distinct assessed questions this week.','answer',100,150,100,2,true,202,'weekly');

alter table public.achievements enable row level security;
revoke all on public.achievements from public,anon,authenticated;
grant select on public.achievements to authenticated;
create policy fixed_quest_achievements_read on public.achievements for select to authenticated using(is_active);

-- Fixed quests have no learner target-editing entry point.
revoke execute on function public.acelingua_set_daily_preferences(integer,text) from public,anon,authenticated;

create function public.acelingua_assign_fixed_quests(p_user uuid,p_day uuid)
returns void language plpgsql security definer set search_path='' as $$
declare day_row public.user_learning_days; week_start date;
begin
 select * into strict day_row from public.user_learning_days where id=p_day and user_id=p_user;
 week_start:=date_trunc('week',day_row.local_date::timestamp)::date;
 insert into public.user_daily_missions(user_id,day_id,definition_id,title,description,event_kind,target,
 reward_xp,reward_coins,reward_gems,cadence,period_start,period_end)
 select p_user,p_day,id,title,description,event_kind,target,reward_xp,reward_coins,reward_gems,cadence,
 case when cadence='weekly' then week_start else day_row.local_date end,
 case when cadence='weekly' then week_start+7 else day_row.local_date+1 end
 from public.daily_mission_definitions where is_enabled
 on conflict(user_id,definition_id,period_start) do nothing;
end; $$;

create or replace function public.acelingua_mission_progress(p_mission uuid)
returns integer language sql stable security definer set search_path='' as $$
 select least(m.target,count(e.id)::integer) from public.user_daily_missions m
 left join public.verified_learning_events e on e.user_id=m.user_id and e.event_kind=m.event_kind
 left join public.user_learning_days d on d.id=e.day_id and d.user_id=m.user_id
 where m.id=p_mission and (e.id is null or (d.local_date>=m.period_start and d.local_date<m.period_end))
 group by m.id,m.target;
$$;

create or replace function public.acelingua_claim_daily_reward(p_mission_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); day_row public.user_learning_days; mission public.user_daily_missions;
 claim public.daily_reward_claims; c integer; g integer; x integer; kind text; ledger_type text; receipt_day uuid; server_now timestamptz:=clock_timestamp();
begin
 if learner is null then raise exception 'Sign in to claim rewards'; end if;
 day_row:=public.acelingua_daily_day(learner,server_now);receipt_day:=day_row.id;
 if p_mission_id is not null then
  select * into mission from public.user_daily_missions where id=p_mission_id and user_id=learner
   and period_start<=day_row.local_date and period_end>day_row.local_date;
  if not found then raise exception 'This quest is not available in the current period'; end if;
  if exists(select 1 from public.daily_reward_claims where mission_id=mission.id) then
   return jsonb_build_object('already_claimed',true,'xp',0,'coins',0,'gems',0); end if;
  if coalesce(public.acelingua_mission_progress(mission.id),0)<mission.target then raise exception 'Complete the quest first'; end if;
  c:=mission.reward_coins;g:=mission.reward_gems;x:=mission.reward_xp;kind:='mission';receipt_day:=mission.day_id;
  ledger_type:=case when mission.cadence='weekly' then 'weekly_quest' else 'daily_mission' end;
 else
  if exists(select 1 from public.daily_reward_claims where user_id=learner and day_id=day_row.id and claim_kind='bonus') then
   return jsonb_build_object('already_claimed',true,'xp',0,'coins',0,'gems',0); end if;
  if (select count(*) from public.user_daily_missions where day_id=day_row.id and cadence='daily')<>day_row.bonus_required_quests
   or exists(select 1 from public.user_daily_missions m where m.day_id=day_row.id and m.cadence='daily' and not exists(
    select 1 from public.daily_reward_claims r where r.mission_id=m.id and r.user_id=learner))
  then raise exception 'Complete and claim all six daily quests first'; end if;
  c:=day_row.bonus_coins;g:=day_row.bonus_gems;x:=day_row.bonus_xp;kind:='bonus';ledger_type:='daily_bonus';
 end if;
 insert into public.daily_reward_claims(user_id,day_id,mission_id,claim_kind,xp,coins,gems)
 values(learner,receipt_day,p_mission_id,kind,x,c,g) returning * into claim;
 update public.profiles set xp=xp+x,coins=coins+c,gems=gems+g,updated_at=server_now where id=learner;
 if x>0 then insert into public.xp_transactions(user_id,amount,source_type,source_id,description)
 values(learner,x,ledger_type,claim.id,'Fixed learning quest reward'); end if;
 if c>0 then insert into public.coin_transactions(user_id,amount,transaction_type,source_id,description)
 values(learner,c,ledger_type,claim.id,'Fixed learning quest reward'); end if;
 if g>0 then insert into public.gem_transactions(user_id,amount,daily_claim_id) values(learner,g,claim.id); end if;
 return jsonb_build_object('already_claimed',false,'xp',x,'coins',c,'gems',g);
end; $$;

create function public.acelingua_fixed_quests_snapshot()
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); day_row public.user_learning_days; week_end date;
begin
 if learner is null then raise exception 'Sign in to view quests'; end if;
 day_row:=public.acelingua_daily_day(learner,clock_timestamp());
 week_end:=date_trunc('week',day_row.local_date::timestamp)::date+7;
 return jsonb_build_object('server_now',clock_timestamp(),'today',day_row.local_date,'timezone',day_row.timezone,
 'resets_at',day_row.resets_at,'weekly_resets_at',week_end::timestamp at time zone day_row.timezone,
 'profile',(select jsonb_build_object('xp',xp,'coins',coins,'gems',gems) from public.profiles where id=learner),
 'quests',coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('progress',coalesce(public.acelingua_mission_progress(m.id),0),
  'claimed',exists(select 1 from public.daily_reward_claims r where r.mission_id=m.id)) order by m.cadence,m.definition_id)
  from public.user_daily_missions m where m.user_id=learner and m.period_start<=day_row.local_date and m.period_end>day_row.local_date),'[]'::jsonb),
 'chest',jsonb_build_object('xp',day_row.bonus_xp,'coins',day_row.bonus_coins,'gems',day_row.bonus_gems,'required',day_row.bonus_required_quests,
  'claimed_count',(select count(*) from public.user_daily_missions m join public.daily_reward_claims r on r.mission_id=m.id where m.day_id=day_row.id and m.cadence='daily'),
  'claimed',exists(select 1 from public.daily_reward_claims r where r.user_id=learner and r.day_id=day_row.id and r.claim_kind='bonus')));
end; $$;

-- A normalized catalog reuses existing achievements; it creates no second milestone payout path.
create view public.learning_challenge_catalog with (security_invoker=true) as
 select id,title,description,cadence as period,event_kind,target,reward_xp,reward_coins,reward_gems,'mission'::text as source
 from public.daily_mission_definitions where is_enabled
 union all
 select id::text,name,description,'one_time',requirement_type,requirement_value,xp_reward,coin_reward,0,'achievement'
 from public.achievements where is_active;
revoke all on public.learning_challenge_catalog from public,anon,authenticated;
grant select on public.learning_challenge_catalog to authenticated;
revoke all on function public.acelingua_assign_fixed_quests(uuid,uuid),public.acelingua_fixed_quests_snapshot() from public,anon,authenticated;
grant execute on function public.acelingua_fixed_quests_snapshot() to authenticated;

create or replace function public.acelingua_daily_day(p_user uuid,p_now timestamptz)
returns public.user_learning_days language plpgsql security definer set search_path='' as $$
declare pref public.user_daily_goal_preferences; day_row public.user_learning_days; local_day date; midnight timestamptz;
begin
 perform 1 from public.profiles where id=p_user for update;
 if not found then raise exception 'Learner profile unavailable'; end if;
 insert into public.user_daily_goal_preferences(user_id) values(p_user) on conflict do nothing;
 select * into pref from public.user_daily_goal_preferences where user_id=p_user;
 select * into day_row from public.user_learning_days where user_id=p_user order by starts_at desc limit 1;
 if found and p_now<day_row.resets_at then return day_row; end if;
 -- Apply a scheduled timezone only when the previous reward window closes.
 if pref.pending_timezone is not null and (day_row.id is null or (p_now at time zone pref.pending_timezone)::date>day_row.local_date) then
  update public.user_daily_goal_preferences set timezone=pref.pending_timezone,pending_timezone=null,
   timezone_changed_at=p_now,updated_at=p_now where user_id=p_user returning * into pref;
 end if;
 local_day:=(p_now at time zone pref.timezone)::date;
 -- Traveling west must not reopen a previously rewarded date.
 if day_row.id is not null and local_day<=day_row.local_date then
  raise exception 'Daily timezone boundary has not advanced';
 end if;
 midnight:=((local_day+1)::timestamp at time zone pref.timezone);
 insert into public.user_learning_days(user_id,local_date,timezone,starts_at,resets_at,goal_target)
 values(p_user,local_day,pref.timezone,greatest(local_day::timestamp at time zone pref.timezone,
  coalesce(day_row.resets_at,'-infinity'::timestamptz)),midnight,pref.target_activities)
 returning * into day_row;
 update public.user_learning_days set bonus_xp=100,bonus_coins=75,bonus_gems=3,bonus_required_quests=6 where id=day_row.id returning * into day_row;
 perform public.acelingua_assign_fixed_quests(p_user,day_row.id);
 insert into public.daily_goals(user_id,goal_date,target_activities)
 values(p_user,day_row.local_date,day_row.goal_target) on conflict(user_id,goal_date) do nothing;
 insert into public.streak_freeze_inventory(user_id) values(p_user) on conflict do nothing;
 return day_row;
end; $$;

create or replace function public.acelingua_daily_learning_after_lesson()
returns trigger language plpgsql security definer set search_path='' as $$
declare day_row public.user_learning_days; activity record; gained integer:=0; n integer;
 server_now timestamptz:=clock_timestamp(); total integer; correct integer; answer_row record;
begin
 if new.status<>'completed' or (tg_op='UPDATE' and old.status='completed') then return new; end if;
 -- Administration/backfills without a learner session do not mint reward events.
 if auth.uid() is null then return new; end if;
 if auth.uid()<>new.user_id then raise exception 'Invalid learning event owner'; end if;
 perform public.acelingua_lesson_course(new.lesson_id);
 day_row:=public.acelingua_daily_day(new.user_id,server_now);
 insert into public.verified_learning_events(user_id,day_id,lesson_id,event_kind,source_id,occurred_at)
 values(new.user_id,day_row.id,new.lesson_id,'lesson',new.lesson_id,server_now)
 on conflict(user_id,event_kind,source_id) do nothing;
 if not found then return new; end if;

 for answer_row in select q.id,a.activity_type from public.questions q join public.activities a on a.id=q.activity_id
 join public.question_answers qa on qa.id=md5(new.user_id::text||':'||new.lesson_id::text||':'||new.attempts::text||':'||q.id::text)::uuid
 and qa.user_id=new.user_id and qa.question_id=q.id and qa.is_correct
 where a.lesson_id=new.lesson_id loop
  insert into public.verified_learning_events(user_id,day_id,lesson_id,event_kind,source_id,occurred_at)
  values(new.user_id,day_row.id,new.lesson_id,'answer',answer_row.id,server_now) on conflict(user_id,event_kind,source_id) do nothing;
  if answer_row.activity_type='vocabulary' then
   insert into public.verified_learning_events(user_id,day_id,lesson_id,event_kind,source_id,occurred_at)
   values(new.user_id,day_row.id,new.lesson_id,'vocabulary',answer_row.id,server_now) on conflict(user_id,event_kind,source_id) do nothing;
  end if;
 end loop;
 select count(*),count(*) filter(where qa.is_correct) into total,correct from public.questions q
 join public.activities a on a.id=q.activity_id left join public.question_answers qa
 on qa.id=md5(new.user_id::text||':'||new.lesson_id::text||':'||new.attempts::text||':'||q.id::text)::uuid
 and qa.user_id=new.user_id and qa.question_id=q.id where a.lesson_id=new.lesson_id;
 if total>0 and correct::bigint*100>=total::bigint*90 then
  insert into public.verified_learning_events(user_id,day_id,lesson_id,event_kind,source_id,occurred_at)
  values(new.user_id,day_row.id,new.lesson_id,'perfect_lesson',new.lesson_id,server_now) on conflict(user_id,event_kind,source_id) do nothing;
 end if;
 for activity in select a.id from public.activities a join public.activity_progress ap on ap.activity_id=a.id
  where a.lesson_id=new.lesson_id and ap.user_id=new.user_id and ap.status='completed' and ap.score>=80
  and exists(select 1 from public.questions q where q.activity_id=a.id) loop
  insert into public.verified_learning_events(user_id,day_id,lesson_id,activity_id,event_kind,source_id,occurred_at)
  values(new.user_id,day_row.id,new.lesson_id,activity.id,'activity',activity.id,server_now)
  on conflict(user_id,event_kind,source_id) do nothing;
  get diagnostics n=row_count; gained:=gained+n;
 end loop;
 -- Vocabulary-only lessons qualify as one activity; never double-count their lesson and quiz.
 if gained=0 and not exists(select 1 from public.questions q join public.activities a on a.id=q.activity_id where a.lesson_id=new.lesson_id) then gained:=1; end if;
 update public.daily_goals set completed_activities=completed_activities+gained,
  is_completed=completed_activities+gained>=target_activities,
  completed_at=case when completed_activities+gained>=target_activities then coalesce(completed_at,server_now) else completed_at end,
  updated_at=server_now where user_id=new.user_id and goal_date=day_row.local_date;
 perform public.acelingua_sync_learning_streak(new.user_id,day_row.local_date,false,day_row.timezone);
 insert into public.streak_history(user_id,activity_date,activities_completed,is_active)
 values(new.user_id,day_row.local_date,greatest(gained,1),true)
 on conflict(user_id,activity_date) do update set activities_completed=public.streak_history.activities_completed+excluded.activities_completed,
 is_active=true,updated_at=server_now;
 -- Initialize from the previous state BEFORE counting today's new history on first use.
 perform public.acelingua_sync_learning_streak(new.user_id,day_row.local_date,true,day_row.timezone);
 return new;
end; $$;
commit;
