"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import heart from "@/public/icons/heart.png";
import gem from "@/public/icons/gems.png";
import coins from "@/public/icons/coins.png";
type Offer = { id: string; name: string; kind: "hearts" | "gems"; amount: number; price_coins: number };
export type SupplyBalance = { coins: number; gems: number; hearts: number };
export default function StoreSupplies({ userId, kind, balance, onPurchased }: { userId: string; kind: Offer["kind"]; balance: SupplyBalance; onPurchased: (value: SupplyBalance) => void }) {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ offer: Offer; requestId: string } | null>(null);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    let cancelled = false;
    void createClient().from("store_supply_offers").select("id,name,kind,amount,price_coins").eq("is_active", true).order("price_coins").then(result => {
      if (cancelled) return;
      if (result.error) setError("Supply offers are not available yet. Please check back soon.");
      else setOffers((result.data ?? []) as Offer[]);
    });
    return () => { cancelled = true; };
  }, [attempt]);
  async function buy() {
    if (!selected || busy.current) return;
    busy.current = true; setBuying(true); setError("");
    try {
      const client = createClient();
      const session = await client.auth.getUser();
      if (session.error || session.data.user?.id !== userId) throw new Error("Please sign in again before purchasing.");
      const result = await client.rpc("acelingua_purchase_supply", { p_offer_id: selected.offer.id, p_expected_price: selected.offer.price_coins, p_request_id: selected.requestId });
      if (result.error) throw new Error(result.error.message);
      const receipt = result.data as SupplyBalance;
      if (!receipt || ![receipt.coins,receipt.gems,receipt.hearts].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error("Refresh your balances to confirm this purchase before trying again.");
      onPurchased(receipt); setMessage(`${selected.offer.amount} ${selected.offer.kind} added to your balance.`); setSelected(null);
      window.dispatchEvent(new Event("acelingua:balance-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Purchase unavailable. Please retry."); }
    finally { busy.current = false; setBuying(false); }
  }
  return <section><h2 className="text-xl font-extrabold">{kind === "hearts" ? "Keep your journey going" : "A little extra sparkle"}</h2><p className="mt-2 text-sm text-[#62759C]">Exchange earned coins for {kind}.</p>
    {error && <div role="alert" className="my-4 rounded-xl bg-[#F9C3D7]/25 p-4 text-sm">{error}{offers === null && <button type="button" onClick={() => { setError(""); setAttempt(n => n + 1); }} className="ml-3 font-bold text-[#3558AE]">Retry</button>}</div>}
    {message && <p role="status" className="my-4 text-sm font-bold text-[#3558AE]">{message}</p>}
    {!offers && !error && <p role="status" className="py-8">Loading offers...</p>}
    {offers && !offers.some(offer => offer.kind === kind) && <p className="py-8 text-sm text-[#62759C]">New offers will appear here when available.</p>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2">{offers?.filter(offer => offer.kind === kind).map(offer => <article key={offer.id} className="rounded-3xl border border-[#C7A9D4]/40 bg-white p-6 text-center"><Image src={kind === "hearts" ? heart : gem} alt="" width={72} height={72} className="mx-auto h-18 w-18 object-contain" /><h3 className="mt-4 text-2xl font-extrabold">+{offer.amount} {kind}</h3><p className="mt-2 text-xs text-[#62759C]">{offer.name}</p><p className="mt-4 flex items-center justify-center gap-2 font-bold"><Image src={coins} alt="Coins" width={22} height={22} />{offer.price_coins}</p><button type="button" disabled={buying || balance.coins < offer.price_coins} onClick={() => { setSelected({ offer, requestId: crypto.randomUUID() }); setError(""); setMessage(""); }} className="mt-4 rounded-full bg-[#071A4A] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{balance.coins < offer.price_coins ? "Need more coins" : "Get pack"}</button></article>)}</div>
    {selected && <div className="mt-5 rounded-2xl border border-[#C7A9D4] bg-white p-5"><p className="font-bold">Get {selected.offer.amount} {selected.offer.kind} for {selected.offer.price_coins} coins?</p><div className="mt-4 flex gap-4"><button type="button" disabled={buying} onClick={() => void buy()} className="rounded-full bg-[#3558AE] px-5 py-2 text-sm font-bold text-white disabled:opacity-40">{buying ? "Purchasing..." : "Confirm exchange"}</button><button type="button" disabled={buying} onClick={() => setSelected(null)} className="text-sm font-bold">Cancel</button></div></div>}
  </section>;
}
