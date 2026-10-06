The starter curriculum lives in [curriculum.json](./curriculum.json). Each of the seven supported languages has three units, six lessons, and 18 vocabulary items. Units cover first conversations, everyday words, and food and travel. Vocabulary uses the selected language, with English translations and romanization where provided.

To load it into Supabase, run these SQL files in order in the SQL Editor:

1. `migrations/202610050001_guest_first_lesson.sql`
2. `migrations/202610050002_consistent_intro_course.sql`
3. `migrations/202610050003_language_curriculum.sql`

Skip the first two if they have already been applied. The third file inserts missing languages and creates a published beginner course when a language has no published course. Every existing course for those language codes receives its own starter units and lessons. Draft courses remain drafts.

The seed places its three starter units before existing units, preserving the relative order and IDs of existing content. It preserves course titles, existing vocabulary, enrollments, and completed lessons. Existing progress percentages are recalculated to include the newly added published lessons. Seed records have deterministic IDs based on their parent course, so rerunning the seed does not duplicate them or move the existing units again.

The guest and signed-in course pages both read these same Supabase records. Guests can preview the first published lesson; after account creation, its completion transfers to the account. Existing learner write policies must allow users to save their own enrollment and lesson/course progress.

After changing the curriculum source, regenerate the SQL with:

```powershell
node scripts/generate-curriculum.mjs
```

The generated seed uses `ON CONFLICT DO NOTHING` to protect existing records. Editing the JSON does not overwrite content already seeded into a live database; publish subsequent content edits through a separate migration.

Validate the curriculum and the generated SQL file with:

```powershell
node --test tests/curriculum.test.mjs
```

Japanese expression reference: [Japan National Tourism Organization](https://www.japan.travel/en/plan/japanese-language/). Korean expression reference: [National Institute of Korean Language](https://www.korean.go.kr/common/download.do%3Bfront%3DA45AEA82944040510C397576C1F5DAA9?book_seq=295&c_file_name=fbe8dc8b-5b54-46d0-96cb-229db3f23b4f_0.pdf&downGubun=bookDataView&file_path=bookData&o_file_name=%ED%95%9C%EA%B5%AD%EC%96%B4%EC%A7%84%ED%9D%A5-02-18.pdf).
