"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AuthFrame from "@/components/AuthFrame";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    createClient().auth.getUser().then(({ data, error }) => { if (!cancelled) { setReady(Boolean(data.user) && !error); setChecking(false); } }).catch(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !ready) return;
    setError("");
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Use at least 6 characters."); return; }
    setBusy(true);
    try {
      const client = createClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setDone(true); setPassword(""); setConfirmation("");
      await client.auth.signOut({ scope: "local" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update your password. Please try again."); }
    finally { setBusy(false); }
  }
  return <AuthFrame><section className="w-full max-w-[390px] text-[#071A4A]"><h1 className="text-3xl font-extrabold">Choose a new password</h1>{checking ? <p role="status" className="mt-5">Checking your reset link…</p> : done ? <div className="mt-5"><p role="status" className="rounded-xl bg-[#EAF5FF] p-4 text-sm">Your password has been updated. Sign in with your new password.</p><Link href="/login" className="mt-5 inline-block font-bold text-[#3558AE]">Sign in</Link></div> : !ready ? <div className="mt-5"><p role="alert" className="text-sm leading-6">Open the link in your password reset email. If it has expired or has already been used, request a new one.</p><Link href="/forgot-password" className="mt-5 inline-block font-bold text-[#3558AE]">Request a new reset link</Link></div> : <form onSubmit={submit} className="mt-6 space-y-4"><label htmlFor="new-password" className="block text-sm font-bold">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-[#071A4A]/15 px-4" /><label htmlFor="confirm-password" className="block text-sm font-bold">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmation} onChange={e => setConfirmation(e.target.value)} className="h-12 w-full rounded-xl border border-[#071A4A]/15 px-4" />{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[#071A4A] font-bold text-white disabled:opacity-50">{busy ? "Updating…" : "Update password"}</button></form>}</section></AuthFrame>;
}
