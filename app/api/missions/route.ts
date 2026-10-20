import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {parseQuestSnapshot,parseQuestReward} from "@/lib/quests";
const headers={"Cache-Control":"private, no-store"};
export async function GET(){try{
 const client=await createClient();const {data:{user},error:authError}=await client.auth.getUser();
 if(!user||authError)return NextResponse.json({error:"Please sign in to view your quests."},{status:401,headers});
 const {data,error}=await client.rpc("acelingua_fixed_quests_snapshot");if(error)throw error;
 return NextResponse.json(parseQuestSnapshot(data),{headers});
}catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:"We couldn't load your quests. Please retry."},{status:500,headers});}}
export async function POST(request:Request){try{
 if(request.headers.get("origin")!==new URL(request.url).origin)return NextResponse.json({error:"Request origin is not allowed."},{status:403,headers});
 const body=await request.json().catch(()=>null);
 if(!body||!(body.missionId===null||(typeof body.missionId==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.missionId)))||Object.keys(body).some(k=>k!=="missionId"))return NextResponse.json({error:"Choose a valid quest or treasure chest."},{status:400,headers});
 const client=await createClient();const {data:{user},error:authError}=await client.auth.getUser();
 if(!user||authError)return NextResponse.json({error:"Please sign in before claiming."},{status:401,headers});
 const {data,error}=await client.rpc("acelingua_claim_daily_reward",{p_mission_id:body.missionId});if(error)throw error;
 const reward=parseQuestReward(data);
 // A successful claim stays successful even if the following progress refresh fails.
 try{const fresh=await client.rpc("acelingua_fixed_quests_snapshot");if(fresh.error)throw fresh.error;return NextResponse.json({reward,snapshot:parseQuestSnapshot(fresh.data)},{headers});}
 catch{return NextResponse.json({reward,snapshot:null,refreshError:"Your claim was recorded. Refresh to see updated progress."},{headers});}
}catch(cause){return NextResponse.json({error:cause instanceof Error?cause.message:"Your reward could not be claimed. Please retry."},{status:400,headers});}}
