-- NOT APPLIED. Requires 202610180005_virtual_travel.sql.
-- First working milestone: identity, boarding, and first-arrival stamps only.
begin;
insert into public.travel_countries(code,name,flag_emoji,capital,welcome_message,cover_image_url)
values ('fr','France','🇫🇷','Paris','Bienvenue en France!','/dashboard/france.jpg'),
 ('jp','Japan','🇯🇵','Tokyo','日本へようこそ!','/dashboard/japan.jpg'),
 ('kr','South Korea','🇰🇷','Seoul','한국에 오신 것을 환영합니다!','/dashboard/korea.jpg'),
 ('es','Spain','🇪🇸','Madrid','¡Bienvenidos a España!','/dashboard/spain.jpg'),
 ('de','Germany','🇩🇪','Berlin','Willkommen in Deutschland!','/dashboard/germany.jpg'),
 ('cn','China','🇨🇳','Beijing','欢迎来到中国!','/dashboard/china.jpg'),
 ('th','Thailand','🇹🇭','Bangkok','ยินดีต้อนรับสู่ประเทศไทย!','/dashboard/thai.jpg')
on conflict(code) do nothing;
insert into public.travel_country_languages(country_id,language_id)
select c.id,l.id from (values ('fr','fr'),('jp','ja'),('kr','ko'),('es','es'),('de','de'),('cn','zh'),('th','th')) mapping(country,language)
join public.travel_countries c on c.code=mapping.country
join public.languages l on l.code=mapping.language
on conflict do nothing;
insert into public.passport_stamp_definitions(country_id,slug,name,description,requirement_type)
select id,'first-arrival',name || ' Arrival','Completed your first virtual arrival in ' || name || '.','arrival'
from public.travel_countries c where c.code in ('fr','jp','kr','es','de','cn','th')
and not exists(select 1 from public.passport_stamp_definitions d where d.country_id=c.id and d.requirement_type='arrival');

create function public.acelingua_ensure_travel_passport()
returns public.travel_passports language plpgsql security definer set search_path='' as $$
declare learner uuid := auth.uid(); result public.travel_passports;
begin
 if learner is null then raise exception 'Sign in to open your passport'; end if;
 if not exists(select 1 from public.profiles where id=learner) then raise exception 'Learner profile is missing'; end if;
 insert into public.travel_passports(user_id) values(learner) on conflict(user_id) do nothing;
 select * into strict result from public.travel_passports where user_id=learner;
 return result;
end;
$$;
create function public.acelingua_ensure_boarding_pass(p_country_code text,p_language_code text)
returns public.travel_boarding_passes language plpgsql security definer set search_path='' as $$
declare learner uuid := auth.uid(); destination public.travel_countries; result public.travel_boarding_passes; passenger text;
begin
 if learner is null then raise exception 'Sign in to board'; end if;
 select c.* into destination from public.travel_countries c where c.code=p_country_code and c.is_active;
 if not found then raise exception 'Destination unavailable'; end if;
 if not exists(select 1 from public.travel_country_languages cl join public.languages l on l.id=cl.language_id
   where cl.country_id=destination.id and l.code=p_language_code and l.is_active) then raise exception 'Language unavailable for this destination'; end if;
 perform pg_advisory_xact_lock(hashtextextended(learner::text || ':travel:' || destination.id::text,0));
 perform public.acelingua_ensure_travel_passport();
 -- Reopening a country reuses its most recent non-cancelled ticket, including
 -- arrived tickets. An explicit new-trip feature can be added separately.
 select * into result from public.travel_boarding_passes where user_id=learner and country_id=destination.id
   and status<>'cancelled' order by created_at desc,id limit 1;
 if found then return result; end if;
 select left(coalesce(nullif(btrim(display_name),''),nullif(btrim(username),''),'Explorer'),120)
   into passenger from public.profiles where id=learner;
 insert into public.travel_boarding_passes(user_id,country_id,passenger_name,flight_code,destination_label,seat_label)
 values(learner,destination.id,passenger,'ACE-' || upper(destination.code) || '-01',destination.name,
   (1+floor(random()*24))::int::text || 'A') returning * into result;
 return result;
end;
$$;
create function public.acelingua_board_travel_flight(p_ticket_id uuid)
returns public.travel_boarding_passes language plpgsql security definer set search_path='' as $$
declare learner uuid := auth.uid(); result public.travel_boarding_passes;
begin
 if learner is null then raise exception 'Sign in to board'; end if;
 select * into result from public.travel_boarding_passes where id=p_ticket_id and user_id=learner for update;
 if not found then raise exception 'Boarding pass not found'; end if;
 if result.status='cancelled' then raise exception 'This trip was cancelled'; end if;
 if not exists(select 1 from public.travel_countries where id=result.country_id and is_active) then raise exception 'Destination unavailable'; end if;
 if result.status='issued' then
   update public.travel_boarding_passes set status='boarded',boarded_at=now() where id=result.id returning * into result;
 end if;
 return result;
end;
$$;
create function public.acelingua_finish_travel_arrival(p_ticket_id uuid)
returns public.travel_boarding_passes language plpgsql security definer set search_path='' as $$
declare learner uuid := auth.uid(); result public.travel_boarding_passes;
begin
 if learner is null then raise exception 'Sign in to arrive'; end if;
 select * into result from public.travel_boarding_passes where id=p_ticket_id and user_id=learner for update;
 if not found then raise exception 'Boarding pass not found'; end if;
 if result.status not in ('boarded','arrived') then raise exception 'Board your flight first'; end if;
 if not exists(select 1 from public.travel_countries where id=result.country_id and is_active) then raise exception 'Destination unavailable'; end if;
 if result.status='boarded' then
   update public.travel_boarding_passes set status='arrived',arrived_at=now() where id=result.id returning * into result;
   insert into public.travel_visits(user_id,country_id,introduction_completed_at)
   values(learner,result.country_id,now()) on conflict(user_id,country_id) do update
   set last_visited_at=now(),visit_count=public.travel_visits.visit_count+1,
     introduction_completed_at=coalesce(public.travel_visits.introduction_completed_at,now());
 end if;
 -- Only arrival stamps: never trusts lesson flags or modifies lesson rewards.
 insert into public.user_passport_stamps(user_id,stamp_id)
 select learner,id from public.passport_stamp_definitions where country_id=result.country_id and requirement_type='arrival' and is_active
 on conflict(user_id,stamp_id) do nothing;
 return result;
end;
$$;
revoke all on function public.acelingua_ensure_travel_passport() from public,anon;
revoke all on function public.acelingua_ensure_boarding_pass(text,text) from public,anon;
revoke all on function public.acelingua_board_travel_flight(uuid) from public,anon;
revoke all on function public.acelingua_finish_travel_arrival(uuid) from public,anon;
grant execute on function public.acelingua_ensure_travel_passport() to authenticated;
grant execute on function public.acelingua_ensure_boarding_pass(text,text) to authenticated;
grant execute on function public.acelingua_board_travel_flight(uuid) to authenticated;
grant execute on function public.acelingua_finish_travel_arrival(uuid) to authenticated;
commit;
