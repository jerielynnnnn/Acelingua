"use client";

import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import { ArrowRight, ChevronRight, Menu, X } from "lucide-react";
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

type PublicHeaderProps = {
  learner?: boolean;
  actions?: ReactNode;
};

/** Login button based on the supplied Uiverse gradient-glow reference. */
function LoginButton({
  onClick,
  className = "",
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div className={`group relative inline-flex shrink-0 items-center justify-center ${className}`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1 rounded-[17px] transition-all duration-700 group-hover:opacity-100 group-hover:duration-200"
      />
      <Link
        href="/login"
        onClick={onClick}
        className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-950 px-5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:px-6 sm:text-[15px]"
      >
        Login
        <ArrowRight
          size={17}
          strokeWidth={2.3}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}

export default function PublicHeader({
  learner = false,
  actions,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const showNavigation = !learner && pathname === "/";

  // Keep the dashboard header unchanged in behavior.
  if (learner) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-[#102452]/5 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 w-full max-w-[var(--page-max-width)] flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-7">
          <Link href="/dashboard" aria-label="ACELingua dashboard" className="flex min-w-0 shrink-0 items-center">
            <Logo alt="ACELingua" priority sizes="160px" className="h-auto w-40 object-contain" />
          </Link>
          {actions && (
            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-3">
              {actions}
            </div>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="relative z-50 w-full">
      {/* Equal outer columns keep the middle navigation genuinely centered. */}
      <div className="mx-auto grid min-h-[82px] w-full max-w-[var(--page-max-width)] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 sm:px-8 lg:min-h-[96px] lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-5 lg:px-10 xl:px-14">
        {/* LEFT: logo */}
        <Link
          href="/"
          aria-label="ACELingua home"
          className="group relative z-10 flex w-fit min-w-0 items-center rounded-xl outline-none transition-transform duration-300 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-[#3558AE]"
        >
          <Logo
            alt="ACELingua"
            priority
            sizes="(max-width: 639px) 152px, (max-width: 1023px) 176px, 210px"
            className="h-auto w-[152px] max-w-full object-contain sm:w-44 lg:w-[210px]"
          />
        </Link>

        {/* CENTER: desktop navigation */}
        {showNavigation && (
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 rounded-full bg-white/25 p-1.5 shadow-[0_8px_26px_rgba(40,57,111,0.06)] backdrop-blur-xl lg:flex"
          >
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative inline-flex min-h-12 items-center gap-2.5 whitespace-nowrap rounded-full px-5 text-[17px] font-semibold text-[#102452] transition-all duration-300 hover:-translate-y-0.5 hover:text-[#3558AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE] xl:px-5"
              >
                <Image
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  width={26}
                  height={26}
                  className="h-[25px] w-[25px] object-contain transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                />
                {item.label}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-1/2"
                />
              </Link>
            ))}
          </nav>
        )}

        {/* RIGHT: glowing login and mobile menu */}
        <div className="flex min-w-0 items-center justify-end gap-3 lg:col-start-3 lg:gap-4">
          {actions && (
            <div className={showNavigation ? "hidden items-center gap-3 lg:flex" : "flex items-center gap-3"}>
              {actions}
            </div>
          )}
          {showNavigation && <LoginButton />}
          {showNavigation && (
            <button
              type="button"
              onClick={() => setMenuPath(menuOpen ? null : pathname)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="acelingua-mobile-nav"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/35 text-[#102452] shadow-sm backdrop-blur-md transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE] lg:hidden"
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          )}
        </div>
      </div>

      {showNavigation && menuOpen && (
        <nav
          id="acelingua-mobile-nav"
          aria-label="Mobile navigation"
          className="absolute left-4 right-4 top-full z-50 mx-auto mt-1 max-w-lg rounded-[24px] bg-[#F9F7FF]/90 p-3 shadow-[0_22px_65px_rgba(32,50,106,0.17)] backdrop-blur-2xl sm:left-8 sm:right-8 lg:hidden"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuPath(null)}
              className="group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#102452] transition-colors hover:bg-white/75 hover:text-[#3558AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/55">
                <Image src={item.icon} alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
              </span>
              {item.label}
              <ChevronRight size={17} aria-hidden="true" className="ml-auto opacity-45 transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
          {actions && <div className="px-3 py-2 lg:hidden">{actions}</div>}
        </nav>
      )}
    </header>
  );
}
