"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Globe2, LockKeyhole, Plane, Sparkles } from "lucide-react";
import UserAvatar, { type AvatarLayer } from "@/components/avatar/UserAvatar";
import { useLearnerId } from "@/components/dashboard/LearnerShell";
import { avatarCategories, avatarLayers, loadLearnerAvatar, type AvatarSelection } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import { ensureTravelPassport, refreshPassportStamps } from "@/lib/travel/actions";
import { languageForCountry } from "@/lib/travel/countries";
import type { BoardingTicket, EarnedStamp, TravelCountry, TravelPassport, TravelStamp } from "@/lib/travel/types";
import { travelValue } from "@/lib/travel/types";
import BoardingPass from "./BoardingPass";
import styles from "./Travel.module.css";

type PassportData = { passport: TravelPassport; name: string; avatar: AvatarLayer[]; countries: TravelCountry[]; stamps: TravelStamp[]; earned: EarnedStamp[]; tickets: BoardingTicket[]; visits: number; languages: string[] };
export default function TravelPassportView() {
  const userId = useLearnerId();
  const [data, setData] = useState<PassportData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [stampSyncPending, setStampSyncPending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const passport = travelValue(await ensureTravelPassport());
        const synchronization = await refreshPassportStamps();
        if (!cancelled) setStampSyncPending(synchronization.pending);
        const db = createClient();
        const [profile, avatar, countries, stamps, earned, tickets, visits, enrollments] = await Promise.all([
          db.from("profiles").select("display_name,username").eq("id", userId).single(),
          loadLearnerAvatar(db, userId),
          db.from("travel_countries").select("id,code,name,flag_emoji,welcome_message").order("name"),
          db.from("passport_stamp_definitions").select("id,country_id,name,description,requirement_type").order("name"),
          db.from("user_passport_stamps").select("stamp_id,earned_at").eq("user_id", userId),
          db.from("travel_boarding_passes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          db.from("travel_visits").select("id", { count: "exact", head: true }).eq("user_id", userId),
          db.from("user_courses").select("course_id").eq("user_id", userId).eq("status", "active"),
        ]);
        for (const result of [profile, countries, stamps, earned, tickets, visits, enrollments]) if (result.error) throw new Error(result.error.message);
        const languageNames: string[] = [];
        const courseIds = [...new Set((enrollments.data ?? []).map(row => row.course_id as string))];
        if (courseIds.length) {
          const courses = await db.from("courses").select("language_id").in("id", courseIds);
          if (courses.error) throw courses.error;
          const ids = [...new Set((courses.data ?? []).map(row => row.language_id as string))];
          if (ids.length) {
            const languages = await db.from("languages").select("name").in("id", ids).order("name");
            if (languages.error) throw languages.error;
            languageNames.push(...(languages.data ?? []).map(row => row.name as string));
          }
        }
        const selection: AvatarSelection = { base: null, face: null, hair: null, clothes: null };
        if (avatar.equipped) for (const category of avatarCategories) selection[category] = avatar.equipped[`${category}_id`];
        if (!cancelled) setData({ passport, name: profile.data?.display_name?.trim() || profile.data?.username?.trim() || "Explorer", avatar: avatarLayers(avatar.items, selection), countries: countries.data ?? [], stamps: stamps.data ?? [], earned: earned.data ?? [], tickets: (tickets.data ?? []) as BoardingTicket[], visits: visits.count ?? 0, languages: languageNames });
      } catch (cause) { if (!cancelled) setError(cause instanceof Error ? cause.message : "Your passport could not be loaded. Please retry."); }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, attempt]);
  if (error) return <main className={styles.page}><h1>Your next adventure is waiting</h1><div className={styles.error} role="alert">{error}</div><button type="button" className={styles.primary} onClick={() => { setError(""); setData(null); setAttempt(value => value + 1); }}>Try again</button><Link href="/world">Return to World</Link></main>;
  if (!data) return <main className={styles.page} aria-busy="true"><p role="status">Opening your ACELINGUA passport…</p><div className={styles.skeleton} /></main>;
  const selected = data.tickets.find(ticket => ticket.id === selectedTicket);
  return <main className={styles.page}>
    {stampSyncPending && <p role="status" className="mb-5 rounded-xl bg-[#FFD46E]/25 p-4 text-sm">Your collected stamps are saved. Destination rewards are waiting for the country curriculum setup or a connection retry.</p>}
    <div className={styles.heading}><div><p className={styles.eyebrow}>Little journeys. Lasting memories.</p><h1>My travel passport</h1><p>A world of words, one adventure at a time.</p></div><Link className={styles.primary} href="/world">Explore the world <Globe2 size={18} /></Link></div>
    <div className={styles.passportBook}>
      <section className={styles.cover} aria-label="Passport cover"><p>ACELINGUA</p><Image src="/icon head.png" alt="Ace the cat" width={110} height={110} /><Globe2 size={54} strokeWidth={1} aria-hidden="true" /><h2>Travel<br />Passport</h2><span>Explore · Learn · Connect</span><small>Your virtual adventure companion</small></section>
      <section className={styles.identity}><p className={styles.eyebrow}>Explorer identity</p><div className={styles.identityTop}><div className={styles.portrait}><UserAvatar layers={data.avatar} transparent /></div><div><span>Traveler</span><h2>{data.name}</h2><p>ACELINGUA Explorer</p></div></div><dl><div><dt>Fictional passport number</dt><dd className={styles.serial}>{data.passport.passport_number}</dd></div><div><dt>Issued</dt><dd>{new Date(data.passport.issued_at).toLocaleDateString("en", { timeZone: "Asia/Manila" })}</dd></div><div><dt>Languages learning</dt><dd>{data.languages.join(" · ") || "Your first language adventure awaits"}</dd></div></dl><div className={styles.stats}><div><strong>{data.visits}</strong><span>Countries visited</span></div><div><strong>{data.earned.length}</strong><span>Stamps collected</span></div></div></section>
    </div>
    <section className={styles.collection}><p className={styles.eyebrow}>Every stamp tells a story</p><h2>Your stamp collection</h2>{!data.stamps.length && <p>No stamps are available yet. Visit the world again once destinations are ready.</p>}<div className={styles.stampGrid}>{data.stamps.map(stamp => {
      const owned = data.earned.find(item => item.stamp_id === stamp.id);
      const country = data.countries.find(item => item.id === stamp.country_id);
      return <div key={stamp.id}><button type="button" className={`${styles.stamp} ${owned ? styles.unlocked : styles.locked}`} disabled={!owned} aria-expanded={owned ? selectedStamp === stamp.id : undefined} onClick={() => setSelectedStamp(selectedStamp === stamp.id ? null : stamp.id)}><span aria-hidden="true">{owned ? country?.flag_emoji ?? "✦" : <LockKeyhole size={28} />}</span><strong>{stamp.name}</strong><small>{owned ? "Collected ✦" : "Waiting to be discovered"}</small></button>{selectedStamp === stamp.id && owned && <div className={styles.stampDescription}><p>{stamp.description}</p><small>Earned through {stamp.requirement_type.replaceAll("_", " ")} · {new Date(owned.earned_at).toLocaleDateString("en", { timeZone: "Asia/Manila" })}</small></div>}</div>;
    })}</div></section>
    <section className={styles.collection}><h2><Plane size={23} />Boarding pass memories</h2>{!data.tickets.length && <p>Your first ticket is waiting. <Link href="/world/fr">Plan a trip to France</Link></p>}<div className={styles.history}>{data.tickets.map(ticket => <div key={ticket.id}><button type="button" aria-expanded={selectedTicket === ticket.id} onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}><strong>{ticket.destination_label}</strong><span>{ticket.flight_code} · {ticket.status}</span><small>{ticket.passenger_name}</small></button>{(() => { const country = data.countries.find(item => item.id === ticket.country_id); const language = country && languageForCountry(country.code); return language ? <Link href={`/world/${language}`}>Revisit destination</Link> : null; })()}</div>)}</div>{selected && <div className={styles.historyTicket}><BoardingPass ticket={selected} avatar={data.avatar} country={data.countries.find(country => country.id === selected.country_id)} /></div>}</section>
    <section className={styles.journal}><Sparkles size={25} aria-hidden="true" /><h2>A journal of firsts</h2><p>{data.visits ? "Your arrival stamps mark the places where your learning adventures began. More postcards and cultural discoveries will join your journal in future journeys." : "Begin your first trip and collect an arrival memory. Your journey belongs to you."}</p><Link href="/world">Find your next destination</Link></section>
  </main>;
}
