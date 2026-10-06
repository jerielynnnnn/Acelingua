-- Avatar schema/constraints confirmed by the existing database export.
-- All three tables have RLS enabled and no policies, as reported by the owner.
-- Apply in Supabase SQL Editor. No tables, columns, or catalog items are created.
begin;

alter table public.avatar_items enable row level security;
alter table public.user_avatar_items enable row level security;
alter table public.user_avatar_equipped enable row level security;
grant select on public.avatar_items to authenticated;
grant select, insert on public.user_avatar_items to authenticated;
grant select, insert, update on public.user_avatar_equipped to authenticated;

-- Only replace policy names introduced in this file; preserve other policies.
drop policy if exists avatar_setup_catalog_read on public.avatar_items;
create policy avatar_setup_catalog_read on public.avatar_items for select to authenticated
using (is_active);

drop policy if exists avatar_setup_ownership_read on public.user_avatar_items;
create policy avatar_setup_ownership_read on public.user_avatar_items for select to authenticated
using ((select auth.uid()) = user_id);

-- Clients may acquire active FREE starters only, including non-default free items.
-- Marking a paid item is_default does not make it free.
drop policy if exists avatar_setup_starter_insert on public.user_avatar_items;
create policy avatar_setup_starter_insert on public.user_avatar_items for insert to authenticated
with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.avatar_items item
    where item.id = avatar_item_id and item.is_active
      and item.price_coins = 0 and item.price_gems = 0
  )
);

drop policy if exists avatar_setup_ownership_guard on public.user_avatar_items;
create policy avatar_setup_ownership_guard on public.user_avatar_items
as restrictive for all to authenticated, anon
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id and exists (
    select 1 from public.avatar_items item
    where item.id = avatar_item_id and item.is_active
      and item.price_coins = 0 and item.price_gems = 0
  )
);

drop policy if exists avatar_setup_equipped_read on public.user_avatar_equipped;
create policy avatar_setup_equipped_read on public.user_avatar_equipped for select to authenticated
using ((select auth.uid()) = user_id);

-- Equipped writes must contain all four active items in the correct categories.
-- They must already be owned; free ownership is ensured before equipping.
do $migration$
declare
  category_name text;
  item_column text;
  condition text := '(select auth.uid()) = user_id';
begin
  foreach category_name in array array['base', 'face', 'hair', 'clothes'] loop
    item_column := category_name || '_id';
    condition := condition || format(
      ' and %I is not null and exists (select 1 from public.avatar_items item join public.user_avatar_items owned on owned.avatar_item_id = item.id where item.id = %I and item.category = %L and item.is_active and owned.user_id = (select auth.uid()))',
      item_column, item_column, category_name
    );
  end loop;
  drop policy if exists avatar_setup_equipped_insert on public.user_avatar_equipped;
  drop policy if exists avatar_setup_equipped_update on public.user_avatar_equipped;
  drop policy if exists avatar_setup_equipped_guard on public.user_avatar_equipped;
  execute format('create policy avatar_setup_equipped_insert on public.user_avatar_equipped for insert to authenticated with check (%s)', condition);
  execute format('create policy avatar_setup_equipped_update on public.user_avatar_equipped for update to authenticated using ((select auth.uid()) = user_id) with check (%s)', condition);
  execute format('create policy avatar_setup_equipped_guard on public.user_avatar_equipped as restrictive for all to authenticated, anon using ((select auth.uid()) = user_id) with check (%s)', condition);
end;
$migration$;

commit;
