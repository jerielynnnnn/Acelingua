-- DRAFT ONLY: NOT APPLIED. Review before executing in Supabase SQL Editor.
-- These exact files exist under public/avatar/, all 432x432 with alpha channels.
-- No filesystem renames or schema/category changes are proposed.
-- Existing DB category clothes maps to asset folder outfit and UI label Outfit.
-- New starter items are free; one default is proposed per category.
-- Existing rows are preserved, and rerunning skips already registered paths.

begin;

-- Preserve item IDs, ownership, and equipped references for renamed face files.
update public.avatar_items set image_path = '/avatar/face/happy.png', name = 'Happy Face'
where image_path = '/avatar/face/happyface.png'
  and not exists (select 1 from public.avatar_items where image_path = '/avatar/face/happy.png');
update public.avatar_items set image_path = '/avatar/face/mad.png', name = 'Mad Face'
where image_path = '/avatar/face/worriedface.png'
  and not exists (select 1 from public.avatar_items where image_path = '/avatar/face/mad.png');

-- Keep ownership history for removed artwork, but stop offering missing images.
update public.avatar_items set is_active = false, is_default = false
where image_path in ('/avatar/hair/blackhair.png', '/avatar/hair/pinkhair.png');

with asset_catalog (name, category, image_path, preferred_default) as (
  values
    ('Female Base', 'base', '/avatar/base/basefemale (1).png', true),
    ('Faceless Base', 'base', '/avatar/base/faceless.png', false),
    ('Happy Face', 'face', '/avatar/face/happy.png', true),
    ('Mad Face', 'face', '/avatar/face/mad.png', false),
    ('Levi Hairstyle', 'hair', '/avatar/hair/levi hairstyle.png', false),
    ('Miyamura Hairstyle', 'hair', '/avatar/hair/Miyamura hairstyle.png', false),
    ('Orange Ponytail', 'hair', '/avatar/hair/orangeponytail.png', false),
    ('Ponytail', 'hair', '/avatar/hair/ponytail.png', false),
    ('Red Hair', 'hair', '/avatar/hair/redhair.png', false),
    ('Short Hair', 'hair', '/avatar/hair/shorthair.png', true),
    ('Purple Lolita Outfit', 'clothes', '/avatar/outfit/lolitapurpleoutfit.png', true),
    ('Casual Fit', 'clothes', '/avatar/outfit/casual fit.png', false),
    ('Casual Fit 2', 'clothes', '/avatar/outfit/casual fit 2.png', false),
    ('Casual Outfit 1', 'clothes', '/avatar/outfit/casual outfit 1.png', false)
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
