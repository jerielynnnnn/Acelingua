"use client";

import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import learnIcon from "@/public/icons/learnicon.png";
import worldIcon from "@/public/icons/world.png";
import aceIcon from "@/public/icon head.png";

const navigation = [
  { href: "/onboarding/languages", label: "Learn Now", icon: learnIcon },
  { href: "/languages", label: "Languages", icon: worldIcon },
  { href: "/about", label: "About Us", icon: aceIcon },
];

export default function PublicHeader({ learner = false, actions }: { learner?: boolean; actions?: ReactNode }) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const showNavigation = !learner && pathname === "/";
  return <header className={learner ? "sticky top-0 z-40 w-full border-b border-[#071A4A]/5 bg-white/95 backdrop-blur-md" : "relative z-50 w-full"}>
    <div className={`mx-auto flex min-h-20 w-full max-w-[var(--page-max-width)] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8 ${learner ? "lg:px-7" : "md:min-h-24 md:px-10 lg:px-14"}`}>
      <Link href={learner ? "/dashboard" : "/"} aria-label={learner ? "ACELingua dashboard" : "ACELingua home"} className="flex min-w-0 shrink-0 items-center">
        <Logo alt="ACELingua" priority sizes={learner ? "160px" : "(max-width: 639px) 176px, (max-width: 1023px) 192px, 240px"} className={learner ? "h-auto w-40 object-contain" : "h-auto w-44 max-w-full object-contain sm:w-48 lg:w-60"} />
      </Link>
      {showNavigation && <>
        <nav aria-label="Main navigation" className="hidden items-center gap-4 md:flex lg:gap-8">
          {navigation.map(item => <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#071A4A] transition-colors hover:text-[#3558AE]">
            <Image src={item.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" />{item.label}
          </Link>)}
        </nav>
        <Link href="/login" className="hidden h-10 items-center justify-center gap-2 rounded-full bg-[#071A4A] px-5 text-xs font-semibold text-white transition hover:bg-[#3558AE] md:inline-flex">Login <ArrowRight size={14} aria-hidden="true" /></Link>
        <button type="button" onClick={() => setMenuPath(menuOpen ? null : pathname)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="acelingua-mobile-nav" className="flex h-11 w-11 items-center justify-center rounded-full text-[#071A4A] transition hover:bg-white/60 md:hidden">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </>}
      {actions && <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3">{actions}</div>}
    </div>
    {showNavigation && menuOpen && <nav id="acelingua-mobile-nav" aria-label="Mobile navigation" className="mx-5 mb-4 flex flex-col gap-1 rounded-2xl border border-[#071A4A]/5 bg-white p-4 shadow-sm sm:mx-8 md:hidden">
      {navigation.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuPath(null)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[#071A4A] hover:bg-[#EAF5FF]"><Image src={item.icon} alt="" width={28} height={28} className="h-7 w-7 object-contain" />{item.label}</Link>)}
      <Link href="/login" onClick={() => setMenuPath(null)} className="mt-3 rounded-xl bg-[#071A4A] px-4 py-3 text-center text-sm font-semibold text-white">Login</Link>
    </nav>}
  </header>;
}
