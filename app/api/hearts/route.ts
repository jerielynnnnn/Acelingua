import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
const headers = { "Cache-Control": "private, no-store" };
export async function GET() {
  const client = await createClient(); const { data: { user }, error: authError } = await client.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: "Please sign in." }, { status: 401, headers });
  const result = await client.rpc("acelingua_hearts_snapshot");
  if (!result.error) return NextResponse.json(result.data, { headers });
  if (!["PGRST202", "42883"].includes(result.error.code)) return NextResponse.json({ error: "Hearts could not be refreshed." }, { status: 500, headers });
  const profile = await client.from("profiles").select("hearts").eq("id", user.id).single();
  if (profile.error) return NextResponse.json({ error: "Hearts could not be loaded." }, { status: 500, headers });
  return NextResponse.json({ hearts: profile.data.hearts, next_heart_at: null, server_now: new Date().toISOString(), available: false }, { headers });
}
export async function POST() { return NextResponse.json({ error: "Practice does not cost hearts. Submit assessed answers through the quiz endpoint." }, { status: 405, headers }); }
