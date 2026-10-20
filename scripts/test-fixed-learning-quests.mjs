import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '../.tmp-country-sql/node_modules/@electric-sql/pglite/dist/index.js';
const audit=JSON.parse(fs.readFileSync(new URL('../supabase/daily-learning-audit.json',import.meta.url),'utf8'));
const db=new PGlite();
const fresh=process.argv.includes("--fresh");
const id=n=>'00000000-0000-0000-0000-'+String(n).padStart(12,'0');
const user=id(1), course=id(10), unit=id(11);
const query=async(sql,params=[]) => (await db.query(sql,params)).rows;
try {
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
 create table courses(id uuid primary key);create table units(id uuid primary key,course_id uuid references courses,is_published boolean);
 create table lessons(id uuid primary key,unit_id uuid references units,title text,xp_reward int,coin_reward int,is_published boolean);
 create table vocabulary(id uuid primary key default gen_random_uuid(),lesson_id uuid references lessons,word text);
 create table activities(id uuid primary key,lesson_id uuid references lessons,activity_type text,activity_order int);
 create table questions(id uuid primary key,activity_id uuid references activities,question_type text,correct_answer text,options jsonb,question_order int);
 create table course_progress(user_id uuid,course_id uuid,completed_lessons int,total_lessons int,progress_percentage numeric,last_accessed_at timestamptz,updated_at timestamptz,unique(user_id,course_id));`);
 for(const name of [...new Set(audit.columns.map(c=>c.table_name))]) {
  const cols=audit.columns.filter(c=>c.table_name===name).map(c=>'"'+c.column_name+'" '+(c.data_type==='ARRAY'?c.udt_name.slice(1)+'[]':c.udt_name)+(c.column_default?' default '+c.column_default:'')+(c.is_nullable==='NO'?' not null':''));
  await db.exec('create table public.'+name+'('+cols.join(',')+')');
 }
 for(const c of audit.constraints) await db.exec('alter table public.'+c.table_name+' add constraint '+c.conname+' '+c.definition);
 for(const idx of audit.indexes.filter(i=>i.indexdef.includes('UNIQUE')&&!i.indexname.endsWith('_pkey'))) {
  if(!(await query('select 1 from pg_indexes where indexname=$1',[idx.indexname])).length)await db.exec(idx.indexdef);
 }
 for(const p of audit.policies)await db.exec('alter table public.'+p.tablename+' enable row level security;create policy "'+p.policyname+'" on public.'+p.tablename+' for '+p.cmd+' to '+p.roles.join(',')+(p.qual?' using('+p.qual+')':'')+(p.with_check?' with check('+p.with_check+')':''));
 await db.exec(`create function public.acelingua_lesson_course(p_lesson_id uuid) returns uuid language plpgsql security definer as $$begin
 if auth.uid() is null then raise exception 'Sign in';end if;return '${course}'::uuid;end;$$;
 create function public.acelingua_normalize_answer(answer text) returns text language sql immutable as $$select lower(btrim(answer))$$;
 create table passport_test_calls(n int);insert into passport_test_calls values(0);
 create function passport_test_hook() returns trigger language plpgsql as $$begin update public.passport_test_calls set n=n+1;return new;end;$$;
 create trigger travel_destination_reward after update of status on lesson_progress for each row execute function passport_test_hook();`);
 await db.exec(audit.functions.find(f=>f.proname==='acelingua_complete_assessed_lesson').definition);
 await db.exec('revoke all on function public.acelingua_complete_assessed_lesson(uuid,jsonb,uuid[]) from public;grant execute on function public.acelingua_complete_assessed_lesson(uuid,jsonb,uuid[]) to authenticated');
 if(fresh){await db.exec(fs.readFileSync(new URL("../supabase/proposals/202610200002_fixed_learning_quests_fresh.sql",import.meta.url),"utf8"));}
 else {
 await db.exec(fs.readFileSync(new URL('../supabase/proposals/202610190003_daily_learning_complete.sql',import.meta.url),'utf8'));

 const legacy=id(88);
 await db.exec("insert into auth.users values('"+legacy+"');insert into profiles(id,username,coins,xp) values('"+legacy+"','legacy',115,42)");
 const legacyDay=(await query("select (acelingua_daily_day($1,'2026-10-18T01:00Z')).*",[legacy]))[0];
 const legacyMission=(await query("select * from user_daily_missions where user_id=$1 order by definition_id limit 1",[legacy]))[0];
 await query("insert into daily_reward_claims(user_id,day_id,mission_id,claim_kind,coins,gems) values($1,$2,$3,'mission',$4,$5)",[legacy,legacyDay.id,legacyMission.id,legacyMission.reward_coins,legacyMission.reward_gems]);
 await db.exec(fs.readFileSync(new URL('../supabase/proposals/202610200001_fixed_learning_quests.sql',import.meta.url),'utf8'));

 assert.equal((await query('select coins from profiles where id=$1',[legacy]))[0].coins,115);
 assert.equal((await query('select xp from profiles where id=$1',[legacy]))[0].xp,42);
 assert.equal((await query('select count(*)::int n from daily_reward_claims where user_id=$1',[legacy]))[0].n,1);
 assert.equal((await query('select reward_coins from user_daily_missions where id=$1',[legacyMission.id]))[0].reward_coins,legacyMission.reward_coins);
 assert.equal((await query('select reward_xp from user_daily_missions where id=$1',[legacyMission.id]))[0].reward_xp,0);
 }
 await db.exec(`insert into auth.users values('${user}');insert into profiles(id,username,coins,xp) values('${user}','learner',100,10);
 insert into courses values('${course}');insert into units values('${unit}','${course}',true);`);
 for(let n=20;n<23;n++){
  await db.exec(`insert into lessons values('${id(n)}','${unit}','Lesson ${n}',10,5,true);
  insert into lesson_progress(user_id,lesson_id,status,attempts) values('${user}','${id(n)}','in_progress',1);
  insert into activities values('${id(n+100)}','${id(n)}','vocabulary',1);`);
  for(let q=0;q<10;q++)await db.exec(`insert into questions values('${id(n*100+q)}','${id(n+100)}','multiple_choice','yes','["yes","no"]',${q+1})`);
 }
 await db.exec(`select set_config('test.uid','${user}',false);set role authenticated;`);
 let snap=(await query('select acelingua_fixed_quests_snapshot() s'))[0].s;
 assert.equal(snap.quests.filter(q=>q.cadence==='daily').length,6);
 assert.equal(snap.quests.filter(q=>q.cadence==='weekly').length,2);
 assert.equal(snap.chest.xp,100);assert.equal(snap.chest.coins,75);
 assert.equal(snap.profile.xp,10);assert.equal(snap.profile.coins,100);
 await assert.rejects(db.exec("select acelingua_set_daily_preferences(8,'Asia/Manila')"),/permission denied/);
 await assert.rejects(db.exec("update daily_mission_definitions set reward_xp=9999"),/permission denied/);
 await assert.rejects(db.exec('select acelingua_claim_daily_reward()'),/all six/);
 const answers=(n,correct)=>Array.from({length:10},(_,q)=>({question_id:id(n*100+q),answer:q<correct?'yes':'no'}));
 // 8/10 must not produce a 90% event.
 await query('select acelingua_complete_assessed_lesson($1,$2::jsonb,array[]::uuid[])',[id(20),JSON.stringify(answers(20,8))]);
 snap=(await query('select acelingua_fixed_quests_snapshot() s'))[0].s;
 assert.equal(snap.quests.find(q=>q.definition_id==='perfect-practice-v2').progress,0);
 // Exact threshold 9/10 does qualify; the third lesson completes the lesson-count quests.
 await query('select acelingua_complete_assessed_lesson($1,$2::jsonb,array[]::uuid[])',[id(21),JSON.stringify(answers(21,9))]);
 await query('select acelingua_complete_assessed_lesson($1,$2::jsonb,array[]::uuid[])',[id(22),JSON.stringify(answers(22,10))]);
 snap=(await query('select acelingua_fixed_quests_snapshot() s'))[0].s;
 assert.ok(snap.quests.filter(q=>q.cadence==='daily').every(q=>q.progress>=q.target));
 assert.equal(snap.profile.xp,40); // Ordinary lesson XP only, no automatic quest award.
 assert.equal(snap.profile.coins,115);assert.equal(snap.chest.claimed_count,0);
 await assert.rejects(db.exec('select acelingua_claim_daily_reward()'),/all six/);
 const daily=snap.quests.filter(q=>q.cadence==='daily');
 const beforeStreak=(await query('select streak from profiles where id=$1',[user]))[0].streak;
 for(const quest of daily){const granted=(await query('select acelingua_claim_daily_reward($1) s',[quest.id]))[0].s;assert.equal(granted.xp,quest.reward_xp);}
 assert.equal((await query('select acelingua_claim_daily_reward($1) s',[daily[0].id]))[0].s.already_claimed,true);

 const beforeChest=(await query('select xp,coins,gems from profiles where id=$1',[user]))[0];
 await db.exec("reset role;create function test_quest_ledger_failure() returns trigger language plpgsql as $$begin if new.source_type='daily_bonus' then raise exception 'quest ledger unavailable';end if;return new;end;$$;create trigger test_quest_xp_fail before insert on xp_transactions for each row execute function test_quest_ledger_failure();set role authenticated");
 await assert.rejects(db.exec('select acelingua_claim_daily_reward()'),/quest ledger unavailable/);
 assert.deepEqual((await query('select xp,coins,gems from profiles where id=$1',[user]))[0],beforeChest);
 await db.exec('reset role;drop trigger test_quest_xp_fail on xp_transactions;set role authenticated');
 const chest=(await query('select acelingua_claim_daily_reward() s'))[0].s;
 assert.equal(chest.xp,100);assert.equal(chest.coins,75);assert.equal(chest.gems,3);
 assert.equal((await query('select acelingua_claim_daily_reward() s'))[0].s.already_claimed,true);
 snap=(await query('select acelingua_fixed_quests_snapshot() s'))[0].s;
 assert.equal(snap.profile.xp,280);assert.equal(snap.profile.coins,295);assert.equal(snap.profile.gems,4);
 assert.equal((await query('select streak from profiles where id=$1',[user]))[0].streak,beforeStreak);
 await query('select acelingua_complete_assessed_lesson($1,$2::jsonb,array[]::uuid[])',[id(22),JSON.stringify(answers(22,10))]);
 assert.equal((await query('select acelingua_fixed_quests_snapshot() s'))[0].s.profile.xp,280);
 await db.exec('reset role');
 assert.equal((await query("select count(*)::int n from xp_transactions where source_type in ('daily_mission','daily_bonus')"))[0].n,7);
 const day=(await query('select * from user_learning_days where user_id=$1 order by starts_at desc limit 1',[user]))[0];
 const later=(await query("select (acelingua_daily_day($1,$2::timestamptz+interval '1 hour')).*",[user,day.resets_at]))[0];
 const nextQuests=await query("select * from user_daily_missions where user_id=$1 and day_id=$2 and cadence='daily'",[user,later.id]);
 assert.equal(nextQuests.length,6);
 assert.equal((await query("select count(*)::int n from user_daily_missions where user_id=$1 and cadence='weekly'",[user]))[0].n,2);
 assert.equal((await query('select acelingua_mission_progress($1) n',[nextQuests[0].id]))[0].n??0,0);

 const nextWeek=(await query("select (acelingua_daily_day($1,(date_trunc('week',$2::date::timestamp)+interval '7 days 12 hours') at time zone 'Asia/Manila')).*",[user,later.local_date]))[0];
 const newWeekly=await query("select * from user_daily_missions where user_id=$1 and cadence='weekly' and period_start=$2::date-date_part('isodow',$2::date)::integer+1",[user,nextWeek.local_date]);
 assert.equal(newWeekly.length,2);
 assert.equal((await query('select acelingua_mission_progress($1) n',[newWeekly[0].id]))[0].n??0,0);
 // Snapshot contracts include a server-derived weekly deadline.
 assert.ok(Date.parse(snap.weekly_resets_at)>Date.parse(snap.server_now));
 console.log('PASS fixed quests: six immutable daily quests, weekly snapshots, exact 90% grading, distinct correct-answer events, claim-required chest, XP/coin/gem ledgers, replay and duplicate protection, next-day reset, fixed-target permissions, and streak independence.');
} catch(error){console.error(error.message,error.where??'');process.exitCode=1;} finally{await db.close();}
