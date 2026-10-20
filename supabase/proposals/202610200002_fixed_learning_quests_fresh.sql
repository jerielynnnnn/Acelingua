-- REVIEW REQUIRED. NOT APPLIED. Fresh installation only.
-- If the daily-learning 003 proposal is already installed, use the 202610200001 upgrade instead.
-- One transaction: foundation plus fixed daily/weekly quest upgrade.
begin;

-- Stop rather than silently replace newly introduced legacy streak/reward writers.
do $audit$
begin
 if exists(select 1 from pg_catalog.pg_trigger t join pg_catalog.pg_class c on c.oid=t.tgrelid
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal
  and c.relname in ('profiles','daily_goals','streak_history','activity_progress','question_answers',
   'user_achievements','coin_transactions','xp_transactions','lesson_progress')
  and not (c.relname='lesson_progress' and t.tgname in ('travel_challenge_guard','travel_destination_reward')))
 then raise exception 'Legacy reward/progress triggers changed since audit. Review before applying'; end if;
 if to_regprocedure('public.acelingua_complete_assessed_lesson(uuid,jsonb,uuid[])') is null
 or to_regprocedure('public.acelingua_lesson_course(uuid)') is null then
 raise exception 'Install and verify the existing assessed completion/security RPCs first'; end if;
end; $audit$;


create table public.daily_mission_definitions (
 id text primary key,
 title text not null,
 description text not null,
 event_kind text not null check (event_kind in ('lesson','vocabulary','culture')),
 target integer not null check (target > 0),
 reward_coins integer not null default 0 check (reward_coins >= 0),
 reward_gems integer not null default 0 check (reward_gems >= 0),
 is_enabled boolean not null default false,
 display_order integer not null unique
);
insert into public.daily_mission_definitions values
 ('first-steps','First Steps','Complete 1 distinct language lesson.','lesson',1,15,0,true,1),
 ('vocabulary-explorer','Vocabulary Explorer','Successfully practice 10 distinct vocabulary words.','vocabulary',10,20,0,false,2),
 ('daily-champion','Daily Champion','Complete 3 distinct language lessons.','lesson',3,30,1,true,3),
 ('culture-explorer','Culture Explorer','Complete 1 verified cultural activity.','culture',1,15,0,false,4);

create table public.user_daily_goal_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 target_activities integer not null default 3 check (target_activities in (1,3,5,8)),
 timezone text not null default 'Asia/Manila',
 pending_timezone text,
 timezone_changed_at timestamptz,
 updated_at timestamptz not null default now()
);
-- Validate against PostgreSQL's IANA database, not a client-provided numeric offset.
create function public.acelingua_validate_learning_timezone()
returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone)
 or (new.pending_timezone is not null and not exists(
  select 1 from pg_catalog.pg_timezone_names where name=new.pending_timezone)) then
  raise exception 'Choose a valid IANA timezone';
 end if;
 return new;
end; $$;
revoke all on function public.acelingua_validate_learning_timezone() from public,anon,authenticated;
create trigger daily_preferences_timezone before insert or update on public.user_daily_goal_preferences
for each row execute function public.acelingua_validate_learning_timezone();

-- One server-defined day boundary shared by missions, goals, and streaks.
-- The backend must create these windows serially without overlap while holding the profile lock.
create table public.user_learning_days (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 local_date date not null,
 timezone text not null,
 starts_at timestamptz not null,
 resets_at timestamptz not null check (resets_at > starts_at),
 goal_target integer not null check (goal_target in (1,3,5,8)),
 bonus_coins integer not null default 50 check (bonus_coins >= 0),
 bonus_gems integer not null default 3 check (bonus_gems >= 0),
 unique(user_id,local_date), unique(user_id,starts_at), unique(id,user_id)
);

-- Only trusted completion hooks may insert events. No client-supplied timestamps or success flags.
-- Each source can qualify at most once in its lifetime, including across local midnight.
create table public.verified_learning_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 day_id uuid not null,
 lesson_id uuid not null references public.lessons(id),
 activity_id uuid references public.activities(id),
 event_kind text not null check (event_kind in ('lesson','activity','vocabulary','culture')),
 source_id uuid not null,
 occurred_at timestamptz not null default now(),
 unique(user_id,event_kind,source_id),
 foreign key(day_id,user_id) references public.user_learning_days(id,user_id),
 check (event_kind <> 'lesson' or source_id=lesson_id),
 check (event_kind <> 'activity' or (activity_id is not null and source_id=activity_id))
);
create index verified_learning_events_day on public.verified_learning_events(user_id,day_id,event_kind);

