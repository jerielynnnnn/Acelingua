-- PROPOSED / NOT APPLIED. Follow-up to 202610200005_listening_hearts.sql.
-- Keeps heart recovery; moves deductions from vocabulary practice to assessed questions only.
begin;
do $$ begin
 if to_regprocedure('public.acelingua_refresh_hearts(uuid)') is null then
  raise exception 'Install the heart recovery foundation 202610200005 before this update';
 end if;
end; $$;
revoke execute on function public.acelingua_submit_vocabulary_listening(uuid,uuid,uuid,uuid) from public,anon,authenticated;
create table public.lesson_quiz_submissions (
 user_id uuid not null references auth.users(id) on delete cascade,
 lesson_id uuid not null references public.lessons(id),
 attempt integer not null,
 question_id uuid not null references public.questions(id),
 answer text not null check(length(answer)<=2000),
 is_correct boolean not null,
 submitted_at timestamptz not null default now(),
 primary key(user_id,lesson_id,attempt,question_id)
);
alter table public.lesson_quiz_submissions enable row level security;
revoke all on public.lesson_quiz_submissions from public,anon,authenticated;
grant select on public.lesson_quiz_submissions to authenticated;
grant all on public.lesson_quiz_submissions to service_role;
create policy owner_read on public.lesson_quiz_submissions for select to authenticated using(user_id=(select auth.uid()));
create function public.acelingua_submit_quiz_answer(p_lesson uuid,p_question uuid,p_answer text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); attempt_number integer; q public.questions;
 receipt public.lesson_quiz_submissions; state jsonb; correct boolean;
begin
 if learner is null then raise exception 'Sign in to submit quiz answers'; end if;
 if p_answer is null or btrim(p_answer)='' or length(p_answer)>2000 then raise exception 'Answer required'; end if;
 perform public.acelingua_lesson_course(p_lesson);
 -- Match lesson completion's course lock order before taking the shared profile lock.
 perform pg_advisory_xact_lock(hashtextextended(learner::text||':'||public.acelingua_lesson_course(p_lesson)::text,0));
 select attempts into attempt_number from public.lesson_progress
 where user_id=learner and lesson_id=p_lesson and status in ('in_progress','completed');
 if not found then raise exception 'Start this lesson before submitting'; end if;
 select question.* into q from public.questions question join public.activities a on a.id=question.activity_id
 where question.id=p_question and a.lesson_id=p_lesson;
 if not found or q.question_type not in ('multiple_choice','true_false','translation') then raise exception 'Question unavailable'; end if;
 state:=public.acelingua_refresh_hearts(learner);
 select * into receipt from public.lesson_quiz_submissions
 where user_id=learner and lesson_id=p_lesson and attempt=attempt_number and question_id=p_question;
 if found then
  return state||jsonb_build_object('blocked',false,'duplicate',true,'correct',receipt.is_correct,'answer',receipt.answer);
 end if;
 if (state->>'hearts')::integer=0 then return state||jsonb_build_object('blocked',true); end if;
 if q.question_type in ('multiple_choice','true_false') and not exists(
  select 1 from jsonb_array_elements_text(q.options) choice where choice=p_answer
 ) then raise exception 'Choose an available answer'; end if;
 correct:=public.acelingua_normalize_answer(p_answer)=public.acelingua_normalize_answer(q.correct_answer);
 insert into public.lesson_quiz_submissions(user_id,lesson_id,attempt,question_id,answer,is_correct)
 values(learner,p_lesson,attempt_number,p_question,p_answer,correct);
 if not correct then
  update public.profiles set hearts=hearts-1,updated_at=clock_timestamp() where id=learner;
  update public.learner_heart_recovery set next_heart_at=coalesce(next_heart_at,clock_timestamp()+interval '10 minutes') where user_id=learner;
 end if;
 return public.acelingua_refresh_hearts(learner)||jsonb_build_object('blocked',false,'duplicate',false,'correct',correct,'answer',p_answer);
end; $$;
revoke all on function public.acelingua_submit_quiz_answer(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.acelingua_submit_quiz_answer(uuid,uuid,text) to authenticated;
commit;
