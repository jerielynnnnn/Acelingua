-- REVIEW ONLY: apply manually after reviewing the proposed exchange prices.
-- Uses earned coins only. No real-money checkout.
begin;
create table public.store_supply_offers (
  id text primary key, name text not null,
  kind text not null check (kind in ('hearts','gems')),
  amount integer not null check (amount between 1 and 1000),
  price_coins integer not null check (price_coins > 0),
  is_active boolean not null default false
);
create table public.store_supply_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null, offer_id text not null references public.store_supply_offers(id),
  receipt jsonb not null, created_at timestamptz not null default now(),
  primary key(user_id,request_id)
);
alter table public.store_supply_offers enable row level security;
alter table public.store_supply_receipts enable row level security;
revoke all on public.store_supply_offers,public.store_supply_receipts from anon,authenticated;
grant select on public.store_supply_offers,public.store_supply_receipts to authenticated;
grant all on public.store_supply_offers,public.store_supply_receipts to service_role;
create policy supply_offers_active on public.store_supply_offers for select to authenticated using(is_active);
create policy supply_receipts_owner on public.store_supply_receipts for select to authenticated using(user_id=(select auth.uid()));
-- Proposed rates; review these against your course reward economy before applying.
insert into public.store_supply_offers(id,name,kind,amount,price_coins,is_active) values
 ('heart-single','A little heart boost','hearts',1,50,true),
 ('hearts-three','Ready for more practice','hearts',3,135,true),
 ('gems-ten','Pocket of gems','gems',10,250,true),
 ('gems-twenty-five','Gem collection','gems',25,600,true);
create function public.acelingua_purchase_supply(p_offer_id text,p_expected_price integer,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare learner uuid:=auth.uid(); offer public.store_supply_offers%rowtype;
  balance_coins integer; balance_gems integer; balance_hearts integer; result jsonb;
begin
  if learner is null or p_request_id is null then raise exception 'Sign in to purchase supplies'; end if;
  select coins,gems,hearts into balance_coins,balance_gems,balance_hearts
    from public.profiles where id=learner for update;
  if not found or balance_coins is null or balance_gems is null or balance_hearts is null then
    raise exception 'Your learner balance is unavailable'; end if;
  select receipt into result from public.store_supply_receipts where user_id=learner and request_id=p_request_id;
  if found then
    if not exists(select 1 from public.store_supply_receipts where user_id=learner and request_id=p_request_id and offer_id=p_offer_id) then
      raise exception 'This request belongs to a different purchase'; end if;
    return jsonb_build_object('coins',balance_coins,'gems',balance_gems,'hearts',balance_hearts);
  end if;
  select * into offer from public.store_supply_offers where id=p_offer_id and is_active for share;
  if not found then raise exception 'This offer is unavailable'; end if;
  if offer.price_coins is distinct from p_expected_price then raise exception 'The price changed. Refresh the store'; end if;
  if balance_coins<offer.price_coins then raise exception 'You need more coins for this offer'; end if;
  update public.profiles set coins=balance_coins-offer.price_coins,
    gems=balance_gems+case when offer.kind='gems' then offer.amount else 0 end,
    hearts=balance_hearts+case when offer.kind='hearts' then offer.amount else 0 end,
    updated_at=now() where id=learner;
  select jsonb_build_object('coins',coins,'gems',gems,'hearts',hearts) into result from public.profiles where id=learner;
  insert into public.store_supply_receipts(user_id,request_id,offer_id,receipt) values(learner,p_request_id,offer.id,result);
  return result;
end;
$$;
revoke all on function public.acelingua_purchase_supply(text,integer,uuid) from public,anon;
grant execute on function public.acelingua_purchase_supply(text,integer,uuid) to authenticated;
commit;