-- Snapshot definitions/prices per day: later catalog edits never rewrite yesterday's missions.
create table public.user_daily_missions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 day_id uuid not null,
 definition_id text not null references public.daily_mission_definitions(id),
 title text not null,
 description text not null,
 event_kind text not null check (event_kind in ('lesson','vocabulary','culture')),
 target integer not null check (target>0),
 reward_coins integer not null check (reward_coins>=0),
 reward_gems integer not null check (reward_gems>=0),
 unique(day_id,definition_id), unique(id,user_id,day_id),
 foreign key(day_id,user_id) references public.user_learning_days(id,user_id)
);
create index user_daily_missions_owner on public.user_daily_missions(user_id,day_id);

create table public.daily_reward_claims (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 day_id uuid not null,
 mission_id uuid,
 claim_kind text not null check (claim_kind in ('mission','bonus')),
 coins integer not null check (coins>=0),
 gems integer not null check (gems>=0),
 claimed_at timestamptz not null default now(),
 check ((claim_kind='mission')=(mission_id is not null)),
 foreign key(day_id,user_id) references public.user_learning_days(id,user_id),
 foreign key(mission_id,user_id,day_id) references public.user_daily_missions(id,user_id,day_id),
 unique(id,user_id)
);
create unique index daily_mission_claim_once on public.daily_reward_claims(mission_id) where mission_id is not null;
create unique index daily_bonus_claim_once on public.daily_reward_claims(user_id,day_id) where claim_kind='bonus';

create table public.streak_freeze_inventory (
 user_id uuid primary key references auth.users(id) on delete cascade,
 available integer not null default 0,
 capacity integer not null default 2 check (capacity between 0 and 2),
 check (available between 0 and capacity)
);
create table public.streak_freeze_grants (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_key text not null,
 amount integer not null check (amount between 1 and 2),
 granted_at timestamptz not null default now(),
 unique(user_id,source_key)
);
create table public.streak_freeze_uses (
 user_id uuid not null references auth.users(id) on delete cascade,
 local_date date not null,
 timezone text not null,
 used_at timestamptz not null default now(),
 primary key(user_id,local_date)
);

create table public.streak_milestone_definitions (
 days integer primary key check (days>0),
 coins integer not null check (coins>=0), gems integer not null check (gems>=0)
);
insert into public.streak_milestone_definitions values
 (3,30,0),(7,75,2),(14,120,3),(30,250,5),(60,400,8),(100,700,12),(365,1500,30);
create table public.streak_milestone_claims (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 days integer not null references public.streak_milestone_definitions(days),
 coins integer not null check (coins>=0), gems integer not null check (gems>=0),
 claimed_at timestamptz not null default now(),
 unique(user_id,days), unique(id,user_id)
);

-- Append-only audit ledger for new gem rewards; profiles.gems remains the only balance.
create table public.gem_transactions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 amount integer not null check (amount<>0),
 daily_claim_id uuid,
 milestone_claim_id uuid,
 created_at timestamptz not null default now(),
 check (num_nonnulls(daily_claim_id,milestone_claim_id)=1),
 foreign key(daily_claim_id,user_id) references public.daily_reward_claims(id,user_id),
 foreign key(milestone_claim_id,user_id) references public.streak_milestone_claims(id,user_id),
 unique(daily_claim_id), unique(milestone_claim_id)
);
create index gem_transactions_owner on public.gem_transactions(user_id,created_at);

-- Fail closed: private tables are owner-readable; no direct user writes or public access.
do $$
declare table_name text;
begin
 foreach table_name in array array['daily_mission_definitions','user_daily_goal_preferences',
  'user_learning_days','verified_learning_events','user_daily_missions','daily_reward_claims',
  'streak_freeze_inventory','streak_freeze_grants','streak_freeze_uses',
  'streak_milestone_definitions','streak_milestone_claims','gem_transactions'] loop
  execute format('alter table public.%I enable row level security',table_name);
  execute format('revoke all on public.%I from public,anon,authenticated',table_name);
  execute format('grant select on public.%I to authenticated',table_name);
  execute format('grant all on public.%I to service_role',table_name);
  if table_name in ('daily_mission_definitions','streak_milestone_definitions') then
   execute format('create policy catalog_read on public.%I for select to authenticated using(true)',table_name);
  else
   execute format('create policy owner_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',table_name);
  end if;
 end loop;
