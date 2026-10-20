"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
export default function StreakDateRefresh({serverNow,resetsAt}:{serverNow:string;resetsAt:string}){
 const router=useRouter();
 useEffect(()=>{
  const timer=setTimeout(()=>router.refresh(),Math.max(1000,Date.parse(resetsAt)-Date.parse(serverNow)+1000));
  const refresh=()=>{if(document.visibilityState==="visible")router.refresh();};
  document.addEventListener("visibilitychange",refresh);
  return()=>{clearTimeout(timer);document.removeEventListener("visibilitychange",refresh);};
 },[router,serverNow,resetsAt]);
 return null;
}
