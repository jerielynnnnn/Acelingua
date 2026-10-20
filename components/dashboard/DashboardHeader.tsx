"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import PublicHeader from "@/components/PublicHeader";
import HeartStatus from "@/components/learning/HeartStatus";

import fireIcon from "@/public/icons/fire.png";
import gemsIcon from "@/public/icons/gems.png";
import coinsIcon from "@/public/icons/coins.png";
import trophyIcon from "@/public/icons/trophy-star.png";

type DashboardHeaderProps = {
  streak: number | null;
  hearts: number;
  gems: number | null;
  coins: number | null;
  achievements: number | null;
  profileMenu?: ReactNode;
};

type StatusItem = {
  label: string;
  icon: typeof fireIcon;
  value: number | null;
  href: string;
};

function StatusLink({ status }: { status: StatusItem }) {
  const formattedValue = status.value?.toLocaleString() ?? "—";
  const accessibleLabel = `${status.label}: ${
    status.value === null ? "unavailable" : formattedValue
  }`;

  return (
    <Link
      href={status.href}
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className="group inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-[#071A4A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#EAF5FF] hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE] motion-reduce:transform-none"
    >
      <Image
        src={status.icon}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 object-contain transition-transform duration-300 group-hover:scale-110"
      />
      <span className="tabular-nums">{formattedValue}</span>
    </Link>
  );
}

export default function DashboardHeader({
  streak,
  hearts,
  gems,
  coins,
  achievements,
  profileMenu,
}: DashboardHeaderProps) {
  const statuses: StatusItem[] = [
    { label: "Streak", icon: fireIcon, value: streak, href: "/streak" },
    { label: "Gems", icon: gemsIcon, value: gems, href: "/store" },
    { label: "Coins", icon: coinsIcon, value: coins, href: "/store" },
    {
      label: "Achievements",
      icon: trophyIcon,
      value: achievements,
      href: "/achievements",
    },
  ];

  return (
    <PublicHeader
      learner
      actions={
        <>
          <div
            className="flex flex-wrap items-center justify-end gap-1 sm:gap-2"
            aria-label="Learner status"
          >
            <StatusLink status={statuses[0]} />
            <HeartStatus initial={hearts} />
            {statuses.slice(1).map((status) => (
              <StatusLink key={status.label} status={status} />
            ))}
          </div>
          {profileMenu}
        </>
      }
    />
  );
}