end; $$;
-- Reuse the installed unique keys; never rewrite existing goals or history.
alter table public.coin_transactions drop constraint coin_transactions_transaction_type_check;
alter table public.coin_transactions add constraint coin_transactions_transaction_type_check check
 (transaction_type in ('lesson','activity','quiz','speaking','conversation','mini_game','achievement',
 'daily_goal','purchase','daily_mission','daily_bonus','streak_milestone'));

create table public.learner_streak_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 current_streak integer not null default 0 check(current_streak>=0),
 longest_streak integer not null default 0 check(longest_streak>=0),
 last_counted_date date,
 legacy_unanchored boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.learner_streak_state enable row level security;
revoke all on public.learner_streak_state from public,anon,authenticated;
grant select on public.learner_streak_state to authenticated;
grant all on public.learner_streak_state to service_role;
create policy streak_state_owner on public.learner_streak_state for select to authenticated
using(user_id=(select auth.uid()));

-- RLS does not restrict which columns can be changed. Revoke table AND column grants.
do $$
declare col record; tbl text;
begin
 foreach tbl in array array['profiles','daily_goals','streak_history','lesson_progress',
 'activity_progress','question_answers','xp_transactions','coin_transactions','user_achievements'] loop
  execute format('alter table public.%I enable row level security',tbl);
  execute format('revoke all on public.%I from public,anon,authenticated',tbl);
  for col in select column_name from information_schema.columns where table_schema='public' and table_name=tbl loop
   execute format('revoke insert(%I),update(%I),references(%I) on public.%I from public,anon,authenticated',
    col.column_name,col.column_name,col.column_name,tbl);
  end loop;
  execute format('grant select on public.%I to authenticated',tbl);
 end loop;
end; $$;
grant insert(id,username,display_name),update(username,display_name) on public.profiles to authenticated;
create policy daily_learning_goal_read on public.daily_goals for select to authenticated using(user_id=(select auth.uid()));
create policy daily_learning_history_read on public.streak_history for select to authenticated using(user_id=(select auth.uid()));
create policy daily_learning_achievement_read on public.user_achievements for select to authenticated using(user_id=(select auth.uid()));

-- Internal functions are callable only by trusted database functions/administrators.
create function public.acelingua_daily_day(p_user uuid,p_now timestamptz)
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
 insert into public.user_daily_missions(user_id,day_id,definition_id,title,description,event_kind,target,reward_coins,reward_gems)
 select p_user,day_row.id,id,title,description,event_kind,target,reward_coins,reward_gems
 from public.daily_mission_definitions where is_enabled;
 insert into public.daily_goals(user_id,goal_date,target_activities)
 values(p_user,day_row.local_date,day_row.goal_target) on conflict(user_id,goal_date) do nothing;
 insert into public.streak_freeze_inventory(user_id) values(p_user) on conflict do nothing;
 return day_row;
end; $$;

create function public.acelingua_sync_learning_streak(p_user uuid,p_date date,p_active boolean,p_zone text)
returns void language plpgsql security definer set search_path='' as $$
declare st public.learner_streak_state; legacy integer; latest date; tail integer:=0; longest integer:=0;
 available_freezes integer; gap integer; d date;
