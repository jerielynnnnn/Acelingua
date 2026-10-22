import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
function load(file,imports={}) {
 const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const exports={};vm.runInNewContext(compiled,{exports,Date,Intl,URL,console,setTimeout,clearTimeout,require(name){if(name in imports)return imports[name];return require(name);}});return exports;
}
const core=load('lib/streak.ts');
const {loadStreak}=load('lib/streak-data.ts',{'./streak':core});
const today='2026-10-19';
const h=(day)=>({activity_date:day,activities_completed:1,is_active:true});
test('empty, one day, week, yesterday grace, missed day and protected day',()=>{
 assert.equal(core.streakMetrics([],[],today).current,0);
 assert.equal(core.streakMetrics([h(today)],[],today).current,1);
 const week=Array.from({length:7},(_,i)=>h(core.shiftDay(today,-i)));
 assert.equal(core.streakMetrics(week,[],today).current,7);
 assert.equal(core.streakMetrics(week.slice(1),[],today).current,6);
 assert.equal(core.streakMetrics([h('2026-10-17')],[],today).current,0);
 const protectedDay=core.streakMetrics([h('2026-10-17'),h(today)],['2026-10-18'],today);
 assert.equal(protectedDay.current,2);assert.equal(protectedDay.active.length,2);assert.equal(protectedDay.frozen.length,1);
});
test('leap year, Sunday alignment, full weeks and safe month navigation',()=>{
 assert.equal(core.monthCells('2024-02').filter(Boolean).length,29);
 assert.equal(core.monthCells('2026-02').filter(Boolean).length,28);
 assert.equal(core.monthCells('2026-03')[0],'2026-03-01');
 assert.equal(core.monthCells('2026-10')[0],null);
 assert.equal(core.monthCells('2026-10')[4],'2026-10-01');
 assert.equal(core.monthCells('2026-10').length%7,0);
 assert.equal(core.shiftMonth('2026-12',1),'2027-01');
 assert.equal(core.selectedMonth('2099-01',today),'2026-10');
 assert.equal(core.selectedMonth('2026-13',today),'2026-10');
});
test('IANA timezone midnight and DST boundaries use server instants',()=>{
 assert.equal(core.localDate(new Date('2026-10-18T16:00:00Z'),'Asia/Manila'),today);
 assert.equal(core.localDate(new Date('2026-10-18T15:59:59Z'),'Asia/Manila'),'2026-10-18');
 assert.equal(core.nextLocalMidnight(new Date('2026-03-08T05:00:00Z'),'America/New_York'),'2026-03-09T04:00:00.000Z');
 assert.equal(core.nextLocalMidnight(new Date('2026-11-01T04:00:00Z'),'America/New_York'),'2026-11-02T05:00:00.000Z');
});
function database({history=[],failure=null,optionalInstalled=false}={}) {
 const calls=[];
 const tables={profiles:[{id:'owner',streak:history.length,hearts:5,gems:2,coins:10,xp:45}],streak_history:history.map(r=>({...r,user_id:'owner'})),lesson_progress:[{id:'lesson',user_id:'owner',status:'completed',completed_at:'2026-10-19T00:00:00Z'},{id:'someone-else',user_id:'other',status:'completed',completed_at:'2026-10-19T00:00:00Z'}],activity_progress:[],xp_transactions:[{id:'xp',user_id:'owner',amount:45,created_at:'2026-10-19T00:00:00Z'}],daily_goals:[{user_id:'owner',goal_date:today,target_activities:3,completed_activities:1,is_completed:false}]};
 if(optionalInstalled)Object.assign(tables,{user_daily_goal_preferences:[{user_id:'owner',timezone:'Asia/Manila'}],streak_freeze_inventory:[{user_id:'owner',available:1,capacity:2}],streak_freeze_uses:[],learner_streak_state:[{user_id:'owner',longest_streak:7,current_streak:1,legacy_unanchored:false}],streak_milestone_claims:[],streak_milestone_definitions:[{days:3,coins:30,gems:0}],user_learning_days:[{id:'day',user_id:'owner',local_date:today}],user_daily_missions:[{id:'mission',user_id:'owner',day_id:'day',target:1,event_kind:'lesson',cadence:'daily'}],verified_learning_events:[{id:'event',user_id:'owner',day_id:'day',event_kind:'lesson'}]});
 return {calls,from(table){const filters=[],ranges=[],meta={single:false,count:false,head:false};calls.push({table,filters});return {select(_columns,opts){meta.count=opts?.count;meta.head=opts?.head;return this;},eq(k,v){filters.push([k,v]);return this;},gte(k,v){ranges.push([k,'gte',v]);return this;},lt(k,v){ranges.push([k,'lt',v]);return this;},order(){return this;},range(a,b){meta.range=[a,b];return this;},maybeSingle(){meta.single=true;return this;},then(resolve,reject){return Promise.resolve().then(()=>{
 if(table===failure)return {data:null,error:{code:'42501',message:'permission denied'}};
 if(!(table in tables))return {data:null,error:{code:'42P01',message:'table not installed'}};
 let rows=tables[table].filter(r=>filters.every(([k,v])=>r[k]===v)&&ranges.every(([k,op,v])=>op==='gte'?r[k]>=v:r[k]<v));
 const count=rows.length;if(meta.range)rows=rows.slice(meta.range[0],meta.range[1]+1);
 return {data:meta.head?null:meta.single?rows[0]??null:rows,error:null,count:meta.count?count:null};
 }).then(resolve,reject);}};}};
}
test('existing schema loads real owned history and reports optional features unavailable',async()=>{
 const db=database({history:[h(today)]});const data=await loadStreak(db,'owner',undefined,new Date('2026-10-19T01:00:00Z'));
 assert.equal(data.profile.streak,1);assert.equal(data.freezes,null);assert.equal(data.rewardsReady,false);assert.equal(data.missionSummary,null);
 assert.equal(data.detail[today].lessons,1);assert.equal(data.detail[today].xp,45);
 assert.ok(db.calls.filter(c=>!c.table.endsWith('_definitions')).every(c=>c.filters.some(([k,v])=>(k==='user_id'||k==='id')&&v==='owner')));
});
test('activated features share persisted counts rather than creating another reward system',async()=>{
 const data=await loadStreak(database({history:[h(today)],optionalInstalled:true}),'owner',undefined,new Date('2026-10-19T01:00:00Z'));
 assert.equal(data.freezes.available,1);assert.equal(data.longest,7);assert.equal(data.missionSummary.completed,1);assert.equal(data.rewardsReady,true);
});
test('required and optional permission failures fail visibly instead of becoming empty progress',async()=>{
 await assert.rejects(loadStreak(database({failure:'streak_history'}),'owner',undefined,new Date()),/Practice history unavailable/);
 await assert.rejects(loadStreak(database({failure:'streak_freeze_inventory'}),'owner',undefined,new Date()),/Freeze inventory/);
});
test('pagination retains a history longer than Supabase default row cap',async()=>{
 const rows=Array.from({length:1100},(_,i)=>h(core.shiftDay('2023-01-01',i)));
 const data=await loadStreak(database({history:rows}),'owner',undefined,new Date('2026-10-19T01:00:00Z'));
 assert.ok(data.longest>=1100);
});
test('calendar renders all dates, keyboard buttons, real activity details and disabled future days',()=>{
 const css=new Proxy({},{get:(_,key)=>String(key)});
 const {default:Calendar}=load('components/streak/StreakCalendar.tsx',{'@/lib/streak':core,'./StreakSociety.module.css':css});
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const html=renderToStaticMarkup(React.createElement(Calendar,{month:'2026-10',today,history:[h(today)],frozenDates:['2026-10-18'],detail:{[today]:{lessons:1,activities:2,xp:45,goal:true}}}));
 assert.match(html,/Practice calendar/);assert.match(html,/protected by a Streak Freeze/);assert.match(html,/45 XP recorded/);assert.match(html,/aria-current="date"/);assert.match(html,/disabled=""/);
});

