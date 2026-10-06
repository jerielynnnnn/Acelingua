import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export function validateCurriculum(curriculum) {
  const requiredCodes = ["ja", "ko", "zh", "es", "de", "th", "fr"];
  if (curriculum.units?.length !== 3) throw new Error("Expected three starter units.");
  const keys = curriculum.units.flatMap((unit) => {
    if (!unit.title || !unit.description || unit.lessons?.length !== 2) throw new Error("Each unit needs a title, description, and two lessons.");
    return unit.lessons.map((lesson) => {
      if (!lesson.key || !lesson.title || !lesson.description) throw new Error("Lesson metadata is incomplete.");
      return lesson.key;
    });
  });
  if (new Set(keys).size !== 6) throw new Error("Lesson keys must be unique.");
  const codes = curriculum.languages?.map((language) => language.code) ?? [];
  if (codes.length !== requiredCodes.length || new Set(codes).size !== codes.length || requiredCodes.some((code) => !codes.includes(code))) throw new Error("Expected all seven supported languages exactly once.");
  for (const language of curriculum.languages) {
    if (!language.name || !language.native_name || !language.course_title) throw new Error(`Missing language metadata: ${language.code}`);
    if (Object.keys(language.words ?? {}).length !== keys.length) throw new Error(`Unexpected lesson topics: ${language.code}`);
    for (const key of keys) {
      const words = language.words[key];
      if (!Array.isArray(words) || words.length !== 3) throw new Error(`Expected three vocabulary items: ${language.code}/${key}`);
      const nativeWords = new Set();
      for (const word of words) {
        if (!Array.isArray(word) || word.length !== 3 || typeof word[0] !== "string" || !word[0].trim() || typeof word[1] !== "string" || !word[1].trim() || (word[2] !== null && typeof word[2] !== "string")) throw new Error(`Invalid vocabulary: ${language.code}/${key}`);
        if (nativeWords.has(word[0])) throw new Error(`Duplicate word: ${language.code}/${key}`);
        nativeWords.add(word[0]);
      }
    }
  }
}

