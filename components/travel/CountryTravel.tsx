"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Plane } from "lucide-react";
import type { AvatarLayer } from "@/components/avatar/UserAvatar";
import { createClient } from "@/lib/supabase/client";
import { boardTravelFlight, ensureBoardingPass, finishTravelArrival } from "@/lib/travel/actions";
import { travelDestinations } from "@/lib/travel/countries";
import type { BoardingTicket, EarnedStamp, TravelCountry, TravelStamp } from "@/lib/travel/types";
import { travelValue } from "@/lib/travel/types";
import BoardingPass from "./BoardingPass";
import styles from "./Travel.module.css";

export default function CountryTravel({ languageCode, avatar, children }: { languageCode: string; avatar: AvatarLayer[]; children: ReactNode }) {
  const destination = travelDestinations[languageCode];
  const [ticket, setTicket] = useState<BoardingTicket | null>(null);
  const [country, setCountry] = useState<TravelCountry>();
  const [stamps, setStamps] = useState<TravelStamp[]>([]);
  const [earned, setEarned] = useState<EarnedStamp[]>([]);
  const [phase, setPhase] = useState<"loading" | "ticket" | "intro" | "map" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const inFlight = useRef(false);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!destination) { setError("Travel passes are not yet available for this destination. Please choose another country from the World Hub."); setPhase("error"); return; }
      try {
        const db = createClient();
        const pass = travelValue(await ensureBoardingPass(languageCode));
        const [place, definitions, owned] = await Promise.all([
          db.from("travel_countries").select("id,code,name,flag_emoji,welcome_message").eq("id", pass.country_id).single(),
          db.from("passport_stamp_definitions").select("id,country_id,name,description,requirement_type").eq("country_id", pass.country_id),
          db.from("user_passport_stamps").select("stamp_id,earned_at"),
        ]);
        for (const result of [place, definitions, owned]) if (result.error) throw result.error;
        if (!cancelled) { setTicket(pass); setCountry(place.data as TravelCountry); setStamps(definitions.data ?? []); setEarned(owned.data ?? []); setPhase(pass.status === "arrived" ? "map" : pass.status === "boarded" ? "intro" : "ticket"); }
      } catch (cause) { if (!cancelled) { setError(cause instanceof Error ? cause.message : "Your boarding pass could not be loaded. Please retry."); setPhase("error"); } }
    }
    void load();
    return () => { cancelled = true; };
  }, [languageCode, destination, attempt]);
  async function board() {
    if (!ticket || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try { const result = travelValue(await boardTravelFlight(ticket.id)); setTicket(result); setPhase(result.status === "arrived" ? "map" : "intro"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Boarding failed. Please retry."); }
    finally { setBusy(false); inFlight.current = false; }
  }
  async function arrive() {
    if (!ticket || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const result = travelValue(await finishTravelArrival(ticket.id));
      setTicket(result);
      const owned = await createClient().from("user_passport_stamps").select("stamp_id,earned_at");
      if (owned.error) throw owned.error;
      setEarned(owned.data ?? []); setPhase("map");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your arrival could not be saved. Please retry."); }
    finally { setBusy(false); inFlight.current = false; }
  }
  return <><section className={styles.travelPanel} aria-label="Your virtual journey">
    <div className={styles.toolbar}><Link href="/passport"><BookOpen size={18} />My Passport</Link>{ticket?.status === "arrived" && <details className={styles.passDetails}><summary>View collectible boarding pass</summary><BoardingPass ticket={ticket} country={country} avatar={avatar} /></details>}</div>
    {error && <div className={styles.error} role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={() => { setError(""); setAttempt(value => value + 1); setPhase("loading"); }}>Retry travel setup</button><p>Complete your passport and arrival before starting lessons from this destination.</p><Link href="/world">Return to World Hub</Link></div>}
    {phase === "loading" && <p role="status">Preparing your adventure pass…</p>}
    {phase === "ticket" && ticket && <div className={styles.visitCard}><div><p className={styles.eyebrow}>Your first virtual visit</p><h2>Ready to explore {country?.name ?? "your destination"}?</h2><p>A short welcome starts your learning journey and saves an arrival stamp to your passport.</p></div><button type="button" className={styles.primary} disabled={busy} onClick={() => void board()}>{busy ? "Preparing your welcome…" : "Start my visit"}</button><details className={styles.passDetails}><summary>See your collectible boarding pass</summary><BoardingPass ticket={ticket} country={country} avatar={avatar} /></details></div>}
    {phase === "intro" && ticket && country && destination && <article className={styles.intro}>
      <Plane className={styles.flyingPlane} size={44} aria-hidden="true" />
      <Image src="/icon head.png" alt="Ace, your travel guide" width={72} height={72} />
      <p className={styles.eyebrow}>Ace welcomes you · {country.flag_emoji}</p><h2>{country.welcome_message}</h2><p>Welcome to {country.name}!</p>
      <div className={styles.greeting}><strong>{destination.greeting}</strong><span>{destination.meaning}</span></div><p>{destination.introduction}</p>
      <p className={styles.stampPreview}>✦ Your {country.name} arrival stamp is waiting ✦</p>
      <div className={styles.actions}><button type="button" className={styles.primary} disabled={busy} onClick={() => void arrive()}>{busy ? "Saving your arrival…" : "Collect stamp & enter destination"}</button><button type="button" disabled={busy} onClick={() => void arrive()}>Skip introduction</button></div>
    </article>}
    {phase === "map" && earned.some(item => stamps.some(stamp => stamp.id === item.stamp_id)) && <div className={styles.arrived} role="status">{country?.flag_emoji} Arrival saved · Your passport has a new memory. <Link href="/passport">See stamps</Link></div>}
  </section>{phase === "map" && ticket?.status === "arrived" && <div id="country-learning-map">{children}</div>}</>;
}
