-- Run check-onboarding-rls.sql first and review the live policies.
-- This migration changes policies only on the two existing learner-owned tables.
-- It preserves existing policies, skips equivalent ownership grants, and refuses
-- to overwrite an unrelated policy using one of the names below.
-- Existing restrictive policies still apply; review any extra restrictions first.
begin;

alter table public.user_courses enable row level security;
alter table public.course_progress enable row level security;
grant select, insert, update on public.user_courses, public.course_progress to authenticated;

do $migration$
declare
  target_table text;
  operation text;
  policy_name text;
  equivalent_exists boolean;
  -- Canonical forms of direct ownership and the Supabase SELECT auth.uid() form.
  ownership_forms text[] := array[
    'auth.uid=user_id', 'user_id=auth.uid',
    'selectauth.uid=user_id', 'user_id=selectauth.uid',
    'selectauth.uidasuid=user_id', 'user_id=selectauth.uidasuid'
  ];
begin
  foreach target_table in array array['user_courses', 'course_progress'] loop
    -- Fail rather than assume an incompatible ownership column.
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = target_table
        and column_name = 'user_id' and udt_name = 'uuid'
    ) then
      raise exception 'public.% must have an existing UUID user_id column', target_table;
    end if;

    foreach operation in array array['SELECT', 'INSERT', 'UPDATE'] loop
      policy_name := target_table || '_' || lower(operation) || '_own';
      select exists (
        select 1 from pg_policies p
        where p.schemaname = 'public' and p.tablename = target_table
          and p.permissive = 'PERMISSIVE' and p.cmd in (operation, 'ALL')
          and ('authenticated'::name = any(p.roles) or 'public'::name = any(p.roles))
          and (operation = 'INSERT' or
            regexp_replace(lower(coalesce(p.qual, '')), '[[:space:]()]', '', 'g') = any(ownership_forms))
          and (operation = 'SELECT' or
            regexp_replace(lower(coalesce(p.with_check, case when p.cmd in ('UPDATE', 'ALL') then p.qual end, '')),
              '[[:space:]()]', '', 'g') = any(ownership_forms))
      ) into equivalent_exists;

      if not equivalent_exists then
        if exists (select 1 from pg_policies p where p.schemaname = 'public'
          and p.tablename = target_table and p.policyname = policy_name) then
          raise exception 'Policy % on public.% already exists with different rules; inspect it before changing it',
            policy_name, target_table;
        end if;
        if operation = 'SELECT' then
          execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', policy_name, target_table);
        elsif operation = 'INSERT' then
          execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', policy_name, target_table);
        else
          execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', policy_name, target_table);
        end if;
      end if;
    end loop;

    -- Permissive policies are ORed together. This ownership guard prevents an
    -- existing broad policy from granting another learner's rows to API users.
    -- It grants no access on its own and does not remove any existing policy.
    policy_name := target_table || '_api_ownership_guard';
    select exists (
      select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = target_table
        and p.permissive = 'RESTRICTIVE' and p.cmd = 'ALL'
        and ('public'::name = any(p.roles) or
          ('authenticated'::name = any(p.roles) and 'anon'::name = any(p.roles)))
        and regexp_replace(lower(coalesce(p.qual, '')), '[[:space:]()]', '', 'g') = any(ownership_forms)
        and regexp_replace(lower(coalesce(p.with_check, p.qual, '')), '[[:space:]()]', '', 'g') = any(ownership_forms)
    ) into equivalent_exists;
    if not equivalent_exists then
      if exists (select 1 from pg_policies p where p.schemaname = 'public'
        and p.tablename = target_table and p.policyname = policy_name) then
        raise exception 'Policy % on public.% already exists with different rules; inspect it before changing it',
          policy_name, target_table;
      end if;
      execute format('create policy %I on public.%I as restrictive for all to authenticated, anon using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', policy_name, target_table);
    end if;
  end loop;
end;
$migration$;

commit;
