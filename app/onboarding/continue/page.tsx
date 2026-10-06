"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { continueAuthenticatedOnboarding } from "@/lib/auth-onboarding";

export default function ContinueOnboardingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function proceed() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setError("Please sign in to continue. Your language selection is still saved in this browser.");
          return;
        }
        if (authError) throw authError;
        const destination = await continueAuthenticatedOnboarding(supabase, user);
        if (!cancelled) router.replace(destination);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "We couldn't finish preparing your account. Please retry.");
      }
    }
    // Serialize multiple tabs and Strict Mode runs; database conflicts protect other devices.
    const run = () => cancelled ? Promise.resolve() : proceed();
    if (navigator.locks) void navigator.locks.request("acelingua-onboarding", run).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : "Please retry preparing your account.");
    });
    else void run();
    return () => { cancelled = true; };
  }, [router, attempt]);

  return <main className="flex min-h-screen items-center justify-center bg-[#EAF5FF] px-5 text-[#071A4A]">
    <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
      {error ? <><h1 className="text-2xl font-extrabold">Let&apos;s finish setting up</h1><p role="alert" className="mt-4 text-sm leading-7">{error}</p><div className="mt-6 flex flex-wrap justify-center gap-4"><button type="button" onClick={() => { setError(""); setAttempt(attempt + 1); }} className="rounded-full bg-[#071A4A] px-5 py-3 text-sm font-bold text-white">Retry</button><Link href="/login" className="px-3 py-3 text-sm font-bold text-[#3558AE]">Sign in</Link><Link href="/onboarding/languages" className="px-3 py-3 text-sm font-bold text-[#3558AE]">Choose language</Link></div></>
        : <div role="status"><Loader2 className="mx-auto animate-spin text-[#3558AE]" size={32} /><h1 className="mt-5 text-xl font-bold">Preparing your learning journey...</h1><p className="mt-3 text-sm text-[#071A4A]/60">Ace is getting your course ready.</p></div>}
    </section>
  </main>;
}
