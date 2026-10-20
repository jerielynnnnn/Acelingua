-- PROPOSED / NOT APPLIED. Review before applying.
-- One heart per wrong submitted vocabulary choice; one heart recovers every 10 minutes, maximum 5.
begin;
create table public.learner_heart_recovery (
 user_id uuid primary key references auth.users(id) on delete cascade,
 next_heart_at timestamptz
);
create table public.vocabulary_listening_submissions (
 user_id uuid not null references auth.users(id) on delete cascade,
 request_id uuid not null,
 lesson_id uuid not null references public.lessons(id),
 target_id uuid not null references public.vocabulary(id),
 choice_id uuid not null references public.vocabulary(id),
 is_correct boolean not null,
 submitted_at timestamptz not null default now(),
 primary key(user_id,request_id)
);
alter table public.learner_heart_recovery enable row level security;
alter table public.vocabulary_listening_submissions enable row level security;
revoke all on public.learner_heart_recovery,public.vocabulary_listening_submissions from public,anon,authenticated;
grant select on public.learner_heart_recovery,public.vocabulary_listening_submissions to authenticated;
grant all on public.learner_heart_recovery,public.vocabulary_listening_submissions to service_role;
create policy owner_read on public.learner_heart_recovery for select to authenticated using(user_id=(select auth.uid()));
create policy owner_read on public.vocabulary_listening_submissions for select to authenticated using(user_id=(select auth.uid()));

create function public.acelingua_refresh_hearts(p_user uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare balance integer; next_at timestamptz; server_now timestamptz:=clock_timestamp(); gained integer;
begin
 select hearts into balance from public.profiles where id=p_user for update;
 if not found then raise exception 'Learner profile unavailable'; end if;
 insert into public.learner_heart_recovery(user_id) values(p_user) on conflict do nothing;
 select next_heart_at into next_at from public.learner_heart_recovery where user_id=p_user;
 if balance>=5 then next_at:=null;
 elsif next_at is null then next_at:=server_now+interval '10 minutes';
 elsif server_now>=next_at then
  gained:=least(5-balance,1+floor(extract(epoch from server_now-next_at)/600)::integer);
  balance:=balance+gained;
  next_at:=case when balance>=5 then null else next_at+gained*interval '10 minutes' end;
  update public.profiles set hearts=balance,updated_at=server_now where id=p_user;
 end if;
 update public.learner_heart_recovery set next_heart_at=next_at where user_id=p_user;
 return jsonb_build_object('hearts',balance,'next_heart_at',next_at,'server_now',server_now,'available',true);
end; $$;
create function public.acelingua_hearts_snapshot()
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to view hearts'; end if;
 return public.acelingua_refresh_hearts(auth.uid());
end; $$;

create function public.acelingua_submit_vocabulary_listening(p_lesson uuid,p_target uuid,p_choice uuid,p_request uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); receipt public.vocabulary_listening_submissions; state jsonb; correct boolean; balance integer;
begin
 if learner is null then raise exception 'Sign in to practice'; end if;
 if p_request is null then raise exception 'Submission identifier required'; end if;
 perform public.acelingua_lesson_course(p_lesson);
 if not exists(select 1 from public.lesson_progress where user_id=learner and lesson_id=p_lesson and status in ('in_progress','completed'))
 then raise exception 'Start this lesson before submitting'; end if;
 if not exists(select 1 from public.vocabulary where id=p_target and lesson_id=p_lesson)
 or not exists(select 1 from public.vocabulary where id=p_choice and lesson_id=p_lesson)
 then raise exception 'Invalid vocabulary choice'; end if;
 state:=public.acelingua_refresh_hearts(learner); -- Locks the same profile as store/reward functions.
 select * into receipt from public.vocabulary_listening_submissions where user_id=learner and request_id=p_request;
 if found then
  if (receipt.lesson_id,receipt.target_id,receipt.choice_id) is distinct from (p_lesson,p_target,p_choice) then raise exception 'Submission identifier already used'; end if;
  return state||jsonb_build_object('correct',receipt.is_correct,'duplicate',true,'blocked',false);
 end if;
 balance:=(state->>'hearts')::integer;
 if balance=0 then return state||jsonb_build_object('blocked',true,'correct',false,'duplicate',false); end if;
 correct:=p_target=p_choice;
 insert into public.vocabulary_listening_submissions(user_id,request_id,lesson_id,target_id,choice_id,is_correct)
 values(learner,p_request,p_lesson,p_target,p_choice,correct);
 if not correct then
  update public.profiles set hearts=hearts-1,updated_at=clock_timestamp() where id=learner;
  update public.learner_heart_recovery set next_heart_at=coalesce(next_heart_at,clock_timestamp()+interval '10 minutes') where user_id=learner;
 end if;
 return public.acelingua_refresh_hearts(learner)||jsonb_build_object('correct',correct,'duplicate',false,'blocked',false);
end; $$;
revoke all on function public.acelingua_refresh_hearts(uuid),public.acelingua_hearts_snapshot(),public.acelingua_submit_vocabulary_listening(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.acelingua_hearts_snapshot(),public.acelingua_submit_vocabulary_listening(uuid,uuid,uuid,uuid) to authenticated;
commit;
