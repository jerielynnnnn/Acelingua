"use client";
import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import styles from "./GameDashboardHeader.module.css";

export default function DashboardSummaryShortcut({ label, href, icon, children }: { label: string; href: string; icon: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return <div className={styles.summaryWrapper} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); } }}>
    <Link href={href} className={styles.summaryTrigger} aria-describedby={open ? id : undefined} onFocus={() => setOpen(true)}>{icon}<span>{label}</span></Link>
    {open && <section className={styles.summaryPanel} id={id} aria-label={`${label} summary`}>
      <div className={styles.summaryHeading}><strong>{label}</strong><button type="button" aria-label={`Close ${label} summary`} onClick={() => setOpen(false)}><X size={16}/></button></div>
      {children}
      <Link href={href} className={styles.summaryLink}>View all {label.toLowerCase()} <ArrowRight size={15}/></Link>
    </section>}
  </div>;
}
