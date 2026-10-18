# Alphabet & Writing Studio

This feature is independent of lessons, onboarding, enrollment, XP, currencies,
and course progress. The only existing component changed is
`components/roadmap/JourneyRoadmap.tsx`, which renders a book launcher in its own
reserved strip above the roadmap nodes. Its raised, gently bobbing design stays
in normal flow on both desktop and mobile to avoid obscuring navigation or lessons.

## Routes and context

- `/writing/[language]`: category cards, learned counts, recall mastery, and grid.
- `/writing/[language]/[system]/[character]`: audio, examples, verified stroke
  demonstration, tracing, recognition/reading/listening checks, and previous/next.
- `/writing/[language]/course/[lesson]`: progressive workbook lessons. Japanese
  starts with an interactive introduction, the three scripts, and Hiragana あ,
  then word formation, polite statements, topic は, question か, likes/dislikes,
  object を, everyday sentences, and review (12 lessons).
- `course` and an allowlisted `returnTo` query parameter travel through every
  studio link. Exiting returns to the launching dashboard or course roadmap.
  Dashboard selection already lives in its existing per-user session storage.

## Database preparation — not executed

1. Review `migrations/202610180001_writing_studio.sql`.
2. After approval, apply it, followed by `writing-studio-seed.sql`.
3. Check content publishing and owner-only RLS with two separate learner accounts.

The three new tables have UUID keys, foreign keys, unique constraints, indexes,
and RLS. Anonymous/authenticated clients can only read published curriculum;
only service-role/trusted processes can write curriculum. Learners only manage
their own character progress. `record_writing_practice` is an atomic invoker RPC
for practice count and recall mastery; it never writes existing learning tables.
Each correct recall check with self-reported tracing adds 25 mastery points.
This is not handwriting recognition or a secure assessment for rewards.

Until the schema is applied, only a missing-table error enables the bundled
curriculum with explicitly labeled, per-account browser progress. Other database
errors display a retry state. Guests use separate browser progress. Local results
are not silently uploaded after migration or shared across signed-in accounts.
Keep browser data until an explicit import flow is added.

## Workbook extension — not applied

Inspect `migrations/202610180002_writing_workbook.sql`, then
`writing-workbook-seed.sql`. These are separate from the character migration and
seed above. Apply only after approval, in that order. The existing
`activities.activity_type` constraint is not changed.

Four additive tables cover the required data:

- `writing_studio_lessons`: introduction/grammar blocks and lesson ordering.
- `writing_studio_activities`: word, sentence, recognition, and character exercises.
- `user_writing_lesson_progress`: owner-only completed activity IDs and lesson completion.
- `user_sentence_practice_attempts`: owner-only responses and activity mode; also
  records workbook recognition and self-reviewed handwriting practice attempts.

RLS permits published content reads and owner-only learner progress/attempts.
Only trusted service-role processes can write the curriculum. The invoker RPC
records an attempt and merges progress atomically. No existing lesson, course,
profile, reward, or character-progress records are modified by workbook exercises.
Completion records practice, not a certified assessment.

Regenerate the workbook seed without internet using
`node scripts/build-writing-workbook.mjs`. Source definitions are in
`lib/writing/course-curriculum.ts`; source generation never executes SQL.
The first studio migration and character seed are prerequisites for the
character exercise. Existing character data, audio, and stroke paths are reused.
The code audit used the repository's schema migrations; live table policies
were not altered or exercised from this environment.

Missing workbook tables enable clearly labeled browser-only practice, scoped to
the current user or guest. Other database errors are visible and retryable.
Applying the workbook migration also requires its seed: an empty published
catalog is shown as unpublished rather than silently substituted. Browser-only
results are not automatically migrated to an account.

Each sentence exercise supports word tiles, IME-friendly text input, and
independent writing. Kana/Kanji variants, whitespace, full-width forms, and final
punctuation are normalized using an explicit, scoped equivalence list. Particle,
ending, and word-order feedback is specific to the taught pattern. Unsupported
sentences are not claimed to be universally ungrammatical. This is a bounded
beginner workbook, not a general Japanese grammar engine.

Independent handwriting is explicitly self-reviewed against a model. Strokes
are not recognized, scored, or stored as verified text. The keyboard alternative
supports Japanese IME composition; tile mode is available without a Japanese
keyboard. Guided and guide-free character canvases are separate so practice can
move from tracing to memory.

Beginner grammar references used to check the original workbook explanations:

- Japan Foundation Irodori introduction and word-order example:
  https://www.jpf.go.jp/e/project/japanese/teach/tsushin/news/202211.html
- Japan Foundation Irodori Starter grammar worksheets:
  https://www.irodori.jpf.go.jp/assets/data/resources/Grammar_Worksheets_X.pdf
- Japan Foundation Marugoto Starter contents and scripts:
  https://marugoto.jpf.go.jp/en/assets/docs/about/starter_competences_contents_en.pdf

Automated checks: `node --test tests/writing-workbook.test.mjs tests/writing-studio.test.mjs`.
These cover real example answers/alternatives, particles, negative preferences,
IME guidance, Kana/Kanji variants, progress isolation, and original stroke paths.
Live RLS, real mobile/pen input, and IME conversion should also be exercised in
an authenticated browser before publishing the migration.

## Content and provenance

Japanese: 241 entries across Hiragana, Katakana, and beginner Kanji, including
voiced rows, contracted sounds, small tsu, and long-vowel patterns. Korean and
Spanish category structures are present; unprepared character content is clearly
labeled. No placeholder recording or stroke sequence is marked complete.

Kana reference: Japan Foundation Marugoto writing resources:
https://a1.marugotoweb.jp/en/hiragana.php and
https://a1.marugotoweb.jp/en/katakana.php

Stroke paths: KanjiVG, Ulrich Apel and contributors, pinned source revision in
`public/writing/kanjivg/ATTRIBUTION.md`. Original licensed SVGs and license are
preserved. Extracted stroke arrays retain original per-glyph ordering and paths;
multi-character patterns place glyphs left-to-right. These adapted stroke arrays
remain CC BY-SA 3.0. Attribution appears beside every demonstration.
https://github.com/KanjiVG/kanjivg
https://creativecommons.org/licenses/by-sa/3.0/

Regenerate with `node scripts/build-writing-content.mjs` (requires internet), or
use `--offline` to rebuild from the preserved, pinned SVG files without downloads.
The script only writes local content, source SVGs, license, and seed SQL; it never
connects to Supabase. Existing curriculum rows are preserved on seed reruns.

Audio reuses `LanguageAudio`: real recordings where present, otherwise matching
language browser voices. Missing voices remain visibly unavailable. For Kanji,
the example word is spoken because isolated readings depend on context. Missing
example vocabulary is explicitly labeled. Curriculum examples should undergo a
native-speaker editorial review before broad publication.

## Validation

- Verify every stroke path/count against the pinned source SVGs.
- Mouse, touch, pen, pointer cancellation, resizing, and high-DPI canvas redraw.
- Undo, clear, guide toggle, paper practice alternative, and animation replay.
- Reduced motion shows static stroke paths and disables launcher bobbing.
- Try wrong/right recall answers and ensure one save per practice attempt.
- Refresh, change account, and test blocked storage and database failures.
- Exit from dashboard and `/learn?course=...`; verify course selection and lesson
  progress remain unchanged.
