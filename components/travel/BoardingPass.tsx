"use client";

import { Plane } from "lucide-react";
import UserAvatar, { type AvatarLayer } from "@/components/avatar/UserAvatar";
import type { BoardingTicket, TravelCountry } from "@/lib/travel/types";
import styles from "./Travel.module.css";

export default function BoardingPass({ ticket, country, avatar, busy = false, onBoard }: { ticket: BoardingTicket; country?: TravelCountry; avatar: AvatarLayer[]; busy?: boolean; onBoard?: () => void }) {
  return <article className={styles.ticket} aria-label={`Boarding pass to ${ticket.destination_label}`}>
    <header><div><p className={styles.eyebrow}>ACELINGUA Airways</p><h2>Virtual Adventure Pass</h2></div><Plane aria-hidden="true" size={32} /></header>
    <div className={styles.ticketBody}>
      <div className={styles.avatar}><UserAvatar layers={avatar} transparent /></div>
      <div><p className={styles.eyebrow}>Passenger name</p><h3>{ticket.passenger_name}</h3><p>{ticket.departure_label}</p><p className={styles.destination}>{country?.flag_emoji} {ticket.destination_label}</p></div>
    </div>
    <dl className={styles.details}><div><dt>Flight</dt><dd>{ticket.flight_code}</dd></div><div><dt>Class</dt><dd>Explorer</dd></div><div><dt>Seat</dt><dd>{ticket.seat_label}</dd></div><div><dt>Boarding date</dt><dd>{new Date(ticket.created_at).toLocaleDateString("en", { timeZone: "Asia/Manila" })}</dd></div></dl>
    <footer><small className={styles.serial}>{ticket.ticket_number}</small><span>Fictional game collectible</span></footer>
    {onBoard && <button type="button" className={styles.primary} onClick={onBoard} disabled={busy}>{busy ? "Preparing your flight…" : ticket.status === "arrived" ? "Enter destination" : "Board Flight"}<Plane size={18} aria-hidden="true" /></button>}
  </article>;
}
