"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Lock, RotateCcw, Shuffle } from "lucide-react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import UserAvatar from "@/components/avatar/UserAvatar";
import { avatarCategories, avatarCategoryLabels, loadLearnerAvatar, canUseAvatarItem, initialAvatarSelection,
  saveLearnerAvatar, finishAvatarOnboarding, type AvatarCategory, type AvatarItem,
  type AvatarSelection } from "@/lib/avatar";

type Setup = { userId: string; items: AvatarItem[]; ownedIds: Set<string> };
const blank: AvatarSelection = { base: null, face: null, hair: null, clothes: null };

export default function AvatarCustomizer({ onboarding = false }: { onboarding?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<Setup | null>(null);
  const [selected, setSelected] = useState<AvatarSelection>(blank);
  const [saved, setSaved] = useState<AvatarSelection>(blank);
  const [success, setSuccess] = useState("");
  const [category, setCategory] = useState<AvatarCategory>("base");
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [broken, setBroken] = useState<string[]>([]);
  const saveInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        if (!user) { if (!cancelled) router.replace("/login"); return; }
        const { items, ownedIds, equipped } = await loadLearnerAvatar(supabase, user.id);
        if (!cancelled) {
          const initial = initialAvatarSelection(items, ownedIds, equipped);
          setSelected(initial);
          setSaved(initial);
          setData({ userId: user.id, items, ownedIds });
        }
      } catch (cause) {
        if (!cancelled) setLoadError(cause instanceof Error ? cause.message : "We couldn't prepare your avatar. Please try again.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [router, attempt]);

  const layers = data ? avatarCategories.flatMap((key) => {
    const item = data.items.find((candidate) => candidate.id === selected[key]);
    return item ? [{ category: key, name: item.name, imagePath: item.image_path }] : [];
  }) : [];
  const missing = avatarCategories.filter((key) => !selected[key]);
  const hasBrokenSelection = layers.some((layer) => broken.includes(layer.imagePath)
    || !((layer.imagePath.startsWith("/") && !layer.imagePath.startsWith("//")) || /^https?:\/\//i.test(layer.imagePath)));

  async function save() {
    if (!data || saveInFlight.current || missing.length || hasBrokenSelection) return;
    saveInFlight.current = true;
    setSaving(true); setSaveError(""); setSuccess("");
    try {
      const supabase = createClient();
      const user = await saveLearnerAvatar(supabase, data.userId, selected);
      if (onboarding) {
        await finishAvatarOnboarding(supabase, user);
        router.replace("/dashboard");
      } else {
        setSaved({ ...selected });
        setSuccess("Avatar saved!");
      }
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "We couldn't save your avatar. Please retry.");
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  }

  function retry() {
    setLoadError(""); setData(null); setBroken([]); setAttempt(attempt + 1);
  }

  return <main className="min-h-screen bg-[#EAF5FF] px-5 py-7 text-[#071A4A]">
    {onboarding && <header className="mx-auto flex max-w-5xl justify-center"><Image src="/logo.png" alt="ACELINGUA" width={60} height={60} className="h-14 w-auto object-contain" priority /></header>}
    <section className="mx-auto max-w-5xl pb-10">
      <div className="my-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3558AE]">Your learner avatar</p><h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{onboarding ? "Create your avatar" : "Customize Your Avatar"}</h1><p className="mt-3 text-sm text-[#071A4A]/60">{onboarding ? "Make your learner look like you want." : "Create your travel companion for your language journey."}</p></div>
      {loadError ? <div role="alert" className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><h2 className="text-xl font-bold">We couldn&apos;t prepare your avatar</h2><p className="mt-4 text-sm leading-7">{loadError}</p><button type="button" onClick={retry} className="mt-6 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white">Retry</button><Link href="/login" className="ml-4 text-sm font-bold text-[#3558AE]">Sign in</Link></div>
        : !data ? <div role="status" className="py-16 text-center"><Loader2 size={32} className="mx-auto animate-spin text-[#3558AE]" /><p className="mt-4">Preparing your avatar...</p></div>
        : !data.items.length ? <div role="status" className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><h2 className="text-xl font-bold">Avatar choices are coming soon</h2><p className="mt-4 text-sm leading-7 text-[#071A4A]/65">There are no active avatar items available yet. Please check back soon.</p><button type="button" onClick={retry} className="mt-6 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white">Check again</button><Link href={onboarding ? "/onboarding/continue" : "/dashboard"} className="ml-4 text-sm font-bold text-[#3558AE]">{onboarding ? "Back to onboarding" : "Back to dashboard"}</Link></div>
        : <>
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-white bg-white p-6 shadow-sm"><div className="rounded-2xl bg-gradient-to-b from-[#C7A9D4]/25 to-[#F9C3D7]/25 p-3"><UserAvatar layers={layers} onLayerError={(_, path) => setBroken((paths) => paths.includes(path) ? paths : [...paths, path])} /></div><p className="mt-4 text-center text-xs text-[#071A4A]/55">Your avatar updates as you choose items.</p></div>
            <div className="rounded-3xl border border-white bg-white p-5 shadow-sm sm:p-7">
              <div role="group" aria-label="Avatar categories" className="grid grid-cols-4 gap-2">{avatarCategories.map((key) => <button key={key} type="button" disabled={saving} aria-pressed={category === key} onClick={() => setCategory(key)} className={`rounded-xl px-2 py-3 text-sm font-bold capitalize transition ${category === key ? "bg-[#071A4A] text-white" : "bg-[#EAF5FF] hover:bg-[#C7A9D4]/30"}`}>{avatarCategoryLabels[key]}</button>)}</div>
              <h2 className="mt-6 text-lg font-bold capitalize">Choose your {avatarCategoryLabels[category].toLowerCase()}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{data.items.filter((item) => item.category === category).map((item) => {
                const usable = canUseAvatarItem(item, data.ownedIds);
                const isSelected = selected[category] === item.id;
                return <button key={item.id} type="button" disabled={!usable || saving} aria-pressed={isSelected} aria-label={`${item.name}${usable ? "" : ", locked"}`} onClick={() => { setSelected((current) => ({ ...current, [category]: item.id })); setSaveError(""); setSuccess(""); }} className={`relative rounded-2xl border-2 p-3 text-left transition disabled:cursor-not-allowed ${isSelected ? "border-[#3558AE] bg-[#EAF5FF] shadow-[0_0_0_3px_#3558AE15]" : "border-[#071A4A]/10 bg-white"} ${usable ? "hover:border-[#3558AE] focus-visible:outline-3 focus-visible:outline-[#3558AE]" : "opacity-50"}`}>
                  <UserAvatar layers={[{ category, name: item.name, imagePath: item.image_path }]} onLayerError={(_, path) => setBroken((paths) => paths.includes(path) ? paths : [...paths, path])} />
                  <span className="mt-2 block text-xs font-semibold">{item.name}</span>{isSelected && <Check aria-hidden="true" size={17} className="absolute right-2 top-2 text-[#3558AE]" />}{!usable && <Lock aria-hidden="true" size={15} className="absolute right-2 top-2" />}
                </button>;
              })}</div>
              {!data.items.some((item) => item.category === category) && <p className="mt-6 text-sm leading-6 text-[#071A4A]/65">No active {avatarCategoryLabels[category].toLowerCase()} items are available yet.</p>}
              <p className="mt-5 text-xs leading-5 text-[#071A4A]/55">Free starter items and items you already own are available. Locked items cannot be selected here.</p>
            </div>
          </div>
          {!!missing.length && <p role="status" className="mt-6 text-center text-sm text-[#B64074]">Available selections are still needed for: {missing.map((key) => avatarCategoryLabels[key]).join(", ")}. Check again when starter items are available.</p>}
          {hasBrokenSelection && <p role="status" className="mt-4 text-center text-sm text-[#B64074]">Please choose items with available images before continuing.</p>}
          {saveError && <div role="alert" className="mx-auto mt-6 max-w-xl rounded-2xl bg-white p-5 text-center text-sm leading-7 text-[#B64074]">{saveError}<Link href="/onboarding/continue" className="mt-3 block font-bold text-[#3558AE]">Return to onboarding</Link></div>}

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" disabled={saving} onClick={() => { setSelected({ ...saved }); setSaveError(""); setSuccess(""); }} className="inline-flex items-center gap-2 rounded-full border border-[#3558AE]/20 bg-white px-5 py-2.5 text-sm font-bold disabled:opacity-50"><RotateCcw size={16} /> Reset</button>
            <button type="button" disabled={saving} onClick={() => {
              const next = { ...selected };
              for (const key of avatarCategories) {
                const options = data.items.filter(item => item.category === key && canUseAvatarItem(item, data.ownedIds) && !broken.includes(item.image_path));
                next[key] = options.length ? options[Math.floor(Math.random() * options.length)].id : null;
              }
              setSelected(next); setSaveError(""); setSuccess("");
            }} className="inline-flex items-center gap-2 rounded-full border border-[#3558AE]/20 bg-white px-5 py-2.5 text-sm font-bold disabled:opacity-50"><Shuffle size={16} /> Randomize</button>
            {!onboarding && <Link href="/world" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-[#3558AE]">Explore World <ArrowRight size={16} /></Link>}
          </div>
          {success && <p role="status" className="mt-4 text-center text-sm font-semibold text-[#3558AE]">{success}</p>}
          <div className="mt-7 text-center"><button type="button" disabled={saving || !!missing.length || hasBrokenSelection} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-[#071A4A] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-50">{saving ? <><Loader2 size={17} className="animate-spin" /> Saving avatar...</> : <>{onboarding ? "Continue" : "Save Avatar"} <ArrowRight size={17} /></>}</button></div>
        </>}
    </section>
  </main>;
}