export function generateCurriculumSql(curriculum) {
  validateCurriculum(curriculum);
  const payload = JSON.stringify(curriculum, null, 2);
  if (payload.includes("$curriculum$") || payload.includes("$seed$")) throw new Error("Curriculum contains a SQL delimiter.");
  return `-- Generated from supabase/curriculum.json by scripts/generate-curriculum.mjs.
-- Run after migrations 001 and 002 in the Supabase SQL Editor.
-- Each existing course gets its own starter units, lessons, and vocabulary IDs.
-- Existing content stays intact and follows the three new starter units.
-- Reruns do not duplicate seed content or overwrite existing records.
begin;

do $seed$
declare
  curriculum jsonb := $curriculum$${payload}$curriculum$::jsonb;
  language_entry jsonb;
  unit_entry jsonb;
  lesson_entry jsonb;
  word_entry jsonb;
  language_uuid uuid;
  course_entry record;
  existing_unit record;
  unit_uuid uuid;
  lesson_uuid uuid;
  word_uuid uuid;
  unit_index integer;
  lesson_index integer;
  word_index integer;
begin
  -- Prevent concurrent seed executions from shifting unit orders twice.
  perform pg_advisory_xact_lock(19481005, 3);

  for language_entry in select value from jsonb_array_elements(curriculum->'languages') loop
    insert into public.languages(code, name, native_name, flag_emoji, is_active)
    values (language_entry->>'code', language_entry->>'name', language_entry->>'native_name', language_entry->>'flag_emoji', true)
    on conflict (code) do nothing;
    select id into language_uuid from public.languages where code = language_entry->>'code';

    -- Create a published entry course only when the language has none.
    if not exists (select 1 from public.courses where language_id = language_uuid and is_published) then
      insert into public.courses(id, language_id, title, description, level, is_published)
      values (md5('acelingua:starter:v1:' || language_uuid::text || ':course')::uuid,
        language_uuid, language_entry->>'course_title',
        'Learn everyday ' || (language_entry->>'name') || ' through greetings, polite expressions, numbers, colors, food, and travel.',
        'beginner', true)
      on conflict (id) do nothing;
    end if;

    for course_entry in select id from public.courses where language_id = language_uuid loop
      -- Move pre-existing units after the starter curriculum once. Their IDs,
      -- content, publication state, and learners' completion records survive.
      if not exists (
        select 1 from public.units
        where course_id = course_entry.id and id in (
          select md5('acelingua:starter:v1:' || course_entry.id::text || ':unit:' || n::text)::uuid
          from generate_series(1, 3) n
        )
      ) then
        -- Move the highest order first so the immediate unique constraint on
        -- (course_id, unit_order) never sees a temporarily occupied target.
        for existing_unit in
          select id, unit_order from public.units
          where course_id = course_entry.id
          order by unit_order desc
        loop
          update public.units set unit_order = existing_unit.unit_order + 3
          where id = existing_unit.id and course_id = course_entry.id;
        end loop;
      end if;

      unit_index := 0;
      for unit_entry in select value from jsonb_array_elements(curriculum->'units') loop
        unit_index := unit_index + 1;
        unit_uuid := md5('acelingua:starter:v1:' || course_entry.id::text || ':unit:' || unit_index::text)::uuid;
        insert into public.units(id, course_id, title, description, unit_order, is_published)
        values (unit_uuid, course_entry.id, (language_entry->>'name') || ': ' || (unit_entry->>'title'),
          unit_entry->>'description', unit_index, true)
        on conflict (id) do nothing;

        lesson_index := 0;
        for lesson_entry in select value from jsonb_array_elements(unit_entry->'lessons') loop
          lesson_index := lesson_index + 1;
          lesson_uuid := md5('acelingua:starter:v1:' || course_entry.id::text || ':lesson:' || (lesson_entry->>'key'))::uuid;
          insert into public.lessons(id, unit_id, title, description, lesson_order, is_published)
          values (lesson_uuid, unit_uuid, (language_entry->>'name') || ': ' || (lesson_entry->>'title'),
            lesson_entry->>'description', lesson_index, true)
          on conflict (id) do nothing;

          word_index := 0;
          for word_entry in select value from jsonb_array_elements(language_entry->'words'->(lesson_entry->>'key')) loop
            word_index := word_index + 1;
            word_uuid := md5('acelingua:starter:v1:' || lesson_uuid::text || ':word:' || word_index::text)::uuid;
            insert into public.vocabulary(id, lesson_id, word, translation, pronunciation, created_at)
            values (word_uuid, lesson_uuid, word_entry->>0, word_entry->>1, word_entry->>2,
              now() + make_interval(secs => word_index))
            on conflict (id) do nothing;
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;
end;
$seed$;

-- Refresh existing progress summaries without resetting completed lessons.
update public.course_progress cp
set total_lessons = totals.total,
    completed_lessons = totals.completed,
    progress_percentage = case when totals.total = 0 then 0
      else totals.completed::numeric / totals.total * 100 end,
    updated_at = now()
from (
  select existing.id, count(distinct lesson.id)::integer as total,
    count(distinct lesson.id) filter (where progress.status = 'completed')::integer as completed
  from public.course_progress existing
  join public.courses course on course.id = existing.course_id
  join public.languages lang on lang.id = course.language_id
  left join public.units unit on unit.course_id = course.id and unit.is_published
  left join public.lessons lesson on lesson.unit_id = unit.id and lesson.is_published
  left join public.lesson_progress progress on progress.lesson_id = lesson.id and progress.user_id = existing.user_id
  where lang.code in ('ja', 'ko', 'zh', 'es', 'de', 'th', 'fr')
  group by existing.id
) totals
where cp.id = totals.id;

commit;
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const curriculum = JSON.parse(await readFile(new URL("../supabase/curriculum.json", import.meta.url), "utf8"));
  await writeFile(new URL("../supabase/migrations/202610050003_language_curriculum.sql", import.meta.url), generateCurriculumSql(curriculum), "utf8");
  console.log("Generated curriculum: 7 languages, 3 units and 6 lessons per course, 18 vocabulary items per course.");
}
