"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Home,
  Cloud,
  Sparkles,
  Star,
  Languages,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { POST_AUTH_ROUTE } from "@/lib/auth-onboarding";

/** A single-viewport, pastel login scene matching the homepage's animated gradient. */
export default function LoginPage() {
  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <main className="acel-login-scene fixed inset-0 isolate h-[100dvh] w-full overflow-hidden text-[#102452]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="acel-login-aurora-one absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-[#C7A9D4]/40 blur-[100px]" />
        <div className="acel-login-aurora-two absolute -right-28 top-[14%] h-[500px] w-[580px] rounded-full bg-[#85D8FA]/35 blur-[100px]" />
        <div className="acel-login-aurora-three absolute bottom-[-190px] left-[32%] h-[490px] w-[550px] rounded-full bg-[#FF9297]/20 blur-[100px]" />
        <Cloud className="acel-cloud-one absolute left-[5%] top-[15%] h-16 w-24 text-white/70 drop-shadow-md" strokeWidth={1.3} />
        <Cloud className="acel-cloud-two absolute left-[44%] top-[11%] h-12 w-20 text-white/60" strokeWidth={1.3} />
        <Cloud className="acel-cloud-three absolute bottom-[14%] left-[8%] h-14 w-24 text-white/65" strokeWidth={1.3} />
        <Cloud className="acel-cloud-four absolute bottom-[10%] right-[6%] h-16 w-28 text-white/55" strokeWidth={1.3} />
        <Languages className="acel-login-twinkle absolute left-[15%] top-[31%] h-6 w-6 text-[#00008B]" />
      </div>

      {/* Home is part of the page navigation instead of a stray link beneath the form. */}
      <div className="absolute left-4 top-4 z-30 sm:left-8 sm:top-7 lg:left-12">
        <Link
          href="/"
          aria-label="Back to ACELingua homepage"
          className="group inline-flex h-11 items-center gap-2 rounded-full border border-white/75 bg-white/55 px-4 text-xs font-extrabold text-[#102452] shadow-[0_8px_25px_rgba(35,64,116,.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-[0_12px_25px_rgba(53,88,174,.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3558AE]"
        >
          <Home size={16} className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          <span>Home</span>
        </Link>
      </div>

      <div className="acel-login-layout relative z-10 mx-auto grid h-full w-full max-w-[1440px] grid-cols-1 items-center gap-0 px-4 pb-3 pt-[64px] sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-12 lg:pb-8 lg:pt-[76px]">
        {/* Keep the speech bubble and mascot inside the same positioned block, so they never drift apart. */}
        <section aria-label="Ace welcomes you" className="relative mx-auto flex h-[clamp(128px,22dvh,190px)] w-full max-w-[580px] items-center justify-center lg:h-full lg:min-h-0">
          <div aria-hidden="true" className="absolute inset-0 m-auto h-[min(54dvh,480px)] w-[min(54dvh,480px)] rounded-full bg-[radial-gradient(circle,rgba(133,216,250,.32),rgba(199,169,212,.16)_55%,transparent_75%)] blur-xl" />
          <div className="acel-mascot-fixed relative flex h-full w-[min(100%,510px)] items-center justify-center lg:h-[min(65dvh,550px)]">
            <div className="absolute left-[24%] top-[13%] z-20 lg:left-[33%] lg:top-[8%]">
              <div className="relative whitespace-nowrap rounded-[20px] border border-white/80 bg-white/85 px-4 py-2.5 text-[13px] font-black text-[#102452] shadow-[0_12px_30px_rgba(53,88,174,.15)] backdrop-blur-xl sm:text-sm lg:px-6 lg:py-4 lg:text-[19px]">
                Hello, Explorer! <span aria-hidden="true">👋</span>
                <span aria-hidden="true" className="absolute -bottom-[7px] left-[38%] h-3.5 w-3.5 rotate-45 border-b border-r border-white/80 bg-white/85" />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-[-11%] top-[16%] flex items-center justify-center lg:bottom-[4%] lg:top-[17%]">
              <Image
                src="/icon head.png"
                alt="Ace, the ACELingua mascot, welcoming learners"
                width={570}
                height={570}
                priority
                sizes="(min-width: 1024px) 520px, 240px"
                className="h-full w-full max-w-[min(64vw,245px)] object-contain drop-shadow-[0_20px_23px_rgba(69,92,172,.20)] lg:max-w-[520px]"
              />
            </div>
          </div>
          <p className="absolute bottom-5 left-1/2 hidden w-max max-w-full -translate-x-1/2 text-center text-sm font-semibold text-[#53658e] lg:block">Hi I'm ACE, Nice to meet you ^-^</p>
        </section>

        <section aria-label="Sign in" className="relative mx-auto flex min-h-0 w-full max-w-[520px] items-center justify-center overflow-y-auto overscroll-contain rounded-[28px] border border-white/75 bg-white/65 px-5 py-5 shadow-[0_28px_80px_rgba(53,88,174,.12)] backdrop-blur-2xl sm:px-9 sm:py-7 lg:max-h-[calc(100dvh-130px)] lg:rounded-[32px] lg:px-10 lg:py-9">
          <Suspense fallback={<p className="py-10 text-center text-[#102452]">Loading sign in...</p>}>
            <LoginForm />
          </Suspense>
        </section>
      </div>

      <style jsx global>{`
        .acel-login-scene {
          background: linear-gradient(124deg, #f9f2ff 0%, #e6f7ff 29%, #eeeafd 61%, #fff0e9 100%);
          background-size: 220% 220%;
          animation: acel-login-gradient 24s ease-in-out infinite alternate;
        }
        .acel-login-aurora-one { animation: acel-login-aurora 19s ease-in-out infinite alternate; }
        .acel-login-aurora-two { animation: acel-login-aurora 22s -6s ease-in-out infinite alternate-reverse; }
        .acel-login-aurora-three { animation: acel-login-aurora 25s -8s ease-in-out infinite alternate; }
        .acel-cloud-one { animation: acel-login-cloud 9s ease-in-out infinite alternate; }
        .acel-cloud-two { animation: acel-login-cloud 13s -5s ease-in-out infinite alternate-reverse; }
        .acel-cloud-three { animation: acel-login-cloud 11s -2s ease-in-out infinite alternate; }
        .acel-cloud-four { animation: acel-login-cloud 14s -7s ease-in-out infinite alternate-reverse; }
        .acel-login-twinkle { animation: acel-login-sparkle 4s ease-in-out infinite; }
        .acel-login-twinkle-late { animation: acel-login-sparkle 4.5s -1.5s ease-in-out infinite; }
        .acel-auth-motion { animation: acel-auth-arrive 420ms cubic-bezier(.22,1,.36,1) both; }
        .acel-auth-motion.acel-auth-exiting { pointer-events: none; animation: acel-auth-depart 260ms cubic-bezier(.55,.06,.68,.19) both; }
        @keyframes acel-login-gradient { from { background-position: 0% 30%; } to { background-position: 100% 70%; } }
        @keyframes acel-login-aurora { from { transform: translate3d(-16px,12px,0) scale(1); } to { transform: translate3d(22px,-20px,0) scale(1.12); } }
        @keyframes acel-login-cloud { from { transform: translate3d(0,0,0); } to { transform: translate3d(28px,-12px,0); } }
        @keyframes acel-login-sparkle { 0%,100% { opacity: .45; transform: scale(.85); } 50% { opacity: 1; transform: scale(1.12); } }
        @keyframes acel-auth-arrive { from { opacity: 0; transform: translate3d(0,18px,0) scale(.985); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
        @keyframes acel-auth-depart { from { opacity: 1; transform: translate3d(0,0,0) scale(1); } to { opacity: 0; transform: translate3d(0,-12px,0) scale(.99); } }
        @media (max-width: 1023px) {
          .acel-login-layout { grid-template-rows: auto minmax(0,1fr); }
          .acel-login-scene section[aria-label="Sign in"] { max-height: 100%; }
        }
        @media (max-height: 730px) and (min-width: 1024px) {
          .acel-login-form { zoom: .91; }
        }
        @media (max-height: 620px) and (min-width: 1024px) {
          .acel-login-form { zoom: .80; }
        }
        @media (max-height: 850px) and (max-width: 1023px) {
          .acel-login-scene section[aria-label="Ace welcomes you"] { height: 105px; }
          .acel-login-scene section[aria-label="Sign in"] { padding-top: 14px; padding-bottom: 14px; }
          .acel-login-form { zoom: .91; }
        }
        @media (max-height: 700px) and (max-width: 1023px) {
          .acel-login-scene section[aria-label="Ace welcomes you"] { height: 76px; }
          .acel-login-form { zoom: .80; }
        }
        @media (max-height: 570px) and (max-width: 1023px) {
          .acel-login-scene section[aria-label="Ace welcomes you"] { height: 66px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .acel-login-scene, .acel-login-aurora-one, .acel-login-aurora-two,
          .acel-login-aurora-three, .acel-cloud-one, .acel-cloud-two,
          .acel-cloud-three, .acel-cloud-four,
          .acel-login-twinkle, .acel-login-twinkle-late, .acel-auth-motion,
          .acel-auth-motion.acel-auth-exiting { animation: none !important; }
        }
      `}</style>
    </main>
  );
}

