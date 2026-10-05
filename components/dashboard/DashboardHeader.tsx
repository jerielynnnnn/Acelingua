"use client";

import Image from "next/image";
import Link from "next/link";

type DashboardHeaderProps = {
  streak: number;
  hearts: number;
  gems: number;
  coins: number;
  achievements: number;
};

export default function DashboardHeader({
  streak,
  hearts,
  gems,
  coins,
  achievements,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#071A4A]/5 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-end px-5 md:px-8 lg:px-10">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* STREAK */}
          <StatusItem
            src="/icons/fire.png"
            alt="Streak"
            value={streak}
            label="Streak"
          />

          {/* HEARTS */}
          <StatusItem
            src="/icons/heart.png"
            alt="Hearts"
            value={hearts}
            label="Hearts"
          />

          {/* GEMS */}
          <StatusItem
            src="/icons/gems.png"
            alt="Gems"
            value={gems}
            label="Gems"
          />

          {/* COINS */}
          <StatusItem
            src="/icons/coins.png"
            alt="Coins"
            value={coins}
            label="Coins"
          />

          <div className="mx-1 hidden h-7 w-px bg-[#071A4A]/10 sm:block" />

          {/* ACHIEVEMENTS */}
          <Link
            href="/achievements"
            title="Achievements"
            className="group flex h-11 items-center gap-2 rounded-xl px-2.5 transition hover:bg-[#F4F9FD] sm:px-3"
          >
            <Image
              src="/icons/trophy-star.png"
              alt="Achievements"
              width={28}
              height={28}
              className="h-7 w-7 object-contain transition-transform group-hover:scale-110"
            />

            <span className="text-sm font-bold text-[#071A4A]">
              {achievements.toLocaleString()}
            </span>

            <span className="hidden text-xs font-semibold text-[#071A4A]/40 xl:block">
              Achievements
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function StatusItem({
  src,
  alt,
  value,
  label,
}: {
  src: string;
  alt: string;
  value: number;
  label: string;
}) {
  return (
    <div
      title={label}
      className="flex h-11 items-center gap-2 rounded-xl px-2.5 transition hover:bg-[#F4F9FD] sm:px-3"
    >
      <Image
        src={src}
        alt={alt}
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 object-contain"
      />

      <span className="text-sm font-bold text-[#071A4A]">
        {value.toLocaleString()}
      </span>

      <span className="hidden text-xs font-semibold text-[#071A4A]/40 2xl:block">
        {label}
      </span>
    </div>
  );
}