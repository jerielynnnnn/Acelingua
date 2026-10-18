# Country adventure implementation

Application changes implemented; migrations 007 and 008 are PROPOSED and NOT
APPLIED. No database content, publishing flags or learner records were changed
remotely. Read-only REST discovery used the configured publishable key, without
reading private learner records. Local uncommitted changes were preserved.

## Audit findings

- Seven visible active languages and countries: Japanese/Japan, Korean/South
  Korea, Mandarin/China, Spanish/Spain, German/Germany, Thai/Thailand, French/France.
- Country-language associations and seven arrival definitions exist. No country
  units were linked at the time of the audit.
- Anonymous RLS exposes seven courses and one preview lesson per language, with
  23 visible vocabulary rows. It exposes zero activities/questions; that is NOT
  proof the full curriculum is empty. Japan has five visible words, others three.
- The anonymous catalog cannot establish unpublished course counts, full lesson
  counts, duplicate/order issues, or individual progress. The full read-only SQL
  audit is `check-country-curriculum.sql`; run it as a project administrator.
- `writing_systems` exposes nine records. The initial workbook audit used an
  incorrect language_code column; the reusable audit script now uses language_id.
  Full workbook publishing remains to be checked through the SQL audit.
- Local Japanese restructuring history describes eight units, retained legacy
  lesson IDs, and unfinished lesson shells. The seed reconciles by course ID,
  existing unit/lesson aliases and stable seed IDs, not anonymous visibility.
- Existing roadmap ordering already handles UUID tie breakers, preserves later
  historical completions, and requires every earlier published lesson. The
  existing server lesson helper enforced enrollment/order but omitted arrival.
- Existing `/learn/[courseId]` redirects to `/learn?course=...`; lesson links use
  `/learn/lesson?course=...&lesson=...`. These routes exist; no new lesson route is
  invented. All launch paths now share the same arrival presentation check.
- Learner-editable course_progress remains a display/access-time summary. All
  unlocking, progress percentages and stamp validation use lesson_progress.

## Implemented behavior

`Visit Country -> Boarding Pass -> Arrival -> Country Roadmap -> Lessons` remains
the travel flow. After arrival, existing enrolled courses render their actual
roadmaps on the country page. Learners without enrollment still use the existing
enrollment action. Historical completions and active enrollments are preserved.

Dashboard launch links go to arrival when necessary. Shared roadmaps show the
arrival requirement instead of lesson launch controls. Direct authenticated
lesson requests redirect to the existing country route before loading vocabulary
or activities. Setup/network failures fail closed. Public guest previews remain
previews and cannot grant real lesson completion or stamps.

Migration 007 adds the missing authoritative arrival check to the helper used by
both existing start/completion RPCs, and explicitly revokes direct lesson,
activity and answer writes. This server/API protection is NOT live until the
migration is approved and applied. It preserves the original sequential rules and
historical completed-lesson replay exception after arrival.

Destination headers have distinct completed/available/locked pastel styles and
retain the winding connected path, current marker, keyboard focus and existing
reduced-motion behavior. View Lessons / Preview Destination opens field notes,
objectives, vocabulary, ordered lesson rewards and optional writing guidance.
Locked destinations are previewable; their lessons cannot be launched.

The floating Alphabet & Writing launcher is preserved, including before arrival.
Unit previews link to the existing language-specific writing paths. Existing
Japanese workbook content and all writing records remain unchanged. Writing
practice is optional, not a prerequisite to conversation lessons.

## Japan pilot content and reconciliation

`japan-adventure.json` authors eight destination units with five lesson roles:
Discover, Learn, Practice, Real-Life Conversation, Destination Challenge. The seed
reuses named existing lessons for those roles, so it does NOT promise exactly 40
database lesson rows: legacy supplemental lessons stay intact. New lesson IDs
are deterministic, and original lesson IDs, hierarchy, ordering and existing
content are retained. Existing publication flags never change; only complete
seed-owned new lessons/units are published.

The eight scenes adapt the existing Japanese topic order: Tokyo greetings,
Tokyo convenience store/numbers, meeting a guide/daily life, Kyoto tea house,
Tokyo station/directions, Osaka shopping, Kyoto cultural walk, Japan finale.
Legacy lesson overrides supply appropriate vocabulary and grammar for names,
family, dates, weekdays, daily actions and other retained lesson titles instead
of filling every shell with a repeated greeting list. Unpublished legacy lessons
are excluded from playable-role matching, preserving their content, progress and
publication flags. When a role has only a draft, the seed creates a complete
adventure lesson with a stable ID; reruns prefer that ID before published aliases.
Unknown empty published lessons, ambiguous published associations or invalid
questions abort the transaction for review. No records are deleted or silently
unpublished to make the seed pass.

Educational text is authored for this app, using the Japan Foundation's Irodori
and Marugoto beginner communication topics as references (URLs in the JSON).
Native text, English meanings and romanization are supplied. Lessons use reading,
recall, optional browser pronunciation playback and scenario questions. There
are no fabricated recordings, audio URLs or claims of automated speaking scores.
Duration is an estimate across a unit, not a guaranteed session length.

Beginner, Elementary, Intermediate and Upper Intermediate labels have a shared
display convention. CEFR-inspired references are shown for French/Spanish/German;
Japanese and other non-European language labels use practical communication
wording. No empty higher-level course is created or published and no formal
proficiency certification is claimed.

