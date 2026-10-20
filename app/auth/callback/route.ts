import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const recovery = searchParams.get("next") === "/reset-password";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${recovery ? "/reset-password" : "/onboarding/continue"}`);
    }
  }

  return NextResponse.redirect(`${origin}${recovery ? "/forgot-password?error=recovery" : "/login?error=auth"}`);
}
