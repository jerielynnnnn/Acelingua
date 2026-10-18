-- Run only in an approved test database after migrations 005 and 006.
-- Requires two test profiles and active French language. All writes roll back.
begin;
do $test$
declare learner uuid; other_learner uuid; first_pass public.travel_passports;
 second_pass public.travel_passports; ticket public.travel_boarding_passes;
 again public.travel_boarding_passes; previous_count integer; denied boolean;
begin
 select id into learner from public.profiles order by id limit 1;
 select id into other_learner from public.profiles where id<>learner order by id limit 1;
 if learner is null or other_learner is null then raise exception 'Two test profiles required'; end if;
 if has_table_privilege('authenticated','public.user_passport_stamps','INSERT')
 or has_table_privilege('authenticated','public.travel_visits','UPDATE')
 or has_table_privilege('authenticated','public.travel_passports','INSERT') then raise exception 'Direct travel writes must be denied'; end if;
 if has_function_privilege('anon','public.acelingua_finish_travel_arrival(uuid)','EXECUTE') then raise exception 'Anonymous arrival execution must be denied'; end if;
 perform set_config('request.jwt.claim.sub',learner::text,true);
 set local role authenticated;
 first_pass := public.acelingua_ensure_travel_passport();
 second_pass := public.acelingua_ensure_travel_passport();
 if first_pass.id is distinct from second_pass.id then raise exception 'Passport retry created duplicate'; end if;
 ticket := public.acelingua_ensure_boarding_pass('fr','fr');
 again := public.acelingua_ensure_boarding_pass('fr','fr');
 if ticket.id is distinct from again.id or ticket.ticket_number is distinct from again.ticket_number then raise exception 'Ticket retry changed details'; end if;
 if ticket.user_id<>learner then raise exception 'Wrong ticket owner'; end if;
 if ticket.status='issued' then
   denied := false;
   begin perform public.acelingua_finish_travel_arrival(ticket.id);
   exception when others then if sqlerrm not like '%Board your flight first%' then raise; end if; denied := true; end;
   if not denied then raise exception 'Unboarded arrival accepted'; end if;
 end if;
 ticket := public.acelingua_board_travel_flight(ticket.id);
 ticket := public.acelingua_finish_travel_arrival(ticket.id);
 select visit_count into previous_count from public.travel_visits where user_id=learner and country_id=ticket.country_id;
 again := public.acelingua_finish_travel_arrival(ticket.id);
 if (select visit_count from public.travel_visits where user_id=learner and country_id=ticket.country_id) is distinct from previous_count then raise exception 'Arrival retry counted a second visit'; end if;
 if (select count(*) from public.user_passport_stamps s join public.passport_stamp_definitions d on d.id=s.stamp_id
   where s.user_id=learner and d.country_id=ticket.country_id and d.requirement_type='arrival')<>1 then raise exception 'Expected exactly one arrival stamp'; end if;
 again := public.acelingua_ensure_boarding_pass('fr','fr');
 if again.id<>ticket.id then raise exception 'Returning learner received unwanted new ticket'; end if;
 reset role;
 perform set_config('request.jwt.claim.sub',other_learner::text,true);
 set local role authenticated;
 if exists(select 1 from public.travel_boarding_passes where id=ticket.id)
 or exists(select 1 from public.travel_passports where id=first_pass.id) then raise exception 'Private records leaked across users'; end if;
 denied := false;
 begin perform public.acelingua_finish_travel_arrival(ticket.id);
 exception when others then if sqlerrm not like '%Boarding pass not found%' then raise; end if; denied := true; end;
 if not denied then raise exception 'Cross-user stamp claim accepted'; end if;
 reset role;
 raise notice 'PASS: passport, ticket persistence, boarding prerequisite, arrival/stamp retry, returning visit, ownership, RLS and grants';
end;
$test$;
rollback;