begin
 perform 1 from public.profiles where id=p_user for update;
 select * into st from public.learner_streak_state where user_id=p_user;
 if not found then
  select streak into legacy from public.profiles where id=p_user;
  select max(activity_date) into latest from public.streak_history where user_id=p_user and is_active and activity_date<=p_date;
  select coalesce(max(n),0) into longest from (
   select count(*)::integer n from (
    select activity_date-row_number() over(order by activity_date)::integer as run
    from public.streak_history where user_id=p_user and is_active and activity_date<=p_date
   ) h group by run
  ) runs;
  if latest is not null then
   select count(*)::integer into tail from (
    select activity_date,latest-(row_number() over(order by activity_date desc)::integer-1) expected
    from public.streak_history where user_id=p_user and is_active and activity_date<=latest
   ) h where activity_date=expected;
  end if;
  insert into public.learner_streak_state(user_id,current_streak,longest_streak,last_counted_date,legacy_unanchored)
  values(p_user,greatest(coalesce(legacy,0),tail),greatest(coalesce(legacy,0),longest),
   coalesce(latest,case when legacy>0 then p_date-1 end),latest is null and legacy>0) returning * into st;
 end if;
 -- Never consume freezes for pre-feature historical gaps.
 if st.last_counted_date is not null and st.last_counted_date<p_date-1 then
  gap:=p_date-1-st.last_counted_date;
  select available into available_freezes from public.streak_freeze_inventory where user_id=p_user;
  if gap<=coalesce(available_freezes,0) and st.last_counted_date>=(st.created_at at time zone p_zone)::date-1 then
   for d in select generate_series((st.last_counted_date+1)::timestamp,(p_date-1)::timestamp,interval '1 day')::date loop
    insert into public.streak_freeze_uses(user_id,local_date,timezone) values(p_user,d,p_zone);
   end loop;
   update public.streak_freeze_inventory set available=available-gap where user_id=p_user;
   st.last_counted_date:=p_date-1;
  else
   st.current_streak:=0; st.last_counted_date:=null;
  end if;
 end if;
 if p_active and st.last_counted_date is distinct from p_date then
  st.current_streak:=case when st.last_counted_date=p_date-1 then st.current_streak+1 else 1 end;
  st.last_counted_date:=p_date;
  st.legacy_unanchored:=false;
 end if;
 st.longest_streak:=greatest(st.longest_streak,st.current_streak);
 update public.learner_streak_state set current_streak=st.current_streak,longest_streak=st.longest_streak,
  last_counted_date=st.last_counted_date,legacy_unanchored=st.legacy_unanchored where user_id=p_user;
 update public.profiles set streak=st.current_streak where id=p_user;
end; $$;

create function public.acelingua_daily_learning_after_lesson()
returns trigger language plpgsql security definer set search_path='' as $$
declare day_row public.user_learning_days; activity record; gained integer:=0; n integer;
 server_now timestamptz:=clock_timestamp(); total integer;
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
create trigger daily_learning_after_lesson after insert or update of status on public.lesson_progress
for each row execute function public.acelingua_daily_learning_after_lesson();

-- Verified progress is derived; opening a page cannot create a completion event.
create function public.acelingua_mission_progress(p_mission uuid)
returns integer language sql stable security definer set search_path='' as $$
 select least(m.target,count(e.id)::integer) from public.user_daily_missions m
 left join public.verified_learning_events e on e.user_id=m.user_id and e.day_id=m.day_id and e.event_kind=m.event_kind
 where m.id=p_mission group by m.id,m.target;
$$;

create function public.acelingua_claim_daily_reward(p_mission_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); day_row public.user_learning_days; mission public.user_daily_missions;
 claim public.daily_reward_claims; c integer; g integer; kind text; now_server timestamptz:=clock_timestamp();
begin
 if learner is null then raise exception 'Sign in to claim rewards'; end if;
 day_row:=public.acelingua_daily_day(learner,now_server);
 if p_mission_id is not null then
  select * into mission from public.user_daily_missions where id=p_mission_id and user_id=learner and day_id=day_row.id;
  if not found then raise exception 'This mission is not available today'; end if;
  select * into claim from public.daily_reward_claims where mission_id=mission.id;
  if found then return jsonb_build_object('already_claimed',true,'coins',0,'gems',0); end if;
  if public.acelingua_mission_progress(mission.id)<mission.target then raise exception 'Complete the mission first'; end if;
  c:=mission.reward_coins;g:=mission.reward_gems;kind:='mission';
 else
  select * into claim from public.daily_reward_claims where user_id=learner and day_id=day_row.id and claim_kind='bonus';
  if found then return jsonb_build_object('already_claimed',true,'coins',0,'gems',0); end if;
  if not exists(select 1 from public.user_daily_missions where day_id=day_row.id)
  or exists(select 1 from public.user_daily_missions m where m.day_id=day_row.id and public.acelingua_mission_progress(m.id)<m.target)
  then raise exception 'Complete all available missions first'; end if;
  c:=day_row.bonus_coins;g:=day_row.bonus_gems;kind:='bonus';
 end if;
 insert into public.daily_reward_claims(user_id,day_id,mission_id,claim_kind,coins,gems)
 values(learner,day_row.id,p_mission_id,kind,c,g) returning * into claim;
 update public.profiles set coins=coins+c,gems=gems+g,updated_at=now_server where id=learner;
 if c>0 then insert into public.coin_transactions(user_id,amount,transaction_type,source_id,description)
 values(learner,c,case when kind='bonus' then 'daily_bonus' else 'daily_mission' end,claim.id,'Daily learning reward'); end if;
 if g>0 then insert into public.gem_transactions(user_id,amount,daily_claim_id) values(learner,g,claim.id); end if;
 return jsonb_build_object('already_claimed',false,'coins',c,'gems',g);
