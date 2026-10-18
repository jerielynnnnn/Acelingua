// Optional isolated PostgreSQL regression check, with no Supabase connection.
// Install the test engine separately (no root package/dependency changes):
// npm.cmd install --prefix .tmp-country-sql --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "../.tmp-country-sql/node_modules/@electric-sql/pglite/dist/index.js";

const seed = fs.readFileSync(new URL("../supabase/migrations/202610180008_japan_adventure.sql", import.meta.url), "utf8");
const schema = `
create table languages(id uuid primary key,code text unique,is_active boolean);
create table courses(id uuid primary key,language_id uuid references languages,title text,is_published boolean);
create table units(id uuid primary key,course_id uuid references courses,title text,description text,unit_order integer,location_name text,is_published boolean,unique(course_id,unit_order));
create table lessons(id uuid primary key,unit_id uuid references units,title text,description text,lesson_order integer,xp_reward integer,coin_reward integer,is_published boolean,unique(unit_id,lesson_order));
create table vocabulary(id uuid primary key,lesson_id uuid references lessons,word text not null,translation text not null,pronunciation text);
create table activities(id uuid primary key,lesson_id uuid references lessons,title text,instructions text,activity_type text,activity_order integer,unique(lesson_id,activity_order));
create table questions(id uuid primary key,activity_id uuid references activities,question_text text,question_type text,correct_answer text,options jsonb,explanation text,question_order integer,unique(activity_id,question_order));
create table travel_countries(id uuid primary key,code text unique,is_active boolean);
create table travel_country_languages(country_id uuid references travel_countries,language_id uuid references languages,primary key(country_id,language_id));
create table travel_country_units(country_id uuid references travel_countries,unit_id uuid references units,is_required boolean,primary key(country_id,unit_id));
create table travel_unit_curriculum(unit_id uuid primary key references units,slug text,cultural_introduction text,learning_objectives jsonb,challenge_lesson_id uuid references lessons,writing_recommendation text,estimated_minutes integer);
create table passport_stamp_definitions(id uuid primary key,country_id uuid references travel_countries,unit_id uuid,slug text,name text,description text,requirement_type text,unique(country_id,slug),foreign key(country_id,unit_id) references travel_country_units);
create table lesson_progress(lesson_id uuid primary key references lessons,status text);
insert into languages values('00000000-0000-0000-0000-000000000001','ja',true);
insert into courses values('c293f603-993b-4332-8dd8-afc0fd50ae04','00000000-0000-0000-0000-000000000001','Japanese Beginner',true);
insert into travel_countries values('00000000-0000-0000-0000-000000000002','jp',true);
insert into travel_country_languages values('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001');
`;
async function snapshot(db) {
  return (await db.query(`select
    (select count(*)::integer from units) as units,
    (select count(*)::integer from lessons) as lessons,
    (select count(*)::integer from vocabulary) as vocabulary,
    (select count(*)::integer from questions) as questions,
    (select count(*)::integer from travel_unit_curriculum) as destinations,
    (select count(*)::integer from passport_stamp_definitions) as stamps`)).rows[0];
}
for (const drafts of [false, true]) {
  const db = new PGlite();
  try {
    await db.exec(schema);
    if (drafts) await db.exec(`
      insert into units values('10000000-0000-0000-0000-000000000001','c293f603-993b-4332-8dd8-afc0fd50ae04','Greetings & Introductions','Original description',1,null,true);
      insert into lessons values('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Unit Review','Existing unpublished review',6,10,2,false);
      insert into lesson_progress values('20000000-0000-0000-0000-000000000001','completed');
    `);
    await db.exec(seed);
    const first = await snapshot(db);
    assert.equal(first.destinations, 8);
    assert.equal(first.stamps, 9);
    assert.equal(first.lessons, drafts ? 41 : 40);
    const invalid = await db.query("select id from questions where not options @> jsonb_build_array(correct_answer)");
    assert.equal(invalid.rows.length, 0, "Every quiz must include its correct answer");
    if (drafts) {
      const retained = (await db.query("select l.is_published,l.description,p.status from lessons l join lesson_progress p on p.lesson_id=l.id")).rows;
      assert.deepEqual(retained, [{ is_published: false, description: "Existing unpublished review", status: "completed" }]);
    }
    // Also test the DO statement in autocommit, without a surrounding session
    // transaction: its writes cannot depend on temporary session objects.
    await db.exec(seed.replace(/^begin;$/m, "").replace(/^commit;$/m, ""));
    assert.deepEqual(await snapshot(db), first, "Repeating the seed must not duplicate content");
    console.log(`PASS PostgreSQL: ${drafts ? "existing draft/progress preserved" : "fresh course"}, 8 destinations, valid quizzes, idempotent retry, no temporary relations`);
  } finally { await db.close(); }
}
