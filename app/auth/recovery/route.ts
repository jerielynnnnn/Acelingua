import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token_hash");
  if (token) {
    try {
      const client = await createClient();
      const { error } = await client.auth.verifyOtp({ token_hash: token, type: "recovery" });
      if (!error) return NextResponse.redirect(`${origin}/reset-password`, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
    } catch { /* Invalid or unavailable recovery should offer a fresh link. */ }
  }
  return NextResponse.redirect(`${origin}/forgot-password?error=recovery`, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
