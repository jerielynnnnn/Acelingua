import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { awardProgress, type Award } from "@/lib/achievements";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (!user || authError) return NextResponse.json({ error: "Please sign in to view achievements." }, { status: 401, headers });
    const results = await Promise.all([
      client.from("achievements").select("id,name,description,requirement_type,requirement_value,xp_reward,coin_reward").eq("is_active", true).order("requirement_value"),
      client.from("user_achievements").select("achievement_id,unlocked_at").eq("user_id", user.id),
      client.from("profiles").select("xp,streak").eq("id", user.id).single(),
      client.from("lesson_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
      client.from("activity_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
    ]);
    for (const result of results) if (result.error) throw result.error;
    const [catalog, owned, profile, lessons, activities] = results;
    // Activity IDs are paginated below; never silently truncate a learner's totals.
    const completedIds: string[] = [];
    for (let start = 0; ; start += 1000) {
      const page = await client.from("activity_progress").select("activity_id").eq("user_id", user.id).eq("status", "completed").order("id").range(start, start + 999);
      if (page.error) throw page.error;
      completedIds.push(...page.data.map(row => row.activity_id));
      if (page.data.length < 1000) break;
    }
    const completed = new Set(completedIds);
    const counts: Record<string, number> = { lessons_completed: lessons.count!, activities_completed: activities.count!, xp_earned: profile.data!.xp };
    const [streak, preference] = await Promise.all([
      client.from("learner_streak_state").select("current_streak,last_counted_date,legacy_unanchored").eq("user_id", user.id).maybeSingle(),
      client.from("user_daily_goal_preferences").select("timezone").eq("user_id", user.id).maybeSingle(),
    ]);
    if (!streak.error && !preference.error && streak.data) {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: preference.data?.timezone ?? "Asia/Manila" });
      const yesterday = new Date(Date.parse(today + "T00:00:00Z") - 86400000).toISOString().slice(0, 10);
      counts.streak = !streak.data.legacy_unanchored && streak.data.last_counted_date >= yesterday ? streak.data.current_streak : 0;
    }
    // These counts require the complete activity catalog. Fetch only the user's completed IDs in batches.
    counts.speaking_completed = 0; counts.quiz_completed = 0;
    for (let start = 0; start < completedIds.length; start += 100) {
      const page = await client.from("activities").select("id,activity_type").in("id", completedIds.slice(start, start + 100));
      if (page.error) throw page.error;
      for (const activity of page.data) if (completed.has(activity.id)) {
        if (activity.activity_type === "speaking") counts.speaking_completed++;
        if (activity.activity_type === "quiz") counts.quiz_completed++;
      }
    }
    const awards: Award[] = (catalog.data ?? []).map(row => ({ ...row, progress: awardProgress(row.requirement_type, counts), unlocked_at: owned.data?.find(item => item.achievement_id === row.id)?.unlocked_at ?? null }));
    const capability = await client.rpc("acelingua_achievement_claim_available");
    return NextResponse.json({ awards, claiming_available: !capability.error && capability.data === true }, { headers });
  } catch {
    return NextResponse.json({ error: "Achievements could not be loaded. Please retry." }, { status: 500, headers });
  }
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403, headers });
  const body = await request.json().catch(() => null);
  if (!body || Object.keys(body).length !== 1 || typeof body.achievementId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.achievementId)) return NextResponse.json({ error: "Choose a valid achievement." }, { status: 400, headers });
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (!user || authError) return NextResponse.json({ error: "Please sign in to collect awards." }, { status: 401, headers });
  const { data, error } = await client.rpc("acelingua_claim_achievement", { p_achievement: body.achievementId });
  if (error) return NextResponse.json({ error: "This award could not be collected. Refresh your progress and try again." }, { status: 400, headers });
  return NextResponse.json(data, { headers });
}
