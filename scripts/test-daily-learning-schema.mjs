import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "../.tmp-country-sql/node_modules/@electric-sql/pglite/dist/index.js";
const db = new PGlite();
const uid = "00000000-0000-0000-0000-000000000001";
const other = "00000000-0000-0000-0000-000000000002";
const day = "00000000-0000-0000-0000-000000000003";
const lesson = "00000000-0000-0000-0000-000000000004";
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    create table public.lessons(id uuid primary key); create table public.activities(id uuid primary key);
    insert into auth.users values ('${uid}'),('${other}'); insert into lessons values('${lesson}');`);
  const sql = fs.readFileSync(new URL("../supabase/proposals/202610190002_daily_learning.sql",import.meta.url),"utf8");
  await db.exec(sql);
  assert.equal((await db.query('select count(*)::int as n from daily_mission_definitions where is_enabled')).rows[0].n,2);
  assert.equal((await db.query('select count(*)::int as n from streak_milestone_definitions')).rows[0].n,7);
  await assert.rejects(db.exec(`insert into user_daily_goal_preferences(user_id,timezone) values('${uid}','Invalid/Timezone')`),/IANA/);
  await db.exec(`insert into user_daily_goal_preferences(user_id) values('${uid}');
    insert into user_learning_days(id,user_id,local_date,timezone,starts_at,resets_at,goal_target)
    values('${day}','${uid}','2026-10-19','Asia/Manila','2026-10-18T16:00Z','2026-10-19T16:00Z',3);
    insert into verified_learning_events(user_id,day_id,lesson_id,event_kind,source_id)
    values('${uid}','${day}','${lesson}','lesson','${lesson}');`);
  await assert.rejects(db.exec(`insert into verified_learning_events(user_id,day_id,lesson_id,event_kind,source_id) values('${uid}','${day}','${lesson}','lesson','${lesson}')`),/unique/);
  await assert.rejects(db.exec(`insert into verified_learning_events(user_id,day_id,lesson_id,event_kind,source_id) values('${other}','${day}','${lesson}','lesson','${lesson}')`),/foreign key/);
  await db.exec(`insert into daily_reward_claims(user_id,day_id,claim_kind,coins,gems) values('${uid}','${day}','bonus',50,3)`);
  await assert.rejects(db.exec(`insert into daily_reward_claims(user_id,day_id,claim_kind,coins,gems) values('${uid}','${day}','bonus',50,3)`),/unique/);
  await db.exec(`insert into streak_milestone_claims(user_id,days,coins,gems) values('${uid}',3,30,0)`);
  await assert.rejects(db.exec(`insert into streak_milestone_claims(user_id,days,coins,gems) values('${uid}',3,30,0)`),/unique/);
  await assert.rejects(db.exec(`insert into streak_freeze_inventory(user_id,available) values('${uid}',3)`),/check constraint/);
  await db.exec(`set role authenticated; select set_config('test.uid','${other}',false);`);
  assert.equal((await db.query('select count(*)::int as n from verified_learning_events')).rows[0].n,0);
  await assert.rejects(db.exec(`insert into streak_freeze_inventory(user_id,available) values('${other}',2)`),/permission denied/);
  await db.exec('reset role');
  console.log('PASS draft schema: IANA validation, disabled unverified missions, event deduplication, ownership FKs, bonus/milestone uniqueness, freeze cap, RLS isolation and write denial.');
} finally { await db.close(); }
