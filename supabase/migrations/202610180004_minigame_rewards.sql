-- REVIEW ONLY: manually apply after reviewing reward rates and profile triggers.
-- One rewarded Travel Match completion per UTC day; practice is unlimited.
begin;
create table public.minigame_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 tiles text[] not null, answer_keys integer[] not null, started_at timestamptz not null default now(), completed_at timestamptz
);
create index minigame_sessions_owner on public.minigame_sessions(user_id,started_at);
create table public.minigame_daily_rewards (
 user_id uuid not null references auth.users(id) on delete cascade, reward_date date not null,
 session_id uuid not null unique references public.minigame_sessions(id), primary key(user_id,reward_date)
);
alter table public.minigame_sessions enable row level security;
alter table public.minigame_daily_rewards enable row level security;
revoke all on public.minigame_sessions,public.minigame_daily_rewards from anon,authenticated;
grant all on public.minigame_sessions,public.minigame_daily_rewards to service_role;
create function public.start_travel_match() returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); session public.minigame_sessions%rowtype;
begin
 if learner is null then raise exception 'Sign in to play'; end if;
 perform 1 from public.profiles where id=learner for update;
 if not found then raise exception 'Profile unavailable'; end if;
 -- Reuse a recent unfinished board instead of creating unlimited sessions.
 select * into session from public.minigame_sessions where user_id=learner and completed_at is null and started_at>now()-interval '20 minutes' order by started_at desc limit 1;
 if not found then
   insert into public.minigame_sessions(user_id,tiles,answer_keys)
   select learner,array_agg(label order by shuffle),array_agg(pair_key order by shuffle)
   from (select label,pair_key,random() shuffle from (values
    ('Cat',1),('🐱',1),('Sun',2),('☀️',2),('Apple',3),('🍎',3),
    ('Book',4),('📚',4),('House',5),('🏠',5),('Tree',6),('🌳',6)
   ) vocabulary(label,pair_key)) shuffled returning * into session;
 end if;
 return jsonb_build_object('id',session.id,'tiles',session.tiles);
end; $$;
create function public.finish_travel_match(p_session_id uuid,p_pairs jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); session public.minigame_sessions%rowtype; pair jsonb;
 used integer[]:='{}'; a integer; b integer; rewarded boolean:=false; reward_day date:=(now() at time zone 'UTC')::date;
begin
 if learner is null then raise exception 'Sign in to save your game'; end if;
 perform 1 from public.profiles where id=learner for update;
 if not found then raise exception 'Profile unavailable'; end if;
 select * into session from public.minigame_sessions where id=p_session_id and user_id=learner for update;
 if not found then raise exception 'Game unavailable'; end if;
 if session.completed_at is not null then return jsonb_build_object('coins',0,'gems',0,'already_completed',true); end if;
 if session.started_at<now()-interval '20 minutes' then raise exception 'This game expired. Start a new round'; end if;
 if session.started_at>now()-interval '10 seconds' then raise exception 'Take a moment to finish the challenge, then retry'; end if;
 if p_pairs is null or jsonb_typeof(p_pairs)<>'array' or jsonb_array_length(p_pairs)<>6 then raise exception 'Match all six pairs first'; end if;
 for pair in select value from jsonb_array_elements(p_pairs) loop
  if jsonb_typeof(pair)<>'array' or jsonb_array_length(pair)<>2 then raise exception 'Invalid pair'; end if;
  a:=(pair->>0)::integer; b:=(pair->>1)::integer;
  if a is null or b is null or a<0 or a>11 or b<0 or b>11 or a=b or a=any(used) or b=any(used) then raise exception 'Invalid card selection'; end if;
  if session.answer_keys[a+1]<>session.answer_keys[b+1] then raise exception 'Some pairs do not match'; end if;
  used:=used||array[a,b];
 end loop;
 insert into public.minigame_daily_rewards(user_id,reward_date,session_id) values(learner,reward_day,session.id) on conflict(user_id,reward_date) do nothing;
 rewarded:=found;
 if rewarded then update public.profiles set coins=coins+20,gems=gems+2,updated_at=now() where id=learner; end if;
 update public.minigame_sessions set completed_at=now() where id=session.id;
 return jsonb_build_object('coins',case when rewarded then 20 else 0 end,'gems',case when rewarded then 2 else 0 end,'already_completed',false);
end; $$;
revoke all on function public.start_travel_match() from public,anon;
revoke all on function public.finish_travel_match(uuid,jsonb) from public,anon;
grant execute on function public.start_travel_match() to authenticated;
grant execute on function public.finish_travel_match(uuid,jsonb) to authenticated;
commit;
