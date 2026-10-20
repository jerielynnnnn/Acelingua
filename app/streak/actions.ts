"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STREAK_MILESTONES } from "@/lib/streak";

export async function claimStreakMilestone(days: number): Promise<{error?:string;coins?:number;gems?:number;alreadyClaimed?:boolean}> {
  if(!STREAK_MILESTONES.some(m=>m.days===days)) return {error:"This milestone is unavailable."};
  try {
    const client=await createClient();
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError || !user) return {error:"Please sign in again before claiming."};
    const {data,error}=await client.rpc("acelingua_claim_streak_milestone",{p_days:days});
    if(error) return {error:error.message};
    if(!data || typeof data.coins!=="number" || typeof data.gems!=="number") return {error:"The reward could not be confirmed. Refresh before trying again."};
    revalidatePath("/streak");revalidatePath("/dashboard");
    return {coins:data.coins,gems:data.gems,alreadyClaimed:data.already_claimed===true};
  } catch {return {error:"We couldn't claim your reward. Please try again."};}
}
