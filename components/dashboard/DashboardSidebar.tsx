"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fredoka } from "next/font/google";
import { ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   FREDOKA FONT — ALL SIDEBAR TEXT
========================================================= */

const fredoka = Fredoka({
  subsets: ["latin"],
  display: "swap",
});

/* =========================================================
   SIDEBAR NAVIGATION
   Keep all existing icons and routes.
========================================================= */

type NavigationItem = {
  name: string;
  href: string;
  image: string;
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", image: "/icons/Cozy House.png" },
  { name: "Daily Quests", href: "/missions", image: "/icons/Target with Arrow.png" },
  { name: "Streak Society", href: "/streak", image: "/icons/fire.png" },
  { name: "Achievements", href: "/achievements", image: "/icons/Golden Star Trophy.png" },
  { name: "Learn", href: "/learn", image: "/icons/learnicon.png" },
  { name: "World", href: "/world", image: "/icons/world.png" },
  { name: "Avatar", href: "/avatar", image: "/icons/Avatar.png" },
  { name: "Passport", href: "/passport", image: "/icons/Pasaporte.png" },
  { name: "Store", href: "/store", image: "/icons/shop.png" },
];

/* =========================================================
   SHARED STYLING
========================================================= */

const iconSlotClass =
  "flex h-11 w-[52px] shrink-0 items-center justify-center";

const labelClass =
  "flex h-11 min-w-0 flex-1 items-center whitespace-nowrap pr-7 text-[13px] font-semibold leading-none opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100";

const iconClass = "block h-[30px] w-[30px] object-contain object-center";

/* =========================================================
   RESET GUEST INTRO AFTER SUCCESSFUL LOGOUT
   Clear only preview/guest progress, NOT real account progress.
   Keep acelingua_selected_language so /learn/intro can still
   open the chosen language at Discover.
========================================================= */

const INTRO_RESET_AFTER_LOGOUT_KEY = "acelingua_intro_reset_after_logout";

function resetGuestIntroAfterLogout() {
  if (typeof window === "undefined") return;

  // Guest preview progress may live in localStorage or sessionStorage.
  // Do not call storage.clear(): other app preferences must be preserved.
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const keys = Array.from(
        { length: storage.length },
        (_, index) => storage.key(index)
      );

      for (const key of keys) {
        if (!key || key === "acelingua_selected_language") continue;

        if (
          /preview|guest[-_.:]?lesson|^acelingua[-_.:]?intro[-_.:]?(progress|stage|state|answers)/i.test(key)
        ) {
          storage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn("Could not clear guest preview progress:", error);
    }
  }

  try {
    window.localStorage.setItem(INTRO_RESET_AFTER_LOGOUT_KEY, "1");
  } catch (error) {
    console.warn("Could not store intro reset state:", error);
  }
}

/* =========================================================
   DASHBOARD SIDEBAR
========================================================= */

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Unable to log out:", error.message);
        return;
      }

      // Only reset the guest intro when signOut succeeds.
      resetGuestIntroAfterLogout();

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Unable to log out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside
      aria-label="Dashboard sidebar"
      className={`${fredoka.className} group/sidebar fixed left-0 top-0 z-50 hidden h-dvh w-[76px] flex-col overflow-hidden border-r border-[#071A4A]/5 bg-white shadow-[4px_0_25px_rgba(7,26,74,0.04)] transition-[width] duration-300 ease-in-out hover:w-[230px] focus-within:w-[230px] md:flex`}
    >
      {/* ===================================================
          HEADER — ACE MASCOT + BRAND + TAGLINE
      =================================================== */}
      <header className="h-20 shrink-0 overflow-hidden border-b border-[#071A4A]/5 bg-white">
        <Link
          href="/dashboard"
          aria-label="ACElingua dashboard"
          className="flex h-full w-[230px] items-center transition-colors duration-200"
        >
          <div className="flex h-20 w-[76px] shrink-0 items-center justify-center">
            <Image
              src="/icon head.png"
              alt="Ace mascot"
              width={46}
              height={46}
              priority
              className="h-[46px] w-[46px] object-contain transition-transform duration-300 group-hover/sidebar:scale-105"
            />
          </div>

          <div className="flex min-w-0 flex-col justify-center gap-[3px] whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100">
            <h2 className="text-[18px] font-bold leading-tight tracking-[-0.6px] text-[#102452]">
              ACELingua
            </h2>
            <p className="text-[10px] font-medium leading-tight tracking-[0.1px] text-[#8493AA]">
              Learn. Speak. Explore
            </p>
          </div>
        </Link>
      </header>

      {/* ===================================================
          MAIN NAVIGATION
      =================================================== */}
      <nav
        aria-label="Main navigation"
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {navigation.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-11 w-full shrink-0 items-center overflow-hidden rounded-xl transition-colors duration-200 ${
                active
                  ? "bg-[#EAF5FF] text-[#3558AE]"
                  : "text-[#071A4A]/55 hover:bg-[#F5F9FC] hover:text-[#071A4A]"
              }`}
            >
              {active && (
                <span className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-r-full bg-[#3558AE]" />
              )}

              <span className={iconSlotClass}>
                <Image
                  src={item.image}
                  alt=""
                  width={30}
                  height={30}
                  className={iconClass}
                />
              </span>

              <span className={labelClass}>{item.name}</span>

              {active && (
                <ChevronRight
                  size={15}
                  aria-hidden="true"
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover/sidebar:opacity-45 group-focus-within/sidebar:opacity-45"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ===================================================
          BOTTOM NAVIGATION
      =================================================== */}
      <div className="shrink-0 overflow-hidden border-t border-[#071A4A]/5 px-3 py-3">
        <Link
          href="/settings"
          title="Settings"
          aria-current={isActive("/settings") ? "page" : undefined}
          className={`relative flex h-11 w-full items-center overflow-hidden rounded-xl transition-colors duration-200 ${
            isActive("/settings")
              ? "bg-[#EAF5FF] text-[#3558AE]"
              : "text-[#071A4A]/55 hover:bg-[#F5F9FC] hover:text-[#071A4A]"
          }`}
        >
          {isActive("/settings") && (
            <span className="absolute bottom-2.5 left-0 top-2.5 w-[3px] rounded-r-full bg-[#3558AE]" />
          )}

          <span className={iconSlotClass}>
            <Image
              src="/icons/setting.png"
              alt=""
              width={30}
              height={30}
              className={iconClass}
            />
          </span>
          <span className={labelClass}>Settings</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title="Log out"
          className="flex h-11 w-full items-center overflow-hidden rounded-xl text-left text-[#071A4A]/55 transition-colors duration-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-wait disabled:opacity-60"
        >
          <span className={iconSlotClass}>
            <Image
              src="/icons/logout.png"
              alt=""
              width={30}
              height={30}
              className={iconClass}
            />
          </span>
          <span className={labelClass}>
            {isLoggingOut ? "Logging out..." : "Log out"}
          </span>
        </button>
      </div>
    </aside>
  );
}
