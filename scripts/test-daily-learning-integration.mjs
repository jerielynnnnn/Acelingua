import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PGlite} from '../.tmp-country-sql/node_modules/@electric-sql/pglite/dist/index.js';
const audit=JSON.parse(fs.readFileSync(new URL('../supabase/daily-learning-audit.json',import.meta.url),'utf8'));
const db=new PGlite();
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
 await db.exec(fs.readFileSync(new URL('../supabase/proposals/202610190003_daily_learning_complete.sql',import.meta.url),'utf8'));
 await db.exec(`insert into auth.users values('${user}'); insert into profiles(id,username,coins) values('${user}','learner',100);
 insert into courses values('${course}');insert into units values('${unit}','${course}',true);`);
 for(let n=20;n<24;n++)await db.exec(`insert into lessons values('${id(n)}','${unit}','Lesson ${n}',10,5,true);
 insert into vocabulary(lesson_id,word) values('${id(n)}','word');insert into lesson_progress(user_id,lesson_id,status,attempts) values('${user}','${id(n)}','in_progress',1);`);
 await db.exec(`select set_config('test.uid','${user}',false);set role authenticated;`);
 let snap=(await query('select acelingua_daily_learning_snapshot() s'))[0].s;
 assert.equal(snap.missions.length,2);assert.equal(snap.profile.coins,100);assert.equal(snap.profile.streak,0);
 await assert.rejects(db.exec('select acelingua_claim_daily_reward()'),/Complete all/);
 await assert.rejects(db.exec(`update profiles set coins=9999 where id='${user}'`),/permission denied/);
 await assert.rejects(db.exec(`update profiles set role='admin' where id='${user}'`),/permission denied/);
 await db.exec(`update profiles set display_name='Learner' where id='${user}'`);
 await assert.rejects(db.exec(`select acelingua_daily_day('${user}',now())`),/permission denied/);
 for(let n=20;n<23;n++) await db.exec(`select acelingua_complete_assessed_lesson('${id(n)}','[]'::jsonb,array[]::uuid[])`);
 snap=(await query('select acelingua_daily_learning_snapshot() s'))[0].s;
 assert.equal(snap.profile.streak,1);assert.equal(snap.goal.completed_activities,3);assert.equal(snap.goal.is_completed,true);
 assert.deepEqual(snap.missions.map(m=>m.progress).sort(),[1,3]);
 const first=snap.missions.find(m=>m.definition_id==='first-steps');
 let grant=(await query('select acelingua_claim_daily_reward($1) s',[first.id]))[0].s;assert.equal(grant.coins,15);
 grant=(await query('select acelingua_claim_daily_reward($1) s',[first.id]))[0].s;assert.equal(grant.coins,0);assert.equal(grant.already_claimed,true);
 const champion=snap.missions.find(m=>m.definition_id==='daily-champion');
 await query('select acelingua_claim_daily_reward($1)',[champion.id]);await query('select acelingua_claim_daily_reward()');
 snap=(await query('select acelingua_daily_learning_snapshot() s'))[0].s;
 assert.equal(snap.profile.coins,210);assert.equal(snap.profile.gems,4);
 await db.exec(`select acelingua_complete_assessed_lesson('${id(20)}','[]'::jsonb,array[]::uuid[])`);
 snap=(await query('select acelingua_daily_learning_snapshot() s'))[0].s;assert.equal(snap.goal.completed_activities,3);assert.equal(snap.profile.coins,210);
 await db.exec('reset role');assert.equal((await query('select n from passport_test_calls'))[0].n,3);
 // Exercise internal server-time helpers under administrator role, never through a public time parameter.
 const today=snap.today;
 await query('select acelingua_sync_learning_streak($1,$2::date+1,true,$3)',[user,today,'Asia/Manila']);
 await query('select acelingua_sync_learning_streak($1,$2::date+1,true,$3)',[user,today,'Asia/Manila']);
 assert.equal((await query('select streak from profiles where id=$1',[user]))[0].streak,2);
 await query("select acelingua_grant_streak_freeze($1,'test-grant',2)",[user]);
 await query("select acelingua_grant_streak_freeze($1,'test-grant',2)",[user]);
 await query('select acelingua_sync_learning_streak($1,$2::date+3,true,$3)',[user,today,'Asia/Manila']);
 assert.equal((await query('select streak from profiles where id=$1',[user]))[0].streak,3);
 assert.equal((await query('select available from streak_freeze_inventory where user_id=$1',[user]))[0].available,1);
 await db.exec('set role authenticated');
 grant=(await query('select acelingua_claim_streak_milestone(3) s'))[0].s;assert.equal(grant.coins,30);
 assert.equal((await query('select acelingua_claim_streak_milestone(3) s'))[0].s.already_claimed,true);
 await db.exec('reset role');

 // A failed ledger write must roll back the receipt and both profile currencies.
 await query('update learner_streak_state set longest_streak=7 where user_id=$1',[user]);
 await db.exec("create function test_ledger_failure() returns trigger language plpgsql as $$begin raise exception 'ledger unavailable';end;$$;create trigger test_gem_fail before insert on gem_transactions for each row execute function test_ledger_failure();set role authenticated");
 const before=(await query('select coins,gems from profiles where id=$1',[user]))[0];
 await assert.rejects(db.exec('select acelingua_claim_streak_milestone(7)'),/ledger unavailable/);
 assert.deepEqual((await query('select coins,gems from profiles where id=$1',[user]))[0],before);
 await db.exec('reset role');
 assert.equal((await query('select count(*)::int n from streak_milestone_claims where days=7'))[0].n,0);
 await db.exec('drop trigger test_gem_fail on gem_transactions');
 // Existing paid achievements reduce equivalent milestone payouts rather than duplicating coins.
 await db.exec("insert into achievements(id,name,requirement_type,requirement_value,coin_reward) values('"+id(60)+"','Week','streak',7,50);insert into coin_transactions(user_id,amount,transaction_type,source_id) values('"+user+"',50,'achievement','"+id(60)+"');set role authenticated");
 assert.equal((await query('select acelingua_claim_streak_milestone(7) s'))[0].s.coins,25);
 await db.exec('reset role');
 await query('select acelingua_sync_learning_streak($1,$2::date+7,false,$3)',[user,today,'Asia/Manila']);
 assert.equal((await query('select streak from profiles where id=$1',[user]))[0].streak,0);
 assert.equal((await query('select available from streak_freeze_inventory where user_id=$1',[user]))[0].available,1);
 assert.equal((await query("select extract(epoch from (('2026-03-09'::date::timestamp at time zone 'America/New_York')-('2026-03-08'::date::timestamp at time zone 'America/New_York')))::int span"))[0].span,82800);
 assert.equal((await query("select extract(epoch from (('2026-11-02'::date::timestamp at time zone 'America/New_York')-('2026-11-01'::date::timestamp at time zone 'America/New_York')))::int span"))[0].span,90000);
 // Legacy rows and balance carry-over survive initial synchronization and the next qualifying day.
 const returning=id(80);
 await db.exec("insert into auth.users values('"+returning+"');insert into profiles(id,username,streak,coins) values('"+returning+"','returning',5,456)");
 await query("insert into streak_history(user_id,activity_date,activities_completed,is_active) values($1,$2::date-1,1,true)",[returning,today]);
 await query('select acelingua_sync_learning_streak($1,$2::date,false,$3)',[returning,today,'Asia/Manila']);
 await query('select acelingua_sync_learning_streak($1,$2::date,true,$3)',[returning,today,'Asia/Manila']);
 assert.equal((await query('select streak from profiles where id=$1',[returning]))[0].streak,6);
 assert.equal((await query('select coins from profiles where id=$1',[returning]))[0].coins,456);
 assert.equal((await query('select count(*)::int n from streak_history where user_id=$1',[returning]))[0].n,1);

 // Preferences apply to a future window; they do not rewrite today's or historical goals.
 await db.exec("select set_config('test.uid','"+returning+"',false);set role authenticated");
 const oldDay=(await query('select acelingua_daily_learning_snapshot() s'))[0].s;
 await db.exec("select acelingua_set_daily_preferences(8,'America/New_York')");
 assert.equal((await query('select acelingua_daily_learning_snapshot() s'))[0].s.goal.target_activities,3);
 await db.exec('reset role');
 const nextDay=(await query("select (acelingua_daily_day($1,$2::timestamptz+interval '12 hours')).*",[returning,oldDay.resets_at]))[0];
 assert.equal(nextDay.goal_target,8);assert.equal(nextDay.timezone,'America/New_York');
 await assert.rejects(query("select acelingua_set_daily_preferences(1,'Asia/Manila')"),/seven days/);
 console.log('PASS complete draft: audited schema integration, real assessed RPC, goal/streak tracking, replay protection, atomic claims/ledgers, bonus, milestone/grant idempotency, freeze consumption, profile column restrictions, internal RPC denial, and preserved passport trigger.');
} catch(error) { console.error(error.message, error.where ?? "", error.query ?? ""); process.exitCode=1; } finally {await db.close();}
