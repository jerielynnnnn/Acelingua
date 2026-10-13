"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Coins, Gem, Loader2, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { useLearnerId } from "@/components/dashboard/LearnerShell";
import { avatarCategories, avatarCategoryLabels, type AvatarCategory, type AvatarItem } from "@/lib/avatar";
import { loadStore, purchaseAvatarItem, validStorePrice } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { withTimeout } from "@/lib/request-timeout";

const action = "inline-flex items-center justify-center gap-2 rounded-full bg-[#071A4A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-40";

export default function StorePage() {
  const userId = useLearnerId();
  const [data, setData] = useState<Awaited<ReturnType<typeof loadStore>> | null>(null);
  const [category, setCategory] = useState<AvatarCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [error, setError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<AvatarItem | null>(null);
  const [buying, setBuying] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const store = await withTimeout(loadStore(createClient(), userId), 20000, "The store took too long to load. Please retry.");
        if (!cancelled) setData(store);
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load the store."); }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, attempt]);
  useEffect(() => { if (selected) confirmRef.current?.focus(); }, [selected]);

  async function buy() {
    if (!selected || !data || busy.current) return;
    busy.current = true; setBuying(true); setPurchaseError("");
    try {
      const receipt = await purchaseAvatarItem(createClient(), userId, selected);
      setData(previous => previous ? { ...previous, coins: receipt.coins, gems: receipt.gems, ownedIds: new Set([...previous.ownedIds, selected.id]) } : previous);
      setMessage(receipt.already_owned ? `${selected.name} is already yours. You weren't charged again.` : `${selected.name} is yours! Equip it in Avatar.`);
      setSelected(null);
      // Refresh the shared header's balance after the successful transaction.
      window.dispatchEvent(new Event("acelingua:balance-updated"));
    } catch (cause) { setPurchaseError(cause instanceof Error ? cause.message : "We couldn't confirm this purchase."); }
    finally { busy.current = false; setBuying(false); }
  }
  if (error) return <main className="mx-auto max-w-xl p-8 text-[#071A4A]"><h1 className="text-2xl font-bold">Let&apos;s try the store again</h1><p role="alert" className="mt-4">{error}</p><button className={`${action} mt-6`} onClick={() => { setError(""); setAttempt(n => n + 1); }}>Retry</button></main>;
  if (!data) return <main role="status" className="flex min-h-[70vh] items-center justify-center gap-3 text-[#071A4A]"><Loader2 className="animate-spin" /> Loading your store...</main>;
  const filtered = data.items.filter(item => avatarCategories.includes(item.category) && (category === "all" || item.category === category)
    && item.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) && (!ownedOnly || data.ownedIds.has(item.id)));
  const affordable = selected && validStorePrice(selected) && data.coins >= selected.price_coins && data.gems >= selected.price_gems;
  return <main className="min-h-screen bg-[#F4F9FD] px-5 py-8 text-[#071A4A] sm:px-8"><div className="mx-auto max-w-6xl">
    <section className="relative overflow-hidden rounded-[32px] bg-[#2A255C] p-7 text-white sm:p-10">
      <Sparkles aria-hidden="true" size={180} className="pointer-events-none absolute -right-5 -top-5 text-[#C7A9D4]/10" />
      <div className="relative flex flex-wrap items-center justify-between gap-6"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F9C3D7]"><ShoppingBag size={16} /> Ace&apos;s Store</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">A little style for your journey</h1><p className="mt-3 max-w-lg text-sm leading-7 text-white/70">Find a new look for your travel companion. Earn coins through lessons, then make your avatar your own.</p></div><div className="flex gap-3"><Balance icon="coins" value={data.coins} /><Balance icon="gems" value={data.gems} /></div></div>
    </section>
    <div className="mt-7 flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-extrabold">Avatar collection</h2><Link href="/avatar" className="text-sm font-bold text-[#3558AE]">Customize your avatar →</Link></div>
    {message && <div role="status" className="mt-5 flex items-center gap-3 rounded-2xl bg-[#C7A9D4]/25 p-4 text-sm"><Check size={20} />{message}<button type="button" aria-label="Dismiss purchase message" onClick={() => setMessage("")} className="ml-auto rounded-full p-2"><X size={16} /></button></div>}
    <div className="mt-6 flex flex-wrap items-end gap-4"><div className="min-w-[200px] flex-1"><label htmlFor="store-search" className="text-sm font-bold">Search items</label><div className="relative mt-2"><Search size={18} aria-hidden="true" className="absolute left-4 top-4 text-[#3558AE]" /><input id="store-search" type="search" value={search} onChange={event => setSearch(event.target.value)} className="h-12 w-full rounded-xl border border-[#071A4A]/15 bg-white pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3558AE]" placeholder="Find your next look" /></div></div><label className="mb-3 flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={ownedOnly} onChange={event => setOwnedOnly(event.target.checked)} className="accent-[#3558AE]" /> Owned items</label></div>
    <div role="group" aria-label="Item category" className="mt-5 flex flex-wrap gap-2">{(["all", ...avatarCategories] as const).map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)} className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${category === value ? "bg-[#071A4A] text-white" : "bg-white text-[#3558AE] hover:bg-[#EAF5FF]"}`}>{value === "all" ? "All items" : avatarCategoryLabels[value]}</button>)}</div>
    {!filtered.length ? <section className="mt-8 rounded-3xl bg-white p-10 text-center"><ShoppingBag size={36} className="mx-auto text-[#3558AE]" /><h2 className="mt-4 text-xl font-bold">{data.items.length ? "No matching items" : "The collection is on its way"}</h2><p className="mt-3 text-sm text-[#071A4A]/65">{data.items.length ? "Try another category or search." : "New avatar styles will appear here when they're available."}</p></section>
      : <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map(item => {
        const owned = data.ownedIds.has(item.id); const valid = validStorePrice(item); const free = valid && item.price_coins === 0 && item.price_gems === 0;
        const enough = valid && data.coins >= item.price_coins && data.gems >= item.price_gems;
        return <article key={item.id} className="overflow-hidden rounded-3xl border border-[#071A4A]/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"><ItemPreview item={item} /><div className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#B64074]">{avatarCategoryLabels[item.category]}</p><h3 className="mt-2 font-extrabold">{item.name}</h3><div className="mt-4 min-h-6 text-sm font-bold">{owned ? <span className="inline-flex items-center gap-1 text-[#3558AE]"><Check size={16} /> Owned</span> : !valid ? "Unavailable" : free ? "Free starter" : <Price item={item} />}</div>{owned ? <Link href="/avatar" className="mt-5 inline-flex text-sm font-bold text-[#3558AE]">Equip in Avatar →</Link> : <button type="button" disabled={!enough || buying} className={`${action} mt-5 w-full`} onClick={() => { setSelected(item); setPurchaseError(""); }}>{!valid ? "Unavailable" : free ? "Claim item" : enough ? "Get item" : "Keep learning to unlock"}</button>}</div></article>;
      })}</div>}
    {selected && <section aria-labelledby="purchase-heading" className="mt-8 rounded-3xl border border-[#3558AE]/20 bg-white p-6 shadow-sm sm:p-8"><h2 id="purchase-heading" className="text-xl font-bold">Get {selected.name}?</h2><p className="mt-3 text-sm text-[#071A4A]/65">Add this item to your collection. You can equip it in Avatar afterward.</p><div className="mt-4 font-bold"><Price item={selected} /></div>{purchaseError && <p role="alert" className="mt-4 text-sm text-[#B64074]">{purchaseError}</p>}<div className="mt-5 flex flex-wrap gap-3"><button ref={confirmRef} type="button" disabled={buying || !affordable} onClick={() => void buy()} className={action}>{buying ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : selected.price_coins === 0 && selected.price_gems === 0 ? "Confirm free claim" : "Confirm purchase"}</button><button type="button" disabled={buying} onClick={() => setSelected(null)} className="rounded-full px-5 py-3 text-sm font-bold text-[#3558AE]">Cancel</button></div></section>}
  </div></main>;
}

function Balance({ icon, value }: { icon: "coins" | "gems"; value: number }) {
  return <div className="rounded-2xl bg-white/10 px-5 py-4"><p className="flex items-center gap-2 text-xl font-extrabold">{icon === "coins" ? <Coins size={20} className="text-[#F9C3D7]" /> : <Gem size={20} className="text-[#C7A9D4]" />}{value.toLocaleString()}</p><p className="mt-1 text-xs capitalize text-white/65">{icon}</p></div>;
}
function Price({ item }: { item: AvatarItem }) {
  return <span className="inline-flex flex-wrap items-center gap-2">{item.price_coins > 0 && <span className="inline-flex items-center gap-1"><Coins size={16} />{item.price_coins} coins</span>}{item.price_coins > 0 && item.price_gems > 0 && <span>+</span>}{item.price_gems > 0 && <span className="inline-flex items-center gap-1"><Gem size={16} />{item.price_gems} gems</span>}{item.price_coins === 0 && item.price_gems === 0 && "Free"}</span>;
}
function ItemPreview({ item }: { item: AvatarItem }) {
  const [failed, setFailed] = useState(false);
  const safe = typeof item.image_path === "string" && ((item.image_path.startsWith("/") && !item.image_path.startsWith("//")) || /^https?:\/\//i.test(item.image_path));
  return <div className="relative flex h-52 items-center justify-center bg-gradient-to-br from-[#EAF5FF] to-[#C7A9D4]/20">{safe && !failed ? <Image src={item.image_path} alt={item.name} fill unoptimized sizes="300px" onError={() => setFailed(true)} className="object-contain p-5" /> : <div className="text-center text-[#62759C]"><ShoppingBag size={30} className="mx-auto" /><p className="mt-2 text-xs">Preview unavailable</p></div>}</div>;
}
