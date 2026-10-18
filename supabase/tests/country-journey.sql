-- NOT EXECUTED. Run only in an approved test database after 007 and 008.
-- Requires an existing test profile enrolled in Japan Beginner with NO Japan
-- arrival and an uncompleted first lesson. Every write below is rolled back.
begin;
do $test$
declare learner uuid; course uuid:='c293f603-993b-4332-8dd8-afc0fd50ae04'; first_lesson uuid;
 later_lesson uuid; ticket public.travel_boarding_passes; country uuid; denied boolean; stamps_before bigint;
begin
 select id into strict country from public.travel_countries where code='jp';
 select e.user_id into learner from public.user_courses e where e.course_id=course and e.status='active'
 and not exists(select 1 from public.travel_visits v where v.user_id=e.user_id and v.country_id=country and v.introduction_completed_at is not null)
 and not exists(select 1 from public.lesson_progress p join public.lessons l on l.id=p.lesson_id join public.units u on u.id=l.unit_id where u.course_id=course and p.user_id=e.user_id and p.status='completed')
 order by e.user_id limit 1;
 if learner is null then raise exception 'Use a new enrolled test learner without arrival/completions'; end if;
 select l.id into first_lesson from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=course and u.is_published and l.is_published order by u.unit_order,u.id,l.lesson_order,l.id limit 1;
 select l.id into later_lesson from public.lessons l join public.units u on u.id=l.unit_id where u.course_id=course and u.is_published and l.is_published order by u.unit_order,u.id,l.lesson_order,l.id offset 1 limit 1;
 if first_lesson is null or later_lesson is null then raise exception 'Two published lessons required'; end if;
 perform set_config('request.jwt.claim.sub',learner::text,true);
 set local role authenticated;
 denied:=false;
 begin perform public.acelingua_start_lesson(first_lesson);
 exception when others then if sqlerrm not like '%country arrival%' then raise; end if; denied:=true; end;
 if not denied then raise exception 'API bypass accepted before arrival'; end if;
 denied:=false;
 begin perform public.acelingua_complete_assessed_lesson(first_lesson,'[]'::jsonb,array[]::uuid[]);
 exception when others then if sqlerrm not like '%country arrival%' then raise; end if; denied:=true; end;
 if not denied then raise exception 'Completion API bypass accepted before arrival'; end if;
 ticket:=public.acelingua_ensure_boarding_pass('jp','ja');
 ticket:=public.acelingua_board_travel_flight(ticket.id);
 ticket:=public.acelingua_finish_travel_arrival(ticket.id);
 perform public.acelingua_start_lesson(first_lesson);
 denied:=false;
 begin perform public.acelingua_start_lesson(later_lesson);
 exception when others then if sqlerrm not like '%still locked%' then raise; end if; denied:=true; end;
 if not denied then raise exception 'Sequential lesson bypass accepted'; end if;
 denied:=false;
 begin insert into public.lesson_progress(user_id,lesson_id,status,attempts) values(learner,later_lesson,'completed',1);
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Forged progress accepted'; end if;
 select count(*) into stamps_before from public.user_passport_stamps where user_id=learner;
 perform public.acelingua_refresh_country_stamps(course);
 perform public.acelingua_refresh_country_stamps(course);
 if (select count(*) from public.user_passport_stamps where user_id=learner)<>stamps_before then raise exception 'Incomplete curriculum awarded a destination stamp'; end if;
 reset role;
 raise notice 'PASS: API arrival enforcement, returning start, sequential locks, forged progress denial, incomplete stamp denial';
end;
$test$;
rollback;