end; $$;

create function public.acelingua_claim_streak_milestone(p_days integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); day_row public.user_learning_days; reward public.streak_milestone_definitions;
 claim public.streak_milestone_claims; st public.learner_streak_state; prior_coins integer; actual_coins integer;
begin
 if learner is null then raise exception 'Sign in to claim rewards'; end if;
 day_row:=public.acelingua_daily_day(learner,clock_timestamp());
 perform public.acelingua_sync_learning_streak(learner,day_row.local_date,false,day_row.timezone);
 select * into reward from public.streak_milestone_definitions where days=p_days;
 if not found then raise exception 'Unknown milestone'; end if;
 if exists(select 1 from public.streak_milestone_claims where user_id=learner and days=p_days) then
 return jsonb_build_object('already_claimed',true,'coins',0,'gems',0); end if;
 select * into st from public.learner_streak_state where user_id=learner;
 if st.longest_streak<p_days or st.legacy_unanchored then raise exception 'Milestone not verified yet'; end if;
 -- Offset coin rewards actually logged for an equivalent legacy streak achievement.
 select coalesce(sum(t.amount),0)::integer into prior_coins from public.coin_transactions t
 where t.user_id=learner and t.transaction_type='achievement' and t.amount>0 and exists(
  select 1 from public.achievements a left join public.user_achievements ua on ua.achievement_id=a.id and ua.user_id=learner
  where a.requirement_type='streak' and a.requirement_value=p_days and (t.source_id=a.id or t.source_id=ua.id));
 actual_coins:=greatest(0,reward.coins-prior_coins);
 insert into public.streak_milestone_claims(user_id,days,coins,gems) values(learner,p_days,actual_coins,reward.gems) returning * into claim;
 update public.profiles set coins=coins+actual_coins,gems=gems+reward.gems,updated_at=clock_timestamp() where id=learner;
 if actual_coins>0 then insert into public.coin_transactions(user_id,amount,transaction_type,source_id,description)
 values(learner,actual_coins,'streak_milestone',claim.id,p_days::text||'-day streak milestone'); end if;
 if reward.gems>0 then insert into public.gem_transactions(user_id,amount,milestone_claim_id) values(learner,reward.gems,claim.id); end if;
 return jsonb_build_object('already_claimed',false,'coins',actual_coins,'gems',reward.gems);
end; $$;

create function public.acelingua_set_daily_preferences(p_target integer,p_timezone text)
returns void language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); day_row public.user_learning_days; pref public.user_daily_goal_preferences;
begin
 if learner is null then raise exception 'Sign in to change your daily goal'; end if;
 if p_target is null or p_target not in (1,3,5,8) or p_timezone is null
 or not exists(select 1 from pg_catalog.pg_timezone_names where name=p_timezone) then raise exception 'Invalid goal or timezone'; end if;
 day_row:=public.acelingua_daily_day(learner,clock_timestamp());
 select * into pref from public.user_daily_goal_preferences where user_id=learner;
 if p_timezone<>pref.timezone and pref.timezone_changed_at>clock_timestamp()-interval '7 days' then
 raise exception 'Timezone changes are limited to once every seven days'; end if;
 update public.user_daily_goal_preferences set target_activities=p_target,
 pending_timezone=case when p_timezone=timezone then null else p_timezone end,updated_at=clock_timestamp() where user_id=learner;
end; $$;