test('Streak Society server render uses loaded data and no invented freeze inventory',async()=>{
 const db=database({history:[h(today)]});
 const data=await loadStreak(db,'owner',undefined,new Date('2026-10-19T01:00:00Z'));
 const css={__esModule:true,default:new Proxy({},{get:(_,key)=>String(key)})};
 const {default:Calendar}=load('components/streak/StreakCalendar.tsx',{'@/lib/streak':core,'./StreakSociety.module.css':css});
 const {default:Challenge}=load('components/streak/StreakChallenge.tsx',{'@/lib/streak':core,'./StreakShortcut.module.css':css});
 const {default:Society}=load('components/streak/StreakSociety.tsx',{
  './StreakChallenge':{default:Challenge,__esModule:true},
  '@/lib/streak':core,'./StreakSociety.module.css':css,'./StreakCalendar':{default:Calendar,__esModule:true},
  './StreakDateRefresh':{default:()=>null,__esModule:true},'next/navigation':{useRouter:()=>({refresh(){}})},
  '@/app/streak/actions':{claimStreakMilestone:async()=>{throw Error('Render must not claim');}},
 });
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const html=renderToStaticMarkup(React.createElement(Society,{data}));
 assert.match(html,/Streak Society/);assert.match(html,/October 2026/);assert.match(html,/Days practiced/);assert.match(html,/Not available yet/);assert.ok(html.includes('1 / 3 activities'));
 assert.ok(!html.includes('Claim reward'));assert.match(html,/aria-label="Previous month"/);
 assert.match(html,/3-day challenge/);assert.match(html,/aria-label="3-day streak challenge"/);
});

const {loadDailyGoal}=load('lib/daily-goal.ts',{'./streak':core});
test('dashboard daily goal uses server-local day and existing persistent goal',async()=>{
 const db=database();const data=await loadDailyGoal(db,'owner',new Date('2026-10-18T16:00:00Z'));
 assert.equal(data.today,today);assert.equal(data.goal.completed_activities,1);assert.equal(data.settingsAvailable,false);
 assert.equal(data.resetsAt,'2026-10-19T16:00:00.000Z');
 assert.ok(db.calls.every(c=>c.filters.some(([k,v])=>k==='user_id'&&v==='owner')));
});
test('dashboard goals distinguish missing feature tables from database failures',async()=>{
 await assert.rejects(loadDailyGoal(database({failure:'daily_goals'}),'owner'),/permission denied/);
 const data=await loadDailyGoal(database({optionalInstalled:true}),'owner',new Date('2026-10-19T00:00:00Z'));
 assert.equal(data.settingsAvailable,false);
});
test('daily goal endpoint rejects logged out reads and cross-site or invalid writes',async()=>{
 const db=database();db.auth={getUser:async()=>({data:{user:null},error:null})};
 const routes=load('app/api/daily-goal/route.ts',{'@/lib/supabase/server':{createClient:async()=>db},'@/lib/daily-goal':{loadDailyGoal},'next/server':{NextResponse:{json:(body,options)=>({body,...options})}}});
 assert.equal((await routes.GET()).status,401);
 assert.equal((await routes.POST({url:'http://localhost:3000/api/daily-goal',headers:{get:()=> 'https://other.example'}})).status,405);
 assert.equal((await routes.POST({url:'http://localhost:3000/api/daily-goal',headers:{get:()=> 'http://localhost:3000'},json:async()=>({target:999})})).status,405);
});
