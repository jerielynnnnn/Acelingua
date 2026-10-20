import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {loadDailyGoal} from "@/lib/daily-goal";
const headers={"Cache-Control":"private, no-store"};
export async function GET(){
 try{
  const client=await createClient();const {data:{user},error}=await client.auth.getUser();
  if(!user)return NextResponse.json({error:"Please sign in again."},{status:401,headers});
  if(error)throw error;
  return NextResponse.json(await loadDailyGoal(client,user.id),{headers});
 }catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:"Your daily goal could not be loaded."},{status:500,headers});}
}
export async function POST(){return NextResponse.json({error:"Daily learning quests are set by ACELingua and cannot be customized."},{status:405,headers:{...headers,Allow:"GET"}});}
