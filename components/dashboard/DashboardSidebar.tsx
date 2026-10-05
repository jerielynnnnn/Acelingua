"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  CircleUserRound,
  Globe2,
  House,
  LogOut,
  Settings,
  ShoppingBag,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: House,
  },
  {
    name: "Learn",
    href: "/learn",
    icon: BookOpen,
  },
  {
    name: "World",
    href: "/world",
    icon: Globe2,
  },
  {
    name: "Avatar",
    href: "/avatar",
    icon: CircleUserRound,
  },
  {
    name: "Store",
    href: "/store",
    icon: ShoppingBag,
  },
];

/* =========================================================
   DASHBOARD SIDEBAR
========================================================= */

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <aside
      className="
        group fixed left-0 top-0 z-50
        hidden h-screen w-[76px]
        flex-col
        border-r border-[#071A4A]/5
        bg-white
        shadow-[4px_0_25px_rgba(7,26,74,0.04)]
        transition-[width] duration-300 ease-in-out
        hover:w-[230px]
        md:flex
      "
    >
      {/* ===================================================
          LOGO
      =================================================== */}

      <div className="flex h-20 shrink-0 items-center overflow-hidden border-b border-[#071A4A]/5">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center"
        >
          {/* Icon area */}

          <div className="flex w-[76px] shrink-0 items-center justify-center">
            <Image
              src="/icon head.png"
              alt="Ace"
              width={44}
              height={44}
              priority
              className="h-10 w-10 object-contain"
            />
          </div>

          {/* ACELINGUA name */}

          <div className="flex min-w-0 items-center">
            <Image
              src="/logo.png"
              alt="ACELINGUA"
              width={150}
              height={40}
              className="
                h-8 w-auto
                translate-x-2
                object-contain
                opacity-0
                transition-all duration-200
                group-hover:translate-x-0
                group-hover:opacity-100
              "
            />
          </div>
        </Link>
      </div>

      {/* ===================================================
          MAIN NAVIGATION
      =================================================== */}

      <nav className="flex flex-1 flex-col gap-1.5 overflow-hidden px-3 py-6">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={`
                relative flex h-12 shrink-0 items-center
                overflow-hidden rounded-xl
                transition-all duration-200
                ${
                  active
                    ? "bg-[#EAF5FF] text-[#3558AE]"
                    : "text-[#071A4A]/55 hover:bg-[#F5F9FC] hover:text-[#071A4A]"
                }
              `}
            >
              {/* Active indicator */}

              {active && (
                <span className="absolute left-0 h-6 w-[3px] rounded-r-full bg-[#3558AE]" />
              )}

              {/* Icon */}

              <span className="flex w-[52px] shrink-0 items-center justify-center">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.3 : 1.8}
                />
              </span>

              {/* Name */}

              <span
                className="
                  whitespace-nowrap
                  text-sm font-semibold
                  opacity-0
                  transition-opacity duration-200
                  group-hover:opacity-100
                "
              >
                {item.name}
              </span>

              {/* Arrow */}

              {active && (
                <ChevronRight
                  size={15}
                  className="
                    ml-auto mr-3
                    shrink-0
                    opacity-0
                    transition-opacity duration-200
                    group-hover:opacity-40
                  "
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ===================================================
          BOTTOM NAVIGATION
      =================================================== */}

      <div className="shrink-0 overflow-hidden border-t border-[#071A4A]/5 px-3 py-4">
        {/* Settings */}

        <Link
          href="/settings"
          title="Settings"
          className={`
            flex h-12 items-center overflow-hidden rounded-xl
            transition-all duration-200
            ${
              pathname.startsWith("/settings")
                ? "bg-[#EAF5FF] text-[#3558AE]"
                : "text-[#071A4A]/55 hover:bg-[#F5F9FC] hover:text-[#071A4A]"
            }
          `}
        >
          <span className="flex w-[52px] shrink-0 items-center justify-center">
            <Settings size={20} strokeWidth={1.8} />
          </span>

          <span
            className="
              whitespace-nowrap
              text-sm font-semibold
              opacity-0
              transition-opacity duration-200
              group-hover:opacity-100
            "
          >
            Settings
          </span>
        </Link>

        {/* Logout */}

        <button
          type="button"
          onClick={handleLogout}
          title="Log out"
          className="
            flex h-12 w-full items-center
            overflow-hidden rounded-xl
            text-[#071A4A]/55
            transition-all duration-200
            hover:bg-red-50
            hover:text-red-500
          "
        >
          <span className="flex w-[52px] shrink-0 items-center justify-center">
            <LogOut size={20} strokeWidth={1.8} />
          </span>

          <span
            className="
              whitespace-nowrap
              text-sm font-semibold
              opacity-0
              transition-opacity duration-200
              group-hover:opacity-100
            "
          >
            Log out
          </span>
        </button>
      </div>
    </aside>
  );
}