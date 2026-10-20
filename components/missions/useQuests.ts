"use client";
import {useCallback,useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {parseQuestSnapshot,type QuestSnapshot} from "@/lib/quests";
export function useQuests(){
 const router=useRouter();const [data,setData]=useState<QuestSnapshot|null>(null);const [error,setError]=useState("");const [attempt,setAttempt]=useState(0);
 const retry=useCallback(()=>setAttempt(n=>n+1),[]);
 useEffect(()=>{let cancelled=false;let timer:ReturnType<typeof setTimeout>;const controller=new AbortController();
 async function refresh(){try{const response=await fetch("/api/missions",{cache:"no-store",signal:AbortSignal.any([controller.signal,AbortSignal.timeout(20000)])});if(response.status===401){router.replace("/login");return;}const value=await response.json();if(!response.ok)throw new Error(value.error||"Your quests could not be loaded.");const next=parseQuestSnapshot(value);if(!cancelled){setData(next);setError("");clearTimeout(timer);timer=setTimeout(()=>void refresh(),Math.max(1000,Date.parse(next.resets_at)-Date.parse(next.server_now)+1000));}}catch(cause){if(!cancelled)setError(cause instanceof Error?cause.message:"Your quests could not be loaded.");}}
 void refresh();const visible=()=>{if(document.visibilityState==="visible")void refresh();};const progress=()=>void refresh();document.addEventListener("visibilitychange",visible);window.addEventListener("acelingua:balance-updated",progress);
 return()=>{cancelled=true;controller.abort();clearTimeout(timer);document.removeEventListener("visibilitychange",visible);window.removeEventListener("acelingua:balance-updated",progress);};
 },[attempt,router]);
 return {data,setData,error,retry};
}
