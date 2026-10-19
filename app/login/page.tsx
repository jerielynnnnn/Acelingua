"use client";

import AuthFrame from "@/components/AuthFrame";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { POST_AUTH_ROUTE } from "@/lib/auth-onboarding";

export default function LoginPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#EAF5FF] text-[#071A4A]">Loading sign in...</main>}><LoginForm /></Suspense>;
}

function LoginForm() {
  const callbackFailed = useSearchParams().get("error") === "auth";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const visibleError = errorMessage || (callbackFailed ? "We couldn't verify your sign-in link. Please try signing in again or request a new verification email." : "");

  /* =========================================================
     EMAIL / PASSWORD LOGIN
  ========================================================= */

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    try { localStorage.setItem("acelingua_onboarding_source", "existing_user"); } catch { /* Authentication can continue without guest storage. */ }
    window.location.href = POST_AUTH_ROUTE;
  }

  /* =========================================================
     GOOGLE LOGIN
  ========================================================= */

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  }

  return <AuthFrame>
<div className="w-full max-w-[390px]">

              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3558AE]">
                  Welcome back
                </p>

                <h1 className="mt-2 text-[30px] font-extrabold tracking-tight text-[#071A4A]">
                  Sign in to ACELINGUA
                </h1>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-[#071A4A]/10 bg-white text-sm font-semibold text-[#071A4A] transition hover:border-[#3558AE]/25 hover:bg-[#FAFCFE] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2
                    size={17}
                    className="animate-spin text-[#3558AE]"
                  />
                ) : (
                  <GoogleIcon />
                )}

                {googleLoading
                  ? "Connecting..."
                  : "Continue with Google"}
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#071A4A]/10" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#071A4A]/30">
                  or continue with email
                </span>

                <div className="h-px flex-1 bg-[#071A4A]/10" />
              </div>

              {visibleError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                  {visibleError}
                </div>
              )}

              <form onSubmit={handleLogin}>

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
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="h-12 w-full rounded-xl border border-[#071A4A]/10 bg-[#FAFCFE] px-4 text-sm text-[#071A4A] outline-none transition placeholder:text-[#071A4A]/25 hover:border-[#071A4A]/20 focus:border-[#3558AE]/60 focus:bg-white focus:ring-4 focus:ring-[#3558AE]/5"
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-xs font-bold text-[#071A4A]/70"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#3558AE]/20 bg-[#EAF5FF] px-3 py-2 text-xs font-bold text-[#3558AE] transition hover:border-[#3558AE]/40 hover:bg-[#DCEEFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3558AE]"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      required
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border border-[#071A4A]/10 bg-[#FAFCFE] px-4 pr-12 text-sm text-[#071A4A] outline-none transition placeholder:text-[#071A4A]/25 hover:border-[#071A4A]/20 focus:border-[#3558AE]/60 focus:bg-white focus:ring-4 focus:ring-[#3558AE]/5"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
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

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071A4A] text-sm font-bold text-white shadow-[0_8px_20px_rgba(7,26,74,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {loading ? "Signing in..." : "Sign in"}

                  {!loading && <ArrowRight size={15} />}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-[#071A4A]/40">
                New to ACELINGUA?{" "}
                <Link
                  href="/register"
                  className="font-bold text-[#3558AE] transition hover:text-[#071A4A]"
                >
                  Create an account
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

/* =========================================================
   GOOGLE ICON
========================================================= */

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z"
      />

      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.4l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.59A10 10 0 0 0 12 22Z"
      />

      <path
        fill="#FBBC05"
        d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.49H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.51l3.35-2.59Z"
      />

      <path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 2.96 14.7 2 12 2a10 10 0 0 0-8.96 5.49l3.35 2.59C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </svg>
  );
}
