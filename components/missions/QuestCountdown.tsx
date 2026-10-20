"use client";
import {useEffect,useState} from "react";
import {countdown} from "@/lib/quests";
export default function QuestCountdown({serverNow,resetsAt}:{serverNow:string;resetsAt:string}){
 const [label,setLabel]=useState("—");
 useEffect(()=>{const started=performance.now(),duration=Date.parse(resetsAt)-Date.parse(serverNow);const tick=()=>setLabel(countdown(duration-(performance.now()-started)));const first=setTimeout(tick,0),interval=setInterval(tick,1000);return()=>{clearTimeout(first);clearInterval(interval);};},[serverNow,resetsAt]);
 return <span>{label}</span>;
}
