"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Navigation should only appear on the landing page
  const isLandingPage = pathname === "/";

  return (
    <>
      <header
        className={`mx-auto flex h-20 w-full max-w-7xl items-center px-6 md:px-10 lg:px-14 ${
          isLandingPage ? "justify-between" : "justify-start"
        }`}
      >
        {/* =============================================
            LEFT SIDE — LOGO
        ============================================= */}

        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="ACELINGUA"
            width={400}
            height={400}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* =============================================
            LANDING PAGE NAVIGATION ONLY
        ============================================= */}

        {isLandingPage && (
          <>
            {/* DESKTOP NAVIGATION */}

            <nav className="hidden items-center gap-12 md:flex">
              <Link
                href="/register"
                className="text-sm font-semibold transition hover:text-[#3558AE]"
              >
                Learn Now
              </Link>

              <Link
                href="/languages"
                className="text-sm font-semibold transition hover:text-[#3558AE]"
              >
                Languages
              </Link>

              <Link
                href="/about"
                className="text-sm font-semibold transition hover:text-[#3558AE]"
              >
                About
              </Link>
            </nav>

            {/* =============================================
                RIGHT SIDE — LOGIN
            ============================================= */}

            <div className="hidden items-center md:flex">
              <Link
                href="/login"
                className="rounded-full bg-[#071A4A] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#3558AE]"
              >
                Login
                <span className="ml-2">›</span>
              </Link>
            </div>

            {/* =============================================
                MOBILE MENU BUTTON
            ============================================= */}

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/60 md:hidden"
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </>
        )}
      </header>

      {/* =============================================
          MOBILE MENU — LANDING PAGE ONLY
      ============================================= */}

      {isLandingPage && menuOpen && (
        <div className="relative z-50 mx-5 rounded-2xl border border-white bg-white p-5 shadow-lg md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/register"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#EAF5FF]"
            >
              Learn Now
            </Link>

            <Link
              href="/languages"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#EAF5FF]"
            >
              Languages
            </Link>

            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#EAF5FF]"
            >
              About
            </Link>

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-xl bg-[#071A4A] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#3558AE]"
            >
              Login
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}