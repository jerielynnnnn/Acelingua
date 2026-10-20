import type { SupabaseClient } from "@supabase/supabase-js";
import { localDate, nextLocalMidnight, selectedMonth, shiftMonth, shiftDay, streakMetrics, missingFeature, type HistoryDay } from "./streak";

export type DayDetail = { lessons: number; activities: number; xp: number; goal: boolean | null };
type DbError = { code?: string; message: string } | null;
function check(error: DbError, label: string) { if (error) throw new Error(`${label}: ${error.message}`); }
function optional(error: DbError, label: string) { if (error && !missingFeature(error)) check(error, label); }
// Paginate history so Supabase's default row limit cannot silently truncate a long streak.
async function historyRows(client: SupabaseClient, userId: string) {
  const rows: HistoryDay[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from("streak_history").select("activity_date,activities_completed,is_active").eq("user_id", userId).order("activity_date").range(offset, offset + 999);
    check(result.error, "Practice history unavailable");
    rows.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 1000) break;
  }
  return rows;
}
async function completedRows(client: SupabaseClient, table: string, columns: string, userId: string, start: string, end: string) {
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await client.from(table).select(columns).eq("user_id", userId).gte(table === "xp_transactions" ? "created_at" : "completed_at", start).lt(table === "xp_transactions" ? "created_at" : "completed_at", end).order("id").range(offset, offset + 999);
    check(result.error, "Learning details unavailable");
    rows.push(...(result.data ?? []) as unknown as Record<string, unknown>[]);
    if ((result.data?.length ?? 0) < 1000) break;
  }
  return rows;
}
async function frozenRows(client:SupabaseClient,userId:string) {
  const rows:{local_date:string}[]=[];
  for(let offset=0;;offset+=1000) {
    const result=await client.from("streak_freeze_uses").select("local_date").eq("user_id",userId).order("local_date").range(offset,offset+999);
    if(result.error)return {data:null,error:result.error};
    rows.push(...(result.data??[]));
    if((result.data?.length??0)<1000)return {data:rows,error:null};
  }
}
export async function loadStreak(client: SupabaseClient, userId: string, monthInput?: string, now = new Date()) {
  const [profile, preferences, history, freezes, frozen, state, claims, milestones] = await Promise.all([
    client.from("profiles").select("streak,hearts,gems,coins,xp").eq("id", userId).maybeSingle(),
    client.from("user_daily_goal_preferences").select("timezone").eq("user_id", userId).maybeSingle(),
    historyRows(client, userId),
    client.from("streak_freeze_inventory").select("available,capacity").eq("user_id", userId).maybeSingle(),
    frozenRows(client,userId),
    client.from("learner_streak_state").select("current_streak,longest_streak,last_counted_date,legacy_unanchored").eq("user_id", userId).maybeSingle(),
    client.from("streak_milestone_claims").select("days").eq("user_id", userId),
    client.from("streak_milestone_definitions").select("days,coins,gems").order("days"),
  ]);
  check(profile.error, "Profile unavailable"); if (!profile.data) throw new Error("Your learner profile is unavailable.");
  for (const [result, label] of [[preferences,"Timezone"],[freezes,"Freeze inventory"],[frozen,"Freeze history"],[state,"Streak status"],[claims,"Milestone claims"],[milestones,"Milestone rewards"]] as const) optional(result.error,label);
  const timezone = preferences.data?.timezone ?? "Asia/Manila";
  const today = localDate(now, timezone), month = selectedMonth(monthInput,today);
  // Fetch a padded UTC interval, then group by the configured IANA timezone on the server.
  const start = new Date(month + "-01T00:00:00Z"); start.setUTCDate(start.getUTCDate()-2);
  const end = new Date(shiftMonth(month,1) + "-01T00:00:00Z"); end.setUTCDate(end.getUTCDate()+2);
  const [lessons, activities, xp, goals, day] = await Promise.all([
    completedRows(client,"lesson_progress","id,status,completed_at",userId,start.toISOString(),end.toISOString()),
    completedRows(client,"activity_progress","id,status,completed_at",userId,start.toISOString(),end.toISOString()),
    completedRows(client,"xp_transactions","id,amount,created_at",userId,start.toISOString(),end.toISOString()),
    client.from("daily_goals").select("goal_date,target_activities,completed_activities,is_completed").eq("user_id",userId).gte("goal_date",month+"-01").lt("goal_date",shiftMonth(month,1)+"-01"),
    client.from("user_learning_days").select("id").eq("user_id",userId).eq("local_date",today).maybeSingle(),
  ]);
  check(goals.error,"Daily goals unavailable"); optional(day.error,"Daily missions");
  const detail: Record<string,DayDetail> = {};
  const entry = (date: string) => detail[date] ??= {lessons:0,activities:0,xp:0,goal:null};
  for (const [rows,kind] of [[lessons,"lessons"],[activities,"activities"]] as const) {
    for (const row of rows) {
      if (row.status !== "completed" || typeof row.completed_at !== "string") continue;
      const date=localDate(new Date(row.completed_at),timezone);
      if(date.startsWith(month)) entry(date)[kind]++;
    }
  }
  for(const row of xp) if(typeof row.created_at === "string") {const date=localDate(new Date(row.created_at),timezone);if(date.startsWith(month))entry(date).xp+=Number(row.amount);}
  for(const goal of goals.data ?? []) entry(goal.goal_date).goal=goal.is_completed;
  let goal = (goals.data ?? []).find(g=>g.goal_date===today) ?? null;
  if(!today.startsWith(month)) {const result=await client.from("daily_goals").select("goal_date,target_activities,completed_activities,is_completed").eq("user_id",userId).eq("goal_date",today).maybeSingle();check(result.error,"Today's goal unavailable");goal=result.data;}
  const frozenDates = (frozen.data ?? []).map(r=>r.local_date as string);
  const metrics=streakMetrics(history,frozenDates,today);
  // Keep the saved counter authoritative. This page never resets or increments profiles.streak.
  const longest=Math.max(metrics.longest,profile.data.streak,state.data?.longest_streak ?? 0);
  let missionSummary: {completed:number;total:number} | null = null;
  if(day.data) {
    const assigned=await client.from("user_daily_missions").select("id,target,event_kind").eq("user_id",userId).eq("day_id",day.data.id).eq("cadence","daily");
    check(assigned.error,"Daily missions unavailable");
    const dayId=day.data.id;
    const completed=await Promise.all((assigned.data ?? []).map(async m=>{
      const events=await client.from("verified_learning_events").select("id",{count:"exact",head:true}).eq("user_id",userId).eq("day_id",dayId).eq("event_kind",m.event_kind);
      check(events.error,"Mission progress unavailable");
      return (events.count ?? 0)>=m.target;
    }));
    missionSummary={total:completed.length,completed:completed.filter(Boolean).length};
  }
  return {profile:profile.data,today,month,timezone,serverNow:now.toISOString(),resetsAt:nextLocalMidnight(now,timezone),history:history.filter(h=>h.activity_date.startsWith(month)),detail,
    practicedToday:metrics.practicedToday,longest,goal,missionSummary,
    freezes:freezes.error ? null : freezes.data, frozenDates:frozenDates.filter(d=>d.startsWith(month)),
    milestoneRewards:milestones.data ?? [],claimedMilestones:(claims.data ?? []).map(c=>c.days as number),
    rewardsReady:Boolean(state.data && !state.data.legacy_unanchored && !milestones.error && !claims.error),
    rewardLongest:state.data?.longest_streak ?? 0,
    historyGap:Boolean(profile.data.streak>0 && !metrics.practicedToday && !metrics.active.includes(shiftDay(today,-1))),
  };
}
export type StreakData = Awaited<ReturnType<typeof loadStreak>>;
