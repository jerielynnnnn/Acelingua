// Read-only audit using the configured public key, never a service-role key.
import { createClient } from "@supabase/supabase-js";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
});
const languages = await db.from("languages").select("id,code,name").eq("is_active", true).order("name");
if (languages.error) throw new Error(languages.error.message);
const rows = await Promise.all(languages.data.map(async language => {
  const courses = await db.from("courses").select("id,title").eq("language_id", language.id).eq("is_published", true);
  if (courses.error) return { language: language.code, error: courses.error.message };
  const content = await Promise.all(courses.data.map(async course => {
    const units = await db.from("units").select("id,title,unit_order").eq("course_id", course.id).eq("is_published", true).order("unit_order").order("id");
    if (units.error) return { course, error: units.error.message };
    const lessons = units.data.length ? await db.from("lessons").select("id,title,lesson_order").in("unit_id", units.data.map(u => u.id)).eq("is_published", true).order("lesson_order").order("id") : { data: [], error: null };
    if (lessons.error) return { course, error: lessons.error.message };
    const words = lessons.data.length ? await db.from("vocabulary").select("word,translation,pronunciation,lesson_id").in("lesson_id", lessons.data.map(l => l.id)) : { data: [], error: null };
    return { course, visibleUnits: units.data, visibleLessons: lessons.data, visibleVocabulary: words.data, error: words.error?.message };
  }));
  return { language: language.code, content };
}));
console.log(JSON.stringify({ scope: "Anonymous RLS-visible content only; later authenticated lessons are not counted", rows }, null, 2));
