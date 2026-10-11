"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isLandingPage = pathname === "/";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="relative z-50 w-full">
        <div
          className={`mx-auto grid h-24 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:px-10 lg:px-14 ${
            !isLandingPage ? "md:grid-cols-1" : ""
          }`}
        >
          {/* LEFT: full-size responsive logo */}
          <Link
            href="/"
            aria-label="ACELingua home"
            className="flex min-w-0 items-center justify-self-start"
          >
            <Image
              src="/logo.png"
              alt="ACELingua"
              width={600}
              height={180}
              priority
              sizes="(max-width: 639px) 176px, (max-width: 1023px) 192px, 240px"
              className="h-auto w-44 max-w-full object-contain sm:w-48 lg:w-60"
            />
          </Link>

          {isLandingPage && (
            <>
              {/* CENTER: stays centered even if logo and login have different widths */}
              <nav
                aria-label="Main navigation"
                className="hidden items-center justify-center gap-4 whitespace-nowrap md:flex lg:gap-10"
              >
                <Link
                  href="/onboarding/languages"
                  className="text-sm font-semibold text-[#071A4A] transition-colors hover:text-[#3558AE]"
                >
                  Learn Now
                </Link>
                <Link
                  href="/languages"
                  className="text-sm font-semibold text-[#071A4A] transition-colors hover:text-[#3558AE]"
                >
                  Languages
                </Link>
                <Link
                  href="/about"
                  className="text-sm font-semibold text-[#071A4A] transition-colors hover:text-[#3558AE]"
                >
                  About Us
                </Link>
              </nav>

              {/* RIGHT */}
              <div className="hidden items-center justify-self-end md:flex">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#071A4A] px-5 text-xs font-semibold text-white transition hover:bg-[#3558AE]"
                >
                  Login <span aria-hidden="true">›</span>
                </Link>
              </div>

              {/* MOBILE MENU TOGGLE */}
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-controls="acelingua-mobile-nav"
                className="flex h-11 w-11 items-center justify-center justify-self-end rounded-full text-[#071A4A] transition hover:bg-white/60 md:hidden"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          )}
        </div>
      </header>

      {isLandingPage && menuOpen && (
        <div
          id="acelingua-mobile-nav"
          className="relative z-50 mx-5 rounded-2xl border border-white bg-white p-4 shadow-[0_15px_40px_rgba(7,26,74,0.10)] sm:mx-8 md:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            <Link
              href="/onboarding/languages"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[#071A4A] transition hover:bg-[#EAF5FF]"
            >
              Learn Now
            </Link>
            <Link
              href="/languages"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[#071A4A] transition hover:bg-[#EAF5FF]"
            >
              Languages
            </Link>
            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold text-[#071A4A] transition hover:bg-[#EAF5FF]"
            >
              About Us
            </Link>
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-3 rounded-xl bg-[#071A4A] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#3558AE]"
            >
              Login →
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
