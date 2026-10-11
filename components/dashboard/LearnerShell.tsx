"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

const LearnerContext = createContext<string | null>(null);
export function useLearnerId() {
  const userId = useContext(LearnerContext);
  if (!userId) throw new Error("Learner page requires the authenticated shell.");
  return userId;
}
type HeaderData = { streak: number; hearts: number; gems: number; coins: number; achievements: number };

/** Reuses the existing dashboard navigation and real profile status values. */
export default function LearnerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<{ userId: string; header: HeaderData | null } | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError && !isAuthSessionMissingError(authError)) throw authError;
        if (!user) { if (!cancelled) router.replace("/login"); return; }
        const [profile, achievements] = await Promise.all([
          supabase.from("profiles").select("streak, hearts, gems, coins").eq("id", user.id).maybeSingle(),
          supabase.from("user_achievements").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        ]);
        if (profile.error) throw profile.error;
        if (achievements.error) throw achievements.error;
        if (!cancelled) setSession({ userId: user.id, header: profile.data && achievements.count !== null
          ? { ...profile.data, achievements: achievements.count } : null });
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't load your learner account. Please retry.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [router, attempt]);
  return <div className="min-h-screen bg-[#F4F9FD] text-[#071A4A]">
    <DashboardSidebar />
    <div className="min-h-screen md:pl-19">
      {session?.header && <DashboardHeader {...session.header} />}
      <nav aria-label="Learner navigation" className="flex gap-2 overflow-x-auto border-b border-[#071A4A]/5 bg-white p-3 md:hidden">
        {[['Dashboard', '/dashboard'], ['Learn', '/learn'], ['Avatar', '/avatar'], ['World', '/world']].map(([name, href]) => <Link key={href} href={href} aria-current={pathname === href || pathname.startsWith(href + '/') ? "page" : undefined} className="rounded-xl px-3 py-2 text-sm font-bold aria-[current=page]:bg-[#EAF5FF] focus-visible:outline-2 focus-visible:outline-[#3558AE]">{name}</Link>)}
      </nav>
      {error ? <main className="mx-auto max-w-xl p-8"><h1 className="text-2xl font-bold">Let&apos;s try again</h1><p role="alert" className="mt-4">{error}</p><button onClick={() => { setError(""); setAttempt(n => n + 1); }} className="mt-5 rounded-full bg-[#071A4A] px-6 py-3 font-bold text-white">Retry</button></main>
        : !session ? <main role="status" className="flex min-h-[70vh] flex-col items-center justify-center gap-4"><Loader2 className="animate-spin" /><p>Loading your journey...</p></main>
        : <LearnerContext.Provider value={session.userId}>{children}</LearnerContext.Provider>}
    </div>
  </div>;
}
