"use client";
import {useState} from "react";
import {Flame,Snowflake} from "lucide-react";
import {monthCells,shiftDay,type HistoryDay} from "@/lib/streak";
import type {DayDetail} from "@/lib/streak-data";
import styles from "./StreakSociety.module.css";

type Props={month:string;today:string;history:HistoryDay[];frozenDates:string[];detail:Record<string,DayDetail>};
export default function StreakCalendar({month,today,history,frozenDates,detail}:Props){
 const [selected,setSelected]=useState<string|null>(today.startsWith(month)?today:null);
 const active=new Set(history.filter(h=>h.is_active&&h.activity_date<=today).map(h=>h.activity_date));
 const frozen=new Set(frozenDates.filter(d=>d<=today&&!active.has(d)));
 const dateLabel=(date:string)=>new Intl.DateTimeFormat("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(date+"T12:00:00Z"));
 const current=selected?detail[selected]:null;
 return <><div className={styles.calendar} role="group" aria-label="Practice calendar"><div className={styles.weekdays}>{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day=><span key={day}><abbr title={day}>{day.slice(0,2)}</abbr></span>)}</div><div className={styles.calendarDays}>{monthCells(month).map((date,i)=>date?<button type="button" key={date} disabled={date>today} onClick={()=>setSelected(date)} aria-pressed={selected===date} aria-current={date===today?"date":undefined} aria-controls="streak-day-details" aria-label={`${dateLabel(date)}${active.has(date)?", practiced":frozen.has(date)?", protected by a Streak Freeze":date>today?", future date":", no recorded practice"}${date===today?", today":""}`} data-active={active.has(date)||undefined} data-frozen={frozen.has(date)||undefined} data-join-left={active.has(date)&&active.has(shiftDay(date,-1))&&i%7!==0||undefined} data-join-right={active.has(date)&&active.has(shiftDay(date,1))&&i%7!==6||undefined} className={styles.calendarDay}><span>{Number(date.slice(-2))}</span>{active.has(date)?<Flame size={17} aria-hidden="true"/>:frozen.has(date)?<Snowflake size={17} aria-hidden="true"/>:<span className={styles.dayDot} aria-hidden="true"/>}</button>:<span key={`blank-${i}`} aria-hidden="true"/>)}</div></div>
 <div id="streak-day-details" className={styles.dayDetails} aria-live="polite" aria-atomic="true">{selected?<><h3>{dateLabel(selected)}</h3>{frozen.has(selected)?<p><Snowflake size={16}/> Protected by a Streak Freeze. This was not a practiced day.</p>:active.has(selected)?<p><Flame size={16}/> Practice recorded for this day.</p>:<p>No practiced day is recorded.</p>}{current?<ul><li>{current.lessons} lessons first completed</li><li>{current.activities} activities with saved completion</li><li>{current.xp} XP recorded</li>{current.goal!==null&&<li>{current.goal?"Daily goal achieved":"Daily goal not yet achieved"}</li>}</ul>:<p className={styles.note}>No detailed completion records are available for this date.</p>}</>:<p>Select a date to explore your learning history.</p>}</div></>;
}
