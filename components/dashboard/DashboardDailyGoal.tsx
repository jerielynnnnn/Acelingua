"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import {Target,Check,Gift,X,Lock,Clock,ChevronRight,Coins,Gem,Sparkles} from "lucide-react";
import {useQuests} from "@/components/missions/useQuests";
import QuestCountdown from "@/components/missions/QuestCountdown";
import {parseQuestReward,parseQuestSnapshot,questSummary} from "@/lib/quests";
import styles from "./DailyMissionPanel.module.css";

function Rewards({xp,coins,gems}:{xp:number;coins:number;gems:number}) {
 return <span className={styles.rewards}><span><Sparkles size={15}/>{xp} XP</span><span><Coins size={15}/>{coins}</span>{gems>0&&<span><Gem size={15}/>{gems}</span>}</span>;
}
export default function DashboardDailyGoal(){
 const {data,setData,error,retry}=useQuests();const summary=data?questSummary(data):null;
 const dialog=useRef<HTMLDialogElement>(null);const inFlight=useRef(false);
 const [pending,setPending]=useState(false);const [message,setMessage]=useState("");const [claimError,setClaimError]=useState("");
 async function claim(ids:(string|null)[],all=false){
  if(inFlight.current)return;inFlight.current=true;setPending(true);setMessage("");setClaimError("");
  let xp=0,coins=0,gems=0,changed=false;
  async function request(missionId:string|null){
   const response=await fetch("/api/missions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({missionId}),signal:AbortSignal.timeout(20000)});
   const result=await response.json();if(!response.ok)throw new Error(result.error||"Your reward could not be confirmed. Please retry.");
   const reward=parseQuestReward(result.reward);xp+=reward.xp;coins+=reward.coins;gems+=reward.gems;changed=true;
   if(result.snapshot){const snapshot=parseQuestSnapshot(result.snapshot);setData(snapshot);return snapshot;}retry();return null;
  }
  try{let latest=null;for(const id of ids)latest=await request(id);if(all&&latest&&questSummary(latest).chestReady)await request(null);
   setMessage(`Collected +${xp} XP, +${coins} coins${gems ? `, +${gems} gems` : ""}!`);
  }catch(cause){setClaimError(cause instanceof Error?cause.message:"Please refresh and try again.");retry();}
  finally{if(changed)window.dispatchEvent(new Event("acelingua:balance-updated"));inFlight.current=false;setPending(false);}
 }
 const daily=data?.quests.filter(q=>q.cadence==="daily")??[];
 const ready=daily.filter(q=>!q.claimed&&q.progress>=q.target);
 return <>
  <button type="button" className={styles.launcher} onClick={()=>{dialog.current?.showModal();retry();}} aria-haspopup="dialog">
   <span className={styles.launchIcon}><Target size={25}/></span><span><strong>Daily missions</strong><small>{summary?`${summary.completed}/${summary.total} missions complete`:error?"Tap to retry loading missions":"Loading your missions…"}</small></span><ChevronRight size={19}/>
   {summary && <progress className={styles.launchProgress} aria-label="Daily missions completed" value={summary.completed} max={summary.total || 1} />}
   {summary&&summary.ready>0&&<span className={styles.badge}>{summary.ready} rewards ready</span>}
  </button>
  <dialog ref={dialog} className={styles.dialog} aria-labelledby="daily-mission-title" onClick={event=>{if(event.target===dialog.current)dialog.current.close();}}>
   <div className={styles.panel}>
    <header className={styles.header}><div><span>ACE&apos;S QUEST BOOK</span><h2 id="daily-mission-title">Daily missions</h2></div><button type="button" aria-label="Close daily missions" onClick={()=>dialog.current?.close()} className={styles.close}><X size={22}/></button></header>
    <div className={styles.body}>
     {data&&summary&&<>
      <section className={styles.chest} aria-label="Daily treasure chest"><div className={styles.chestTop}><span className={styles.gift}>{data.chest.claimed?<Check size={31}/>:<Gift size={31}/>}</span><div><h3>Daily treasure chest</h3><p>Collect all {data.chest.required} mission rewards</p><Rewards xp={data.chest.xp} coins={data.chest.coins} gems={data.chest.gems}/></div></div>
       <div className={styles.stamps} aria-label={`${summary.claimed} of ${data.chest.required} rewards collected`}>{Array.from({length:Math.min(data.chest.required,20)},(_,i)=><span key={i} data-done={i<summary.claimed}>{i<summary.claimed?<Check size={17}/>:<Lock size={15}/>}</span>)}</div>
       {summary.chestReady&&<button className={styles.claim} disabled={pending} onClick={()=>void claim([null])}>Open treasure chest</button>}{data.chest.claimed&&<p className={styles.collected}>Treasure collected!</p>}
      </section>
      <div className={styles.toolbar}><span><Clock size={15}/> Resets in <QuestCountdown serverNow={data.server_now} resetsAt={data.resets_at}/></span><button className={styles.claim} disabled={pending||(!ready.length&&!summary.chestReady)} onClick={()=>void claim(ready.length?ready.map(q=>q.id):[null],true)}>{pending?"Collecting…":"Claim all"}</button></div>
     </>}
     {message&&<p role="status" className={styles.notice}>{message}</p>}
     {(error||claimError)&&<p role="alert" className={styles.error}>{claimError||error} <button onClick={retry}>Refresh</button></p>}
     {!data&&!error&&<p role="status">Preparing your missions…</p>}
     <div className={styles.missions}>{daily.map(q=><article key={q.id} className={styles.mission} data-claimed={q.claimed}>
      <div className={styles.progress}><progress aria-label={`${q.title} progress`} value={Math.min(q.progress,q.target)} max={q.target}/><span>{Math.min(q.progress,q.target)} / {q.target}</span></div>
      <div className={styles.missionContent}><div><h3>{q.title}</h3><p>{q.description}</p><Rewards xp={q.reward_xp} coins={q.reward_coins} gems={q.reward_gems}/></div>
       {q.claimed?<span className={styles.collected}><Check size={17}/> Claimed</span>:q.progress>=q.target?<button className={styles.claim} disabled={pending} onClick={()=>void claim([q.id])}>Claim</button>:<Link className={styles.go} href="/learn">Go learn <ChevronRight size={15}/></Link>}
      </div></article>)}</div>
     {data&&!daily.length&&<p>No missions assigned yet. Refresh to check again.</p>}
    </div>
    <footer className={styles.footer}><Link href="/missions">Weekly quests &amp; rewards</Link><Link href="/streak">Streak Society</Link></footer>
   </div>
  </dialog>
 </>;
}
