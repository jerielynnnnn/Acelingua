-- REVIEW ONLY: do not apply automatically. Uses existing avatar/profile tables.
-- Both nonzero prices are charged together. No currency is created or seeded.
-- Confirm live profile triggers and grants before applying this function.
begin;
create or replace function public.acelingua_purchase_avatar_item(
  p_item_id uuid, p_expected_coins integer, p_expected_gems integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  learner uuid := auth.uid(); item public.avatar_items%rowtype;
  balance_coins integer; balance_gems integer;
begin
  if learner is null then raise exception 'Please sign in to purchase an item'; end if;
  -- Serialize all purchases for this account, including purchases of different
  -- items, so concurrent requests cannot overspend either balance.
  select coins, gems into balance_coins, balance_gems from public.profiles
    where id = learner for update;
  if not found or balance_coins is null or balance_gems is null then
    raise exception 'Your learner balance is unavailable';
  end if;
  select * into item from public.avatar_items where id = p_item_id for share;
  if not found or not item.is_active then raise exception 'This item is no longer available'; end if;
  if exists (select 1 from public.user_avatar_items where user_id = learner and avatar_item_id = item.id) then
    return jsonb_build_object('already_owned', true, 'coins', balance_coins, 'gems', balance_gems);
  end if;
  if item.category::text not in ('base', 'face', 'hair', 'clothes')
    or item.price_coins is null or item.price_gems is null
    or item.price_coins < 0 or item.price_gems < 0 then
    raise exception 'This item is temporarily unavailable';
  end if;
  if item.price_coins is distinct from p_expected_coins or item.price_gems is distinct from p_expected_gems then
    raise exception 'The price changed. Refresh the store before purchasing';
  end if;
  if balance_coins < item.price_coins or balance_gems < item.price_gems then
    raise exception 'You do not have enough coins or gems for this item';
  end if;
  -- Any failure rolls back both ownership and balances. API users retain the
  -- existing free-only insertion policy; paid ownership is granted only here.
  insert into public.user_avatar_items(user_id, avatar_item_id) values(learner, item.id);
  update public.profiles set coins = balance_coins - item.price_coins,
    gems = balance_gems - item.price_gems, updated_at = now() where id = learner;
  return jsonb_build_object('already_owned', false, 'coins', balance_coins - item.price_coins, 'gems', balance_gems - item.price_gems);
end;
$$;
revoke all on function public.acelingua_purchase_avatar_item(uuid, integer, integer) from public, anon;
grant execute on function public.acelingua_purchase_avatar_item(uuid, integer, integer) to authenticated;
commit;
