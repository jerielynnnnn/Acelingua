-- PROPOSED / NOT APPLIED. Stage 1: additive schema only.
-- No passport issuance, boarding, awards, backfills, or existing-table changes.
-- Validated auth.uid()-scoped RPCs are deliberately deferred to approved stages.
begin;

create table public.travel_countries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z]{2}$'),
  name text not null, flag_emoji text not null, capital text not null,
  welcome_message text not null, cover_image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.travel_country_languages (
  country_id uuid not null references public.travel_countries(id),
  language_id uuid not null references public.languages(id),
  primary key (country_id, language_id)
);
create index travel_country_languages_language on public.travel_country_languages(language_id);

-- Explicit destination curriculum; never infer completion from every course
-- in a language. Administrators must curate these rows before enabling awards.
create table public.travel_country_units (
  country_id uuid not null references public.travel_countries(id),
  unit_id uuid not null references public.units(id),
  is_required boolean not null default true,
  primary key (country_id, unit_id)
);
create index travel_country_units_unit on public.travel_country_units(unit_id);

create table public.travel_passports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  passport_number text not null unique default ('ACE-P-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (passport_number ~ '^ACE-P-[0-9A-F]{32}$')
);
create table public.travel_boarding_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_id uuid not null references public.travel_countries(id),
  ticket_number text not null unique default ('ACE-T-' || upper(replace(gen_random_uuid()::text, '-', ''))),
  passenger_name text not null check (length(btrim(passenger_name)) between 1 and 120),
  flight_code text not null, departure_label text not null default 'ACELINGUA World Hub',
  destination_label text not null, seat_label text not null,
  status text not null default 'issued' check (status in ('issued', 'boarded', 'arrived', 'cancelled')),
  created_at timestamptz not null default now(), boarded_at timestamptz, arrived_at timestamptz,
  check (ticket_number ~ '^ACE-T-[0-9A-F]{32}$'),
  check ((status in ('boarded','arrived')) = (boarded_at is not null)),
  check ((status = 'arrived') = (arrived_at is not null)),
  check (boarded_at is null or boarded_at >= created_at),
  check (arrived_at is null or arrived_at >= boarded_at)
);
create unique index travel_one_active_trip on public.travel_boarding_passes(user_id,country_id)
  where status in ('issued','boarded');
create index travel_boarding_history on public.travel_boarding_passes(user_id,created_at desc);
create index travel_boarding_country on public.travel_boarding_passes(country_id);

create table public.travel_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_id uuid not null references public.travel_countries(id),
  first_arrived_at timestamptz not null default now(),
  last_visited_at timestamptz not null default now(),
  introduction_completed_at timestamptz,
  visit_count integer not null default 1 check (visit_count >= 1),
  unique(user_id,country_id),
  check (last_visited_at >= first_arrived_at),
  check (introduction_completed_at is null or introduction_completed_at >= first_arrived_at)
);
create index travel_visits_country on public.travel_visits(country_id);

create table public.passport_stamp_definitions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.travel_countries(id),
  unit_id uuid,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null, description text not null, image_path text,
  requirement_type text not null check (requirement_type in ('arrival','unit_completion','country_completion')),
  is_active boolean not null default true,
  unique(country_id,slug),
  foreign key (country_id,unit_id) references public.travel_country_units(country_id,unit_id),
  check ((requirement_type = 'unit_completion') = (unit_id is not null))
  -- Typed unit_id + country_id replace the suggested ambiguous reference UUID.
);
create unique index travel_one_arrival_stamp on public.passport_stamp_definitions(country_id)
  where requirement_type = 'arrival';
create unique index travel_one_country_stamp on public.passport_stamp_definitions(country_id)
  where requirement_type = 'country_completion';
create index travel_stamp_unit on public.passport_stamp_definitions(unit_id);
create table public.user_passport_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stamp_id uuid not null references public.passport_stamp_definitions(id),
  earned_at timestamptz not null default now(),
  unique(user_id,stamp_id)
);
create index travel_owned_stamp_definition on public.user_passport_stamps(stamp_id);

-- Controlled content catalog; private journal rows snapshot unlocked memories.
create table public.travel_journal_catalog (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.travel_countries(id),
  unit_id uuid,
  slug text not null,
  entry_type text not null check (entry_type in ('country_fact','postcard','cultural_challenge')),
  title text not null, content text not null, image_path text,
  is_active boolean not null default true,
  unique(country_id,slug), unique(id,country_id),
  foreign key (country_id,unit_id) references public.travel_country_units(country_id,unit_id)
);
create index travel_journal_catalog_unit on public.travel_journal_catalog(unit_id);
create table public.travel_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  country_id uuid not null references public.travel_countries(id),
  unit_id uuid,
  catalog_entry_id uuid not null,
  entry_type text not null check (entry_type in ('country_fact','postcard','cultural_challenge')),
  title text not null, content text not null, image_path text,
  created_at timestamptz not null default now(),
  unique(user_id,catalog_entry_id),
  foreign key (catalog_entry_id,country_id) references public.travel_journal_catalog(id,country_id),
  foreign key (country_id,unit_id) references public.travel_country_units(country_id,unit_id)
);
create index travel_journal_history on public.travel_journal_entries(user_id,created_at desc);
create index travel_journal_country on public.travel_journal_entries(country_id);
create index travel_journal_unit on public.travel_journal_entries(unit_id);
create index travel_journal_catalog_entry on public.travel_journal_entries(catalog_entry_id);

-- Explicit grants override Supabase default privileges. No browser writes and
-- no writable admin policy based on a potentially user-editable profile role.
do $security$
declare target text;
begin
  foreach target in array array[
    'travel_countries','travel_country_languages','travel_country_units',
    'travel_passports','travel_boarding_passes','travel_visits',
    'passport_stamp_definitions','user_passport_stamps',
    'travel_journal_catalog','travel_journal_entries'
  ] loop
    execute format('alter table public.%I enable row level security',target);
    execute format('revoke all on public.%I from public,anon,authenticated',target);
    execute format('grant all on public.%I to service_role',target);
  end loop;
  foreach target in array array['travel_countries','travel_country_languages','travel_country_units','passport_stamp_definitions'] loop
    execute format('grant select on public.%I to anon,authenticated',target);
  end loop;
  foreach target in array array['travel_passports','travel_boarding_passes','travel_visits','user_passport_stamps','travel_journal_entries'] loop
    execute format('grant select on public.%I to authenticated',target);
    execute format('create policy travel_owner_read on public.%I for select to authenticated using ((select auth.uid()) = user_id)',target);
  end loop;
end;
$security$;
create policy travel_country_public_read on public.travel_countries for select to anon,authenticated using (is_active);
create policy travel_language_public_read on public.travel_country_languages for select to anon,authenticated
  using (exists(select 1 from public.travel_countries c where c.id=country_id and c.is_active));
create policy travel_unit_public_read on public.travel_country_units for select to anon,authenticated
  using (exists(select 1 from public.travel_countries c where c.id=country_id and c.is_active));
create policy travel_stamp_public_read on public.passport_stamp_definitions for select to anon,authenticated
  using (is_active and exists(select 1 from public.travel_countries c where c.id=country_id and c.is_active));
-- Catalog intentionally has no learner SELECT grant: unlock through validated
-- RPCs, then read only the learner's own journal snapshots.
commit;
