"use client";
import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthFrame from "@/components/AuthFrame";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  return <Suspense fallback={<AuthFrame><p>Loading password recovery?</p></AuthFrame>}><ForgotPasswordForm /></Suspense>;
}
function ForgotPasswordForm() {
  const invalidLink = useSearchParams().get("error") === "recovery";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
      if (error) throw error;
      setSent(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to request a reset email. Please try again."); }
    finally { setBusy(false); }
  }
  return <AuthFrame><section className="w-full max-w-[390px] text-[#071A4A]"><h1 className="text-3xl font-extrabold">Forgot your password?</h1><p className="mt-3 text-sm leading-6 text-[#62759C]">Enter your account email and we&apos;ll send a link to choose a new password.</p>{sent ? <div role="status" className="mt-6 rounded-xl bg-[#EAF5FF] p-5 text-sm leading-6">If an account exists for {email.trim()}, a reset link has been requested. Check your inbox and spam folder.</div> : <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-bold" htmlFor="reset-email">Email address</label><input id="reset-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="h-12 w-full rounded-xl border border-[#071A4A]/15 bg-white px-4" />{(error || invalidLink) && <p role="alert" className="text-sm text-red-700">{error || "This reset link is invalid or expired. Request a new one below."}</p>}<button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#071A4A] font-bold text-white disabled:opacity-50">{busy ? "Sending…" : "Send reset link"}</button></form>}<Link href="/login" className="mt-6 inline-block text-sm font-bold text-[#3558AE]">Back to sign in</Link></section></AuthFrame>;
}