create function public.acelingua_daily_learning_snapshot(p_month date default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); day_row public.user_learning_days; month_start date; result jsonb;
begin
 if learner is null then raise exception 'Sign in to view daily learning'; end if;
 day_row:=public.acelingua_daily_day(learner,clock_timestamp());
 perform public.acelingua_sync_learning_streak(learner,day_row.local_date,false,day_row.timezone);
 month_start:=date_trunc('month',coalesce(p_month,day_row.local_date))::date;
 select jsonb_build_object('server_now',clock_timestamp(),'today',day_row.local_date,'timezone',day_row.timezone,
 'resets_at',day_row.resets_at,'month',month_start,
 'profile',(select jsonb_build_object('coins',coins,'gems',gems,'xp',xp,'streak',streak) from public.profiles where id=learner),
 'goal',(select to_jsonb(g) from public.daily_goals g where user_id=learner and goal_date=day_row.local_date),
 'preferences',(select to_jsonb(p) from public.user_daily_goal_preferences p where user_id=learner),
 'missions',coalesce((select jsonb_agg(to_jsonb(m)||jsonb_build_object('progress',public.acelingua_mission_progress(m.id),
  'claimed',exists(select 1 from public.daily_reward_claims r where r.mission_id=m.id)) order by m.definition_id)
  from public.user_daily_missions m where m.day_id=day_row.id),'[]'::jsonb),
 'bonus',jsonb_build_object('coins',day_row.bonus_coins,'gems',day_row.bonus_gems,
  'claimed',exists(select 1 from public.daily_reward_claims where user_id=learner and day_id=day_row.id and claim_kind='bonus')),
 'streak',(select to_jsonb(s) from public.learner_streak_state s where user_id=learner),
 'freezes',(select to_jsonb(f) from public.streak_freeze_inventory f where user_id=learner),
 'calendar',coalesce((select jsonb_agg(jsonb_build_object('date',h.activity_date,'active',h.is_active,'activities',h.activities_completed) order by h.activity_date)
  from public.streak_history h where user_id=learner and activity_date>=month_start and activity_date<(month_start+interval '1 month')),'[]'::jsonb),
 'frozen_days',coalesce((select jsonb_agg(local_date order by local_date) from public.streak_freeze_uses where user_id=learner and local_date>=month_start and local_date<(month_start+interval '1 month')),'[]'::jsonb),
 'milestones',(select jsonb_agg(to_jsonb(d)||jsonb_build_object('claimed',exists(select 1 from public.streak_milestone_claims c where c.user_id=learner and c.days=d.days)) order by days) from public.streak_milestone_definitions d)
 ) into result;
 return result;
end; $$;

create function public.acelingua_grant_streak_freeze(p_user uuid,p_source_key text,p_amount integer)
returns integer language plpgsql security definer set search_path='' as $$
declare inventory public.streak_freeze_inventory;
begin
 if p_source_key is null or btrim(p_source_key)='' or p_amount is null or p_amount not between 1 and 2 then raise exception 'Invalid freeze grant'; end if;
 perform 1 from public.profiles where id=p_user for update;
 if not found then raise exception 'Profile unavailable'; end if;
 insert into public.streak_freeze_inventory(user_id) values(p_user) on conflict do nothing;
 select * into inventory from public.streak_freeze_inventory where user_id=p_user;
 if exists(select 1 from public.streak_freeze_grants where user_id=p_user and source_key=p_source_key) then return inventory.available; end if;
 if inventory.available+p_amount>inventory.capacity then raise exception 'Freeze inventory is full'; end if;
 insert into public.streak_freeze_grants(user_id,source_key,amount) values(p_user,p_source_key,p_amount);
 update public.streak_freeze_inventory set available=available+p_amount where user_id=p_user returning available into inventory.available;
 return inventory.available;
end; $$;

-- Explicit function allowlist. Never expose internals with user/time/success parameters.
revoke all on function public.acelingua_daily_day(uuid,timestamptz),
 public.acelingua_sync_learning_streak(uuid,date,boolean,text),public.acelingua_daily_learning_after_lesson(),
 public.acelingua_mission_progress(uuid),public.acelingua_grant_streak_freeze(uuid,text,integer),
 public.acelingua_claim_daily_reward(uuid),public.acelingua_claim_streak_milestone(integer),
 public.acelingua_set_daily_preferences(integer,text),public.acelingua_daily_learning_snapshot(date)
 from public,anon,authenticated;
grant execute on function public.acelingua_claim_daily_reward(uuid),public.acelingua_claim_streak_milestone(integer),
 public.acelingua_set_daily_preferences(integer,text),public.acelingua_daily_learning_snapshot(date) to authenticated;
grant execute on function public.acelingua_grant_streak_freeze(uuid,text,integer) to service_role;

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
