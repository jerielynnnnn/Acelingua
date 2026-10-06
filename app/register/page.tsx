"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { readGuestLesson } from "@/lib/guest-onboarding";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username,
          display_name: username,
          guest_lesson: readGuestLesson(),
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace("/dashboard");
      return;
    }

    setSuccess(true);
    setMessage(
      "Account created! Check your email to verify your account."
    );

    setLoading(false);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F4F9FD] text-[#071A4A]">
      {/* ===================================================
          SUBTLE PAGE BACKGROUND
      =================================================== */}

      <div className="pointer-events-none absolute -right-[380px] -top-[520px] h-[1100px] w-[850px] rounded-full bg-[#2A255C]" />

      <div className="pointer-events-none absolute -bottom-[500px] -left-[350px] h-[850px] w-[850px] rounded-full bg-[#E7F3FC]" />

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="relative z-30 mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 md:px-10 lg:px-14">
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

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[#071A4A]/45 sm:inline">
            Already have an account?
          </span>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#071A4A]/10 bg-white px-5 py-2.5 text-xs font-bold text-[#071A4A] shadow-sm transition hover:border-[#3558AE]/30 hover:text-[#3558AE]"
          >
            Log in
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* ===================================================
          REGISTER CONTAINER
      =================================================== */}

      <section className="relative z-20 flex min-h-[calc(100vh-80px)] items-center justify-center px-5 pb-12 pt-4">
        <div className="grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border border-[#071A4A]/5 bg-white shadow-[0_24px_70px_rgba(7,26,74,0.10)] lg:grid-cols-[1.08fr_0.92fr]">
          {/* =================================================
              LEFT — REGISTER FORM
          ================================================= */}

          <div className="flex items-center justify-center px-7 py-10 sm:px-12 lg:px-16 lg:py-12">
            <div className="w-full max-w-[390px]">
              {/* Heading */}

              <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3558AE]">
                  Get started
                </p>

                <h1 className="mt-2 text-[30px] font-extrabold tracking-tight text-[#071A4A]">
                  Create your account
                </h1>
              </div>

              {/* =================================================
                  FORM
              ================================================= */}

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Username */}

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

                {/* Email */}

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

                {/* Password */}

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

                {/* Confirm Password */}

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

                {/* Message */}

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

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071A4A] text-sm font-bold text-white shadow-[0_8px_20px_rgba(7,26,74,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#3558AE] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {loading ? "Creating account..." : "Create account"}

                  {!loading && <ArrowRight size={15} />}
                </button>
              </form>

              {/* Login link */}

              <p className="mt-6 text-center text-xs text-[#071A4A]/40">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-[#3558AE] transition hover:text-[#071A4A]"
                >
                  Log in
                </Link>
              </p>

              {/* Back */}

              <div className="mt-5 text-center">
                <Link
                  href="/"
                  className="text-xs font-medium text-[#071A4A]/30 transition hover:text-[#071A4A]/70"
                >
                  ← Back to home
                </Link>
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT — BRAND PANEL
          ================================================= */}

          <div className="relative hidden min-h-[620px] overflow-hidden bg-[#2a246c] lg:block">
            {/* =================================================
                CLEAN CURVED EDGE
            ================================================= */}

            <div className="absolute -left-[210px] -top-[70px] h-[800px] w-[290px] rounded-[50%] bg-white" />

            {/* Soft gradients */}

            <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-[#3558AE]/50 blur-3xl" />

            <div className="absolute -bottom-32 right-10 h-[350px] w-[350px] rounded-full bg-[#B64074]/15 blur-3xl" />

            {/* =================================================
                MINIMAL DECORATIONS
            ================================================= */}

            <div className="absolute right-16 top-16 h-16 w-16 rounded-full border border-white/10" />

            <div className="absolute right-24 top-36 h-2 w-2 rounded-full bg-[#F9C3D7]/60" />

            <div className="absolute bottom-24 right-14 h-24 w-24 rounded-full border border-[#C7A9D4]/15" />

            <div className="absolute bottom-20 left-32 text-4xl font-light text-white/10">
              +
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="relative z-10 flex min-h-[620px] flex-col justify-center pl-[125px] pr-12">
              {/* Ace */}

              <div className="relative mb-7 w-fit">
                <div className="absolute inset-4 rounded-full bg-[#4A7FA7]/40 blur-3xl" />

                <Image
                  src="/icon head.png"
                  alt="Ace"
                  width={160}
                  height={160}
                  className="relative h-[250px] w-[250px] object-contain drop-shadow-[0_18px_25px_rgba(0,0,0,0.18)]"
                />
              </div>

              {/* Text */}

              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F9C3D7]">
                Learn with Ace
              </p>

              <h2 className="mt-3 max-w-[290px] text-[28px] font-extrabold leading-[1.2] tracking-tight text-white">
                A smarter way to learn a language.
              </h2>

              <p className="mt-4 max-w-[290px] text-sm leading-6 text-white/55">
                Practice through interactive lessons, speaking activities,
                and progress that keeps you moving forward.
              </p>

              {/* Features */}

              <div className="mt-8 space-y-3">
                
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
