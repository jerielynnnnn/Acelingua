"use client";

import AuthFrame from "@/components/AuthFrame";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { POST_AUTH_ROUTE, registrationOnboardingMetadata } from "@/lib/auth-onboarding";
import { readPreview } from "@/lib/guest-preview";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const { data: { user } } = await createClient().auth.getUser();
      if (!cancelled && user) {
        setReady(true); setSuccess(true);
        setMessage("You're signed in. Continue setting up or return to your dashboard.");
      }
    }
    void restore().catch(() => { /* The form can still display sign-up errors. */ });
    return () => { cancelled = true; };
  }, []);

  async function handleGoogleRegister() {
    setGoogleLoading(true);
    setMessage("");
    setSuccess(false);
    try {
      const supabase = createClient();
      localStorage.setItem("acelingua_registration_pending", "true");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    let onboarding;
    const preview = readPreview();
    try {
      onboarding = registrationOnboardingMetadata();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Please allow browser storage and try again.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username,
          display_name: username,
          acelingua_onboarding: { ...onboarding, ...(onboarding.source === "guest_preview" && preview?.completed ? { courseId: preview.courseId } : {}) },
          acelingua_guest_preview: preview?.completed ? preview : null,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      if (onboarding.source === "guest_preview") {
        router.replace(POST_AUTH_ROUTE);
        return;
      }
      setReady(true);
      setSuccess(true);
      setMessage("Your account is ready! Start your language adventure with Ace.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setMessage(
      "Account created! Check your email to verify your account."
    );

    setLoading(false);
  }

  return <AuthFrame>
<div className="w-full max-w-[390px]">

              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3558AE]">
                  Get started
                </p>

                <h1 className="mt-2 text-[30px] font-extrabold tracking-tight text-[#071A4A]">
                  Create your account
                </h1>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">

                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-xs font-bold text-[#071A4A]/70"
                  >
                    Username
                  </label>

                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                    autoComplete="username"
                    className="h-12 w-full rounded-xl border border-[#071A4A]/10 bg-[#FAFCFE] px-4 text-sm text-[#071A4A] outline-none transition placeholder:text-[#071A4A]/25 hover:border-[#071A4A]/20 focus:border-[#3558AE]/60 focus:bg-white focus:ring-4 focus:ring-[#3558AE]/5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-bold text-[#071A4A]/70"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-[#071A4A]/10 bg-[#FAFCFE] px-4 text-sm text-[#071A4A] outline-none transition placeholder:text-[#071A4A]/25 hover:border-[#071A4A]/20 focus:border-[#3558AE]/60 focus:bg-white focus:ring-4 focus:ring-[#3558AE]/5"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-bold text-[#071A4A]/70"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      autoComplete="new-password"
                      className="h-12 w-full rounded-xl border border-[#071A4A]/10 bg-[#FAFCFE] px-4 pr-12 text-sm text-[#071A4A] outline-none transition placeholder:text-[#071A4A]/25 hover:border-[#071A4A]/20 focus:border-[#3558AE]/60 focus:bg-white focus:ring-4 focus:ring-[#3558AE]/5"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#071A4A]/30 transition hover:text-[#3558AE]"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-xs font-bold text-[#071A4A]/70"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Enter your password again"
                    required
                    autoComplete="new-password"
                    className="h-12 w-full rounded-xl border border-[#071A4A]/10 bg-[#FAFCFE] px-4 text-sm text-[#071A4A] outline-none transition placeholder:text-[#071A4A]/25 hover:border-[#071A4A]/20 focus:border-[#3558AE]/60 focus:bg-white focus:ring-4 focus:ring-[#3558AE]/5"
                  />
                </div>

                {success && <button type="button" onClick={() => router.push(ready ? POST_AUTH_ROUTE : "/login")} className="mb-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071A4A] text-sm font-bold text-white">Get Started <ArrowRight size={15} /></button>}
                {message && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-xs leading-5 ${
                      success
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071A4A] text-sm font-bold text-white shadow-[0_8px_20px_rgba(7,26,74,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {loading ? "Creating account..." : "Create account"}

                  {!loading && <ArrowRight size={15} />}
                </button>
              </form>

              <button type="button" onClick={handleGoogleRegister} disabled={loading || googleLoading}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#071A4A]/15 bg-white text-sm font-bold transition hover:bg-[#EAF5FF] disabled:opacity-60">
                {googleLoading && <Loader2 size={16} className="animate-spin" />}
                {googleLoading ? "Connecting to Google..." : "Continue with Google"}
              </button>

              <p className="mt-6 text-center text-xs text-[#071A4A]/40">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[#3558AE] transition hover:text-[#071A4A]"
                >
                  Log in
                </Link>
              </p>

              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="text-xs font-medium text-[#071A4A]/30 transition hover:text-[#071A4A]/70"
                >
                  ← Back to home
                </Link>
              </div>
            </div>

  </AuthFrame>;
}