function LoginForm() {
  const callbackFailed = useSearchParams().get("error") === "auth";
  const supabase = createClient();
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const navigationTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
  }, []);

  function openRegister(event: ReactMouseEvent<HTMLAnchorElement>) {
    // Preserve browser commands such as Ctrl+click, middle-click, and open-in-new-tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
    event.preventDefault();
    if (isExiting) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/register");
      return;
    }
    setIsExiting(true);
    navigationTimer.current = window.setTimeout(() => router.push("/register"), 260);
  }

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

  return <div className={`acel-login-form acel-auth-motion w-full max-w-[390px] ${isExiting ? "acel-auth-exiting" : ""}`}>

              <div className="mb-7">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3558AE]">
                  YOUR JOURNEY CONTINUES
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

                  <div className="group relative border-b border-[#071A4A]/15">
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-px left-0 z-10 h-[2px] w-full origin-left scale-x-0 bg-[#3558AE] transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:scale-x-100 motion-reduce:transition-none" />
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
                      className="relative h-11 w-full border-0 bg-transparent px-0 text-sm text-[#071A4A] outline-none placeholder:text-[#071A4A]/35 focus:outline-none focus:ring-0"
                    />
                  </div>
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
                      className="text-xs font-semibold text-[#3558AE] transition hover:text-[#071A4A]"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="group relative border-b border-[#071A4A]/15">
                    <span aria-hidden="true" className="pointer-events-none absolute -bottom-px left-0 z-10 h-[2px] w-full origin-left scale-x-0 bg-[#3558AE] transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within:scale-x-100 motion-reduce:transition-none" />
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
                      className="relative h-11 w-full border-0 bg-transparent px-0 pr-10 text-sm text-[#071A4A] outline-none placeholder:text-[#071A4A]/35 focus:outline-none focus:ring-0"
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
                      className="absolute right-1 top-1/2 z-20 -translate-y-1/2 text-[#071A4A]/30 transition hover:text-[#3558AE]"
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
                  onClick={openRegister}
                  className="font-bold text-[#3558AE] transition hover:text-[#071A4A]"
                >
                  Create an account
                </Link>
              </p>

            </div>;
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
