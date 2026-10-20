import type { SupabaseClient } from "@supabase/supabase-js";
import {localDate,nextLocalMidnight,missingFeature} from "./streak";
export async function loadDailyGoal(client:SupabaseClient,userId:string,now=new Date()){
 const preferences=await client.from("user_daily_goal_preferences").select("timezone,target_activities").eq("user_id",userId).maybeSingle();
 if(preferences.error&&!missingFeature(preferences.error))throw new Error(preferences.error.message);
 const timezone=preferences.data?.timezone??"Asia/Manila";
 const today=localDate(now,timezone);
 const goal=await client.from("daily_goals").select("target_activities,completed_activities,is_completed").eq("user_id",userId).eq("goal_date",today).maybeSingle();
 if(goal.error)throw new Error(goal.error.message);
 return {goal:goal.data,today,timezone,settingsAvailable:false,nextTarget:preferences.data?.target_activities??3,serverNow:now.toISOString(),resetsAt:nextLocalMidnight(now,timezone)};
}
export type DailyGoalData=Awaited<ReturnType<typeof loadDailyGoal>>;
