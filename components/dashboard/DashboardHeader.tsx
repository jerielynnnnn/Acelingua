"use client";

import Image from "next/image";
import Logo from "@/components/Logo";
import Link from "next/link";
import { ChevronRight, Menu, X } from "lucide-react";
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

/**
 * ACELingua login button — adapted from the supplied layered Uiverse design.
 * Navy center with a pastel gradient edge and a colorful glow on hover.
 * No styled-components dependency required.
 */
function LoginButton({
  onClick,
  className = "",
}: {
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href="/login"
      onClick={onClick}
      aria-label="Log in to ACELingua"
      className={`group relative isolate inline-flex h-[51px] min-w-[132px] shrink-0 items-center justify-center rounded-[15px] p-[2px] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#3558AE] focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none ${className}`}
    >
      {/* Gradient hover shadow: sky blue, lavender, coral pink, sunshine yellow. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[5px] -z-20 rounded-[20px] bg-[linear-gradient(110deg,#85D8FA_0%,#A99AEF_35%,#FF9297_72%,#FFD46E_100%)] opacity-0 blur-[13px] transition-opacity duration-500 group-hover:opacity-75 group-focus-visible:opacity-75 motion-reduce:transition-none"
      />

      {/* Thin, luminous gradient outline—visible but never a heavy border. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-[15px] bg-[linear-gradient(110deg,#85D8FA_0%,#A99AEF_35%,#FF9297_72%,#FFD46E_100%)] opacity-65 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      />

      <span className="relative z-10 flex h-full w-full items-center justify-center gap-3 rounded-[13px] bg-[#102452] px-5 text-sm font-bold tracking-[0.01em] text-white shadow-[0_5px_14px_rgba(16,36,82,0.15)] transition-colors duration-300 group-hover:bg-[#19396E] motion-reduce:transition-none">
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-[22px] w-[22px] shrink-0 transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none"
        >
          <path d="m15.626 11.769a6 6 0 1 0 -7.252 0 9.008 9.008 0 0 0 -5.374 8.231 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 9.008 9.008 0 0 0 -5.374-8.231zm-7.626-4.769a4 4 0 1 1 4 4 4 4 0 0 1 -4-4zm10 14h-12a1 1 0 0 1 -1-1 7 7 0 0 1 14 0 1 1 0 0 1 -1 1z" />
        </svg>
        <span>Log In</span>
      </span>
    </Link>
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
                className="group relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold text-[#102452] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/50 hover:text-[#3558AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE] xl:px-5"
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
                  className="pointer-events-none absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#85D8FA] via-[#A48EE9] to-[#FF9297] transition-all duration-300 group-hover:w-1/2"
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
          {showNavigation && <LoginButton className="hidden sm:inline-flex" />}
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
          {/* Keep login accessible on narrow phones, where the full button cannot fit beside the logo. */}
          <div className="mt-2 flex justify-center border-t border-[#102452]/10 px-3 pt-3 sm:hidden">
            <LoginButton onClick={() => setMenuPath(null)} />
          </div>
        </nav>
      )}
    </header>
  );
}
