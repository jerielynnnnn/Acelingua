import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) }) },
});
const fields = {
  languages: "id,code,name,is_active",
  courses: "id,language_id,title,level,is_published",
  units: "id,course_id,title,description,unit_order,location_name,is_published",
  lessons: "id,unit_id,title,description,lesson_order,is_published,xp_reward,coin_reward",
  vocabulary: "id,lesson_id,word,translation,pronunciation",
  activities: "id,lesson_id,title,activity_type,activity_order",
  questions: "id,activity_id,question_type,question_text,correct_answer,options",
  travel_countries: "id,code,name,is_active",
  travel_country_languages: "country_id,language_id",
  travel_country_units: "country_id,unit_id,is_required",
  passport_stamp_definitions: "id,country_id,unit_id,name,requirement_type",
  writing_systems: "*", writing_studio_lessons: "id,language_id,title,is_published",
};
const report = { checkedAt: new Date().toISOString(), access: "Anonymous catalog visibility only; unpublished or protected rows may be hidden. No private learner data queried.", tables: {} };
await Promise.all(Object.entries(fields).map(async ([table, select]) => {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const result = await db.from(table).select(select).range(offset, offset + 499);
    if (result.error) { report.tables[table] = { error: result.error }; return; }
    rows.push(...result.data);
    if (result.data.length < 500) break;
  }
  report.tables[table] = { count: rows.length, rows };
}));
fs.writeFileSync("supabase/country-curriculum-audit.json", JSON.stringify(report, null, 2) + "\n");
for (const [table, result] of Object.entries(report.tables)) console.log(`${table}: ${result.error ? JSON.stringify(result.error) : result.count}`);
for (const language of report.tables.languages.rows ?? []) {
  const courses = (report.tables.courses.rows ?? []).filter(c => c.language_id === language.id);
  const units = (report.tables.units.rows ?? []).filter(u => courses.some(c => c.id === u.course_id));
  const lessons = (report.tables.lessons.rows ?? []).filter(l => units.some(u => u.id === l.unit_id));
  const words = (report.tables.vocabulary.rows ?? []).filter(w => lessons.some(l => l.id === w.lesson_id));
  console.log(JSON.stringify({ language: language.code, courses, units: units.map(u => ({ id: u.id, title: u.title, order: u.unit_order, lessons: lessons.filter(l => l.unit_id === u.id).length })), lessons: lessons.length, vocabulary: words.length }));
}
