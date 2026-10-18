"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import PublicHeader from "@/components/PublicHeader";
import fireIcon from "@/public/icons/fire.png";
import heartIcon from "@/public/icons/heart.png";
import gemsIcon from "@/public/icons/gems.png";
import coinsIcon from "@/public/icons/coins.png";
import trophyIcon from "@/public/icons/trophy-star.png";

type DashboardHeaderProps = {
  streak: number; hearts: number; gems: number; coins: number;
  achievements: number | null; profileMenu?: ReactNode;
};

export default function DashboardHeader({ streak, hearts, gems, coins, achievements, profileMenu }: DashboardHeaderProps) {
  const statuses = [
    { label: "Streak", src: fireIcon, value: streak },
    { label: "Hearts", src: heartIcon, value: hearts },
    { label: "Gems", src: gemsIcon, value: gems, href: "/store" },
    { label: "Coins", src: coinsIcon, value: coins, href: "/store" },
    { label: "Achievements", src: trophyIcon, value: achievements, href: "/dashboard#dashboard-achievements" },
  ];
  return <PublicHeader learner actions={<>
    <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2" aria-label="Learner status">
      {statuses.map(status => {
        const className = "inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#071A4A] transition hover:bg-[#EAF5FF]";
        const label = `${status.label}: ${status.value === null ? "unavailable" : status.value.toLocaleString()}`;
        const content = <><Image src={status.src} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" /><span>{status.value?.toLocaleString() ?? "—"}</span></>;
        return status.href ? <Link key={status.label} href={status.href} title={label} aria-label={label} className={className}>{content}</Link> : <span key={status.label} title={label} aria-label={label} className={className}>{content}</span>;
      })}
    </div>
    {profileMenu}
  </>} />;
}
