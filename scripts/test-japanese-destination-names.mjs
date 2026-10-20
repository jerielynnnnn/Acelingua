import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "../.tmp-country-sql/node_modules/@electric-sql/pglite/dist/index.js";
const sql = fs.readFileSync(new URL("../supabase/migrations/202610190001_japanese_lesson_destination_names.sql", import.meta.url), "utf8").replace(/^\uFEFF/, "");
const db = new PGlite();
try {
  await db.exec(`
    create table languages(id int primary key, code text);
    create table courses(id int primary key, language_id int);
    create table units(id int primary key, course_id int, title text, location_name text);
    create table lessons(id int primary key, unit_id int, title text);
    create table lesson_progress(lesson_id int primary key, status text);
    insert into languages values (1,'ja'),(2,'en');
    insert into courses values (1,1),(2,2);
    insert into units values
      (1,1,'Numbers & Time','Osaka'),
      (2,1,'Around the City','Kyoto Cultural Walk'),
      (3,1,'Tokyo Convenience Store','Tokyo Convenience Store'),
      (4,1,'Japan Explorer Finale','Japan Explorer Finale'),
      (5,2,'Osaka','Osaka'),
      (6,1,'Nara',null);
    insert into lessons values
      (1,1,'Learn — Tokyo Convenience Store'),
      (2,2,'Discover — Tokyo Train Station'),
      (3,3,'Practice — Tokyo Convenience Store'),
      (4,4,'Learn — Japan Explorer Finale'),
      (5,5,'Learn — Tokyo Convenience Store'),
      (6,6,'Discover — Kyoto Cultural Walk'),
      (7,1,'Numbers 1–10');
    insert into lesson_progress values (1,'completed');
  `);
  await db.exec(sql);
  const snapshot = async () => (await db.query('select * from lessons order by id')).rows;
  const first = await snapshot();
  assert.deepEqual(first.map(row => row.title), [
    'Learn — Osaka Convenience Store', 'Discover — Kyoto Train Station',
    'Practice — Osaka Convenience Store', 'Learn — Japan Explorer Finale',
    'Learn — Tokyo Convenience Store', 'Discover — Nara Cultural Walk', 'Numbers 1–10',
  ]);
  assert.equal((await db.query('select location_name from units where id=3')).rows[0].location_name, 'Osaka Convenience Store');
  assert.equal((await db.query('select status from lesson_progress where lesson_id=1')).rows[0].status, 'completed');
  await db.exec(sql);
  assert.deepEqual(await snapshot(), first);
  console.log('Passed: Japanese city alignment, legacy scene correction, other-language isolation, progress preservation, and repeat application.');
} finally { await db.close(); }
