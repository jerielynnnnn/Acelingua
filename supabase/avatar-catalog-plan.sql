-- DRAFT ONLY: NOT APPLIED. Review before executing in Supabase SQL Editor.
-- The owner confirmed an empty avatar_items catalog.
-- These exact files exist under public/avatar/, all 1024x1024.
-- CURRENT BLOCKER: all eight PNGs lack an alpha channel. Replace/export them
-- with properly aligned transparent layers before using this catalog draft.
-- No filesystem renames or schema/category changes are proposed.
-- Existing DB category clothes maps to asset folder outfit and UI label Outfit.
-- All eight proposed starter items are free; one default is proposed per category.
-- Existing rows are preserved, and rerunning skips already registered paths.

begin;

with asset_catalog (name, category, image_path, preferred_default) as (
  values
    ('Female Base', 'base', '/avatar/base/basefemale (1).png', true),
    ('Happy Face', 'face', '/avatar/face/happyface.png', true),
    ('Worried Face', 'face', '/avatar/face/worriedface.png', false),
    ('Black Hair', 'hair', '/avatar/hair/blackhair.png', false),
    ('Pink Hair', 'hair', '/avatar/hair/pinkhair.png', false),
    ('Red Hair', 'hair', '/avatar/hair/redhair.png', false),
    ('Short Hair', 'hair', '/avatar/hair/shorthair.png', true),
    ('Purple Lolita Outfit', 'clothes', '/avatar/outfit/lolitapurpleoutfit.png', true)
)
insert into public.avatar_items
  (id, name, category, image_path, price_coins, price_gems, is_default, is_active)
select md5('acelingua:avatar:' || asset.image_path)::uuid,
  asset.name, asset.category, asset.image_path, 0, 0,
  asset.preferred_default and not exists (
    select 1 from public.avatar_items existing
    where existing.category = asset.category and existing.is_active
      and existing.is_default and existing.price_coins = 0 and existing.price_gems = 0
  ), true
from asset_catalog asset
where not exists (
  select 1 from public.avatar_items existing where existing.image_path = asset.image_path
)
on conflict (id) do nothing;

commit;

-- Verify after approved catalog preparation:
select category, count(*) as active_items,
  count(*) filter (where is_default) as defaults
from public.avatar_items where is_active group by category order by category;
