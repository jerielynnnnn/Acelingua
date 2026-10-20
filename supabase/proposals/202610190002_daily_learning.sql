-- PROPOSAL ONLY. NOT APPROVED / NOT APPLIED.
-- Schema foundation for review; deliberately outside migrations/ so db push cannot apply it.
-- Requires audit-daily-learning.sql results before the integration/RPC migration is finalized.
-- Owner's table export confirms legacy goal/history columns and the coin CHECK values.
-- It does not include live triggers, grants, policies, or secondary unique indexes.
-- No triggers on existing tables, historical backfill, balance changes, or reward grants here.
begin;

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
commit;