Other active countries reuse the same arrival checks, roadmap, unit overview and
writing integration. Seed 008 links their existing compatible published units as
non-required destinations without altering content. Equivalent new eight-unit
curricula and challenge definitions for those languages are NOT yet authored;
they are not represented as complete by this implementation.

## Secure rewards

One additive metadata table, travel_unit_curriculum, stores objectives, cultural
text, writing guidance and the challenge lesson association. Learners can only
read published metadata. A before-completion trigger requires at least 80%
server-graded correct answers for a configured challenge; failed attempts roll
back the existing reward transaction. The lesson UI offers Retry Lesson.

An after-completion trigger validates enrollment, arrival, compatible language,
published units/lessons, every required lesson and the linked challenge before
inserting stamps. Country awards require a nonempty curated required-unit set.
Unique constraints make refresh/retries idempotent. No extra XP/coins are issued.
Existing completed lessons can be reconciled when reopening the passport; no
client-completed flag or editable aggregate is accepted as evidence.

The player shows newly collected stamps and an animation respecting reduced
motion. A failed post-completion stamp refresh never turns already-saved XP into
an apparent lesson-save failure. Passport reopening retries stamp reconciliation.

## Files changed for this upgrade

- `lib/travel/access.ts`, `components/travel/ArrivalRequired.tsx`: shared arrival checks.
- `lib/roadmap.ts`, `lib/authenticated-lesson.ts`: access-aware snapshots and completion synchronization.
- `components/roadmap/JourneyRoadmap.tsx`, its CSS, `UnitOverview.tsx` and its CSS: destination previews and state styling.
- `components/roadmap/CourseRoadmap.tsx`, `lib/curriculum/levels.ts`: level display and passport navigation.
- `components/world/CountryJourney.tsx`, `WorldExperience.tsx`: real roadmap after arrival.
- `components/dashboard/JourneyDashboard.tsx`: route continuation through arrival.
- `components/learning/AuthenticatedLessonPlayer.tsx`: direct-link redirect, stamp feedback and retry.
- `lib/travel/actions.ts`, `components/travel/TravelPassport.tsx`: reconcile historical stamps.
- Audit/generator scripts, JSON manifest, SQL audit, migrations 007/008 and tests.

## Approval and rollout

1. Review/run `check-country-curriculum.sql` read-only in the configured Supabase
   project's SQL Editor. Resolve unexpected incomplete/duplicate existing data
   with the owner; anonymous RLS cannot answer these audit questions.
2. Review `202610180007_country_learning_security.sql`: adds one metadata table,
   replaces the shared lesson validation helper, revokes direct progress writes,
   and adds challenge/stamp functions/triggers. Requires 005/006 and the existing
   assessed completion migration. It is not intended to be run twice.
3. Review generated `202610180008_japan_adventure.sql` alongside its JSON source.
   It is an idempotent data seed with guards; it may stop if the private catalog
   differs. If any guard fails, keep the complete error and inspect the real rows;
   do not remove the guard or run only selected statements.
   The corrected seed contains one self-contained DO block for all data changes;
   it creates no temporary table or temporary function. Replace any older SQL
   Editor copy completely before retrying migration 008.
4. Obtain approval before applying schema-changing SQL. Apply approved 007 then
   008, each as a complete transaction through the project's normal migration
   workflow. Do not blindly push older local migrations or rerun 005/006.
5. In an approved test database, run `supabase/tests/country-journey.sql` with its
   documented enrolled-learner fixture. It tests API bypass, sequential locks,
   forged progress denial and premature stamp denial and rolls back its writes.

No SQL migration or database integration test has been executed by this agent.
Authenticated browser scenarios, mobile visual behavior and live reward triggers
therefore remain unverified until this rollout is approved.

## URLs to test

- `http://localhost:3000/world/ja`: first arrival, then Japan roadmap.
- `http://localhost:3000/learn?course=c293f603-993b-4332-8dd8-afc0fd50ae04`: same course roadmap and previews.
- `http://localhost:3000/learn/lesson?course=c293f603-993b-4332-8dd8-afc0fd50ae04&lesson=973d6664-259a-415e-a2b1-aa08fe71306b`: existing Saying Hello lesson; a new learner must be sent through arrival.
- `http://localhost:3000/dashboard`: continuation goes through arrival if needed.
- `http://localhost:3000/passport`: arrival and earned destination collection.
- `http://localhost:3000/writing/ja`: preserved writing paths/workbook.
- `http://localhost:3000/world/fr`: shared travel/roadmap behavior for existing French content.

Test a fresh traveler and a returning learner; preview a locked destination, try
its lesson URL, finish a challenge with low and passing scores, retry completion,
and confirm stamps/balances do not duplicate. Check 375px and desktop layouts,
keyboard navigation and reduced motion. Keep another country's progress separate.

Local validation: 33 relevant tests passed across the new country journey suite,
existing roadmap/authenticated lesson/world suites and both writing suites.
TypeScript, targeted ESLint for changed application files and production build
passed. The root application lint check still reports four pre-existing errors
and one warning in app/page.tsx, app/about/page.tsx and
app/onboarding/profile/page.tsx. These unrelated pages were preserved.

Seed repair verification: `scripts/test-japan-seed.mjs` runs the actual generated
SQL in disposable in-memory PostgreSQL (PGlite), with no Supabase connection.
It checks a fresh course and an existing unpublished review with completion
progress, all eight destination/challenge associations, quiz answer inclusion,
and duplicate-free retries without a surrounding transaction. Both fixtures pass.
Its optional test engine is isolated under ignored `.tmp-country-sql/`; root
application dependencies and lockfiles are unchanged.
