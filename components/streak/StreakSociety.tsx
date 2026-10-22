"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {Flame,Snowflake,Trophy,Sparkles,Target,Check,Lock,ChevronLeft,ChevronRight,Coins,Gem} from "lucide-react";
import type {StreakData} from "@/lib/streak-data";
import {shiftMonth,STREAK_MILESTONES} from "@/lib/streak";
import {claimStreakMilestone} from "@/app/streak/actions";
import StreakCalendar from "./StreakCalendar";
import StreakDateRefresh from "./StreakDateRefresh";
import StreakChallenge from "./StreakChallenge";
import styles from "./StreakSociety.module.css";

export default function StreakSociety({data}:{data:StreakData}) {
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [celebrate,setCelebrate]=useState(false);
 const next=STREAK_MILESTONES.find(m=>m.days>data.profile.streak);
 const practiced=data.history.filter(h=>h.is_active && h.activity_date<=data.today).length;
 const monthName=new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(data.month+"-01T12:00:00Z"));
 function claim(days:number){setMessage("");setError("");setCelebrate(false);startTransition(async()=>{
  const result=await claimStreakMilestone(days);
  if(result.error){setError(result.error);return;}
  setMessage(result.alreadyClaimed?"This reward is already in your collection.":`Ace cheers you on! You earned ${result.coins} coins and ${result.gems} gems.`);
  setCelebrate(!result.alreadyClaimed);window.dispatchEvent(new Event("acelingua:balance-updated"));router.refresh();
 });}
 return <>
 <StreakDateRefresh serverNow={data.serverNow} resetsAt={data.resetsAt}/>
 <section className={styles.hero} aria-labelledby="streak-title"><div className={styles.heroText}><span className={styles.eyebrow}><Flame size={16}/> YOUR DAILY ADVENTURE</span><h1 id="streak-title">Streak Society</h1><div className={styles.streakNumber}>{data.profile.streak}<span>day{data.profile.streak===1?"":"s"} of discovery</span></div><p>{data.profile.streak ? "Every day you learn brings you closer to your next adventure." : "Your adventure starts today! Complete a lesson to begin your streak."}</p><div className={styles.heroStatus}>{data.practicedToday?<><Check size={16}/> You practiced today. Keep that spark!</>:<><Flame size={16}/> Your next lesson is waiting.</>}</div>{next?<div className={styles.nextMilestone}><div><span>Next milestone</span><strong>{next.days} days · {next.name}</strong></div><progress aria-label="Next streak milestone" value={Math.min(data.profile.streak,next.days)} max={next.days}/></div>:<p>Legendary Traveler — what a journey!</p>}</div><div className={styles.aceScene} aria-hidden="true"><span className={styles.halo}/><Sparkles className={styles.sparkleOne} size={32}/><Sparkles className={styles.sparkleTwo} size={22}/><Image src="/icons/fire.png" alt="" width={280} height={280} priority className={styles.ace}/><span className={styles.aceBadge}><Image src="/icon head.png" alt="Ace" width={28} height={28}/> One day at a time</span></div></section>
 {data.historyGap && <p className={styles.note}>Your saved streak is shown above. Recent practice history doesn&apos;t fully explain this count yet; this page keeps your saved progress unchanged.</p>}
 <div className={styles.stats} aria-label="Monthly streak statistics">{[
  {label:"Days practiced",value:practiced,icon:Flame,tint:"yellow",note:monthName},
  {label:"Current streak",value:data.profile.streak,icon:Flame,tint:"coral",note:"Saved learning streak"},
  {label:"Longest streak",value:data.longest,icon:Trophy,tint:"lavender",note:"Recorded personal best"},
  {label:"Freezes used",value:data.freezes?data.frozenDates.length:"—",icon:Snowflake,tint:"sky",note:data.freezes?monthName:"Not available yet"},
 ].map(({label,value,icon:Icon,tint,note})=><article key={label} className={styles.stat}><span className={styles.statIcon} data-tint={tint}><Icon size={21}/></span><div><strong>{value}</strong><h2>{label}</h2><small>{note}</small></div></article>)}</div>
 <div className={styles.mainGrid}><section className={styles.card}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>STREAK CALENDAR</span><h2>{monthName}</h2></div><nav className={styles.monthNav} aria-label="Calendar month navigation"><Link href={`/streak?month=${shiftMonth(data.month,-1)}`} aria-label="Previous month"><ChevronLeft size={20}/></Link>{data.month<data.today.slice(0,7)?<Link href={`/streak?month=${shiftMonth(data.month,1)}`} aria-label="Next month"><ChevronRight size={20}/></Link>:<button type="button" disabled aria-label="Next month"><ChevronRight size={20}/></button>}</nav></div><StreakCalendar key={data.month} month={data.month} today={data.today} history={data.history} frozenDates={data.frozenDates} detail={data.detail}/>{!practiced && <p className={styles.note}>No practiced days recorded this month. A small lesson is a great place to begin.</p>}<p className={styles.timezone}>Calendar timezone: {data.timezone}.</p><StreakChallenge streak={data.profile.streak}/></section>
 <aside className={styles.sideCards}><section className={`${styles.card} ${styles.freezeCard}`}><span className={styles.featureIcon}><Snowflake size={25}/></span><h2>A little breathing room</h2><p>A Streak Freeze protects one eligible missed day. It keeps your streak going without counting that date as a practiced day.</p>{data.freezes?<><div className={styles.freezeNumbers}><span><strong>{data.freezes.available}</strong> available <small>of {data.freezes.capacity} capacity</small></span><span><strong>{data.frozenDates.length}</strong> used this month</span></div><p>{data.frozenDates.length?"Snowflakes on your calendar show protected days.":"No protected days recorded this month."}</p></>:<p className={styles.unavailable}>Not available yet. Freeze inventory has not been activated for this account.</p>}<small>Freezes never spend your coins or gems automatically.</small></section>
 <section className={`${styles.card} ${styles.goalCard}`}><span className={styles.featureIcon}><Target size={25}/></span><h2>Today&apos;s little win</h2>{data.goal?<><p>{data.goal.completed_activities} / {data.goal.target_activities} activities</p><progress aria-label="Today's daily goal" value={Math.min(data.goal.completed_activities,data.goal.target_activities)} max={data.goal.target_activities}/><p>{data.goal.is_completed?"Daily goal achieved. Nice work!":"A little practice will move you closer."}</p></>:<p>No daily goal has been recorded for today.</p>}<div className={styles.missionPreview}><strong>Daily Learning Quests</strong>{data.missionSummary?<p>{data.missionSummary.completed} completed · {data.missionSummary.total-data.missionSummary.completed} remaining</p>:<p>Open your quest board to see today?s learning challenges.</p>}</div><Link href="/missions" className={styles.primary}>View daily quests</Link></section></aside></div>
 <section className={styles.card}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}><Trophy size={15}/> SMALL WINS, BIG ADVENTURES</span><h2>Your milestone collection</h2></div><span className={styles.badge}>{STREAK_MILESTONES.filter(m=>m.days<=data.longest).length} milestones reached</span></div><div className={styles.milestones}>{STREAK_MILESTONES.map(m=>{
 const earned=data.longest>=m.days,claimed=data.claimedMilestones.includes(m.days),reward=data.milestoneRewards.find(r=>r.days===m.days);
 const claimable=earned && data.rewardsReady && data.rewardLongest>=m.days && !claimed;
 return <article key={m.days} className={`${styles.milestone} ${earned?styles.earned:""}`} aria-label={`${m.days} days, ${m.name}, ${claimed?"claimed":earned?"reached":"locked"}`}><span className={styles.milestoneIcon}>{earned?<Trophy size={26}/>:<Lock size={24}/>}</span><strong>{m.days} days</strong><h3>{m.name}</h3>{reward && <span className={styles.reward}><Coins size={13}/>{reward.coins} {reward.gems>0&&<><Gem size={13}/>{reward.gems}</>}</span>}<span className={styles.milestoneState}>{claimed?"Claimed":earned?"Reached":next?.days===m.days?"Next adventure":"Keep exploring"}</span>{claimable&&<button type="button" className={styles.claimButton} disabled={pending} onClick={()=>claim(m.days)}>{pending?"Claiming…":"Claim reward"}</button>}</article>;
 })}</div>{!data.rewardsReady&&<p className={styles.note}>Milestone badges reflect your recorded progress. Reward claims become available when the streak reward system is activated and your progress is verified.</p>}{message&&<div role="status" className={`${styles.celebration} ${celebrate?styles.celebrating:""}`}><Image src="/icon head.png" width={44} height={44} alt="Ace"/><span>{message}</span></div>}{error&&<p role="alert" className={styles.error}>{error}</p>}</section>
 </>;
}
