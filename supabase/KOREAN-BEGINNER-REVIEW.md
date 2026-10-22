# Korean Beginner: audit, implementation, and database review

## Audit evidence

Fresh read-only anonymous REST audit: `korean-audit.json` (2026-10-22).
The script paginates catalog reads and prints no credentials or learner records.
Anonymous visibility cannot establish the absence of unpublished rows or private progress.

| Catalog | Observed |
| --- | --- |
| Korean language | `c3792eee-2458-45aa-859e-81e243a78c17` |
| Existing Beginner course | `a5c6b836-c1a8-70e6-b53b-cd1742d46707`, Korean: your first conversations, published |
| Existing unit | `e33f7bfa-d32c-c894-1d1b-127883930e64`, order 1, published |
| Existing lesson | `b654cb47-ce9a-0c43-0124-528b330cf24d`, Korean: Hello and goodbye, published |
| Lesson vocabulary / activities / questions | 3 / 0 / 0 visible |
| Korean writing systems | consonants, vowels, syllables; existing IDs retained |
| Korean characters / workbook lessons / workbook activities | 0 / 0 / 0 visible |
| South Korea country | `d3c981a5-9bf7-469c-93de-8a7c5105c6eb`, code `kr` |
| Travel associations | Korean-to-country and original unit-to-country mappings visible |
| `travel_unit_curriculum` | Permission denied to anonymous catalog access; not assumed empty |

Before any write, a trusted reviewer must run `check-korean.sql`. It inspects all
Korean rows, actual enum/CHECK constraints, protected travel metadata, aggregate
enrollment/completion/writing/stamp dependencies, and access policies. Save its
results before applying either proposal. No private learner data was queried by
the development scripts. Unpublished content and private dependency counts remain
unverified until that SQL audit is run.

## What is ready in the repository

- `korean-beginner.json`: 10 destinations, 40 teaching lessons with eight core
  expressions each, and 10 unit challenges (50 total). The 440 vocabulary rows
  include deliberate per-lesson and challenge review; identical words within a
  lesson are deduplicated. Repeated words across lessons have different teaching
  contexts because the current schema associates vocabulary with one lesson.
- Each lesson has a travel story, objectives, usage explanation, practical
  dialogue, listening fallback, review, and multiple-choice assessment feedback.
  The draft uses 250 existing-type activities and 315 questions, including 45
  explicit retrieval questions from prior units. No new enum or
  activity types are introduced. Audio files remain null; playback uses existing
  browser Korean voices when installed and accurately reports their absence.
- `korean-writing-workbook.json`: ten stages with 34 exercises. The final stage
  covers guided sentence explanation, tiles, gap filling, independent typing,
  and optional self-reviewed handwriting. Additional Korean character exercises
  live in the existing character studio, once reviewed catalog rows are published.
- `korean-characters-review.json`: 45 character/block drafts (14 basic consonants,
  10 basic vowels, 11 compound vowels, five tense consonants, five example blocks).
  Sound guidance and example words are supplied. Every missing stroke path,
  stroke count, and audio asset remains null, with a review-required note.
  These character drafts remain unpublished even after the separate course
  publication proposal. Verified penmanship is NOT claimed.
- Workbook routes, keyboard guidance, language tags, audio language, character
  lookup, and final navigation now support Korean without directing learners to
  Japanese. Korean local practice keys include the account and language. Existing
  Japanese local-storage keys remain identical. Database progress IDs and RPCs
  remain in use; local practice is labeled and never silently uploaded.
- Korean sentence checking uses NFC normalization, respects word boundaries,
  and accepts only the model and explicit alternatives. It rejects romanization
  for sentence tasks. It is deliberately not an open-ended grammar grader.
- Korean roadmap destinations show cultural context; challenge nodes use a
  trophy and clear label. Existing locked/current/completed states, passport
  arrival gates, course enrollment checks, and reward RPCs remain authoritative.
  The launcher is labeled Hangul & Writing for Korean only.

## Grammar and teaching progression

Unit 1 introduces useful polite chunks and noun identification. Unit 2 decodes
Hangul. Unit 3 introduces objects and likes. Unit 4 separates native and
Sino-Korean numbers. Unit 5 practices counters and requests. Unit 6 contrasts
destination/location particles. Unit 7 develops routine and productive past
forms. Unit 8 distinguishes speech level from subject honorification. Unit 9
adds future plans; Unit 10 reviews rather than introducing new structures.
Useful early forms such as 왔어요 are explicitly taught as chunks before their
productive past-tense rule. Romanization is supplied early and absent by default
from later vocabulary. No Korean-to-English one-to-one grammar equivalence is
claimed. An independent Korean teacher should review the draft before publication.

Original reference material consulted (no textbook content copied):

- National Institute of Korean Language: https://www.korean.go.kr/eng_hangeul/principle/001.html
- King Sejong Institute curriculum: https://www.iksi.or.kr/lms/main/curriculum.do

## Existing mini-games and honest limits

| Requested experience | Existing implementation / decision |
| --- | --- |
| Word Match | `MatchingCards.tsx`, already available in the authenticated lesson intro |
| Sound Detective | Existing `ListenAndChoose.tsx` provides supplementary listen-and-choose; retain its actual name |
| Sentence Builder | Korean workbook uses existing word/sentence tiles and response modes |
| Missing Word Mystery | Existing typing mode supports a clearly scoped fill-the-gap exercise; no new game is claimed |
| Memory Flip | Play Island has a separate English picture-pair game, not Korean curriculum content; not represented as Korean learning |
| Picture Detective, Conversation Quest, Café with Ace, Shopping Adventure, Language Boss Battle | No matching complete Korean game implementation found. Use contextual lesson dialogues/checkpoints, and keep standalone game implementation deferred |

No reward-bearing mini-game service was changed. Workbook results remain
practice-only. Lesson and challenge rewards still use server-verified assessment,
existing heart rules, and idempotent completion. No fake URLs or image/audio paths
were created.

## Proposed database changes — NOT RUN

1. `proposals/202610220001_korean_beginner_draft.sql`
   - Guarded, transactional, advisory-locked; fails if unexpected Korean units,
     lessons, original activities, identities, or travel metadata are found.
   - Reuses the original course, first unit and first lesson. Updates their
     titles/descriptions/location metadata; keeps all publication flags and IDs.
   - Preserves the three legacy vocabulary IDs; clarifies the farewell direction
     and fills their usage/example fields. Adds missing words without inserting
     duplicates for the same lesson and spelling.
   - Adds 9 units and 49 lessons UNPUBLISHED, plus teaching activities/questions.
     Enriching the original published lesson takes effect on approval because
     `activities` and `questions` have no separate publication flag.
   - Links all mapped units to South Korea, adds guarded challenge metadata,
     and adds inactive unit-stamp definitions only when one does not already exist.
   - Adds unpublished Korean workbook lessons/activities and character drafts,
     reusing existing tables and writing systems. No schema migrations or RLS changes.
   - No writes to enrollment, completion/progress, balances, streaks, passports,
     arrival records, or earned stamps. No deletion, truncation, UUID regeneration,
     duplicate course, or automatic reward/stamp claims.
2. `proposals/202610220002_korean_publish_after_review.sql`
   - Separate approval and explicit transaction-local review gate required.
   - Checks mapped counts/content, publishes course/workbook drafts, activates
     only new seed-owned stamp definitions, and reconciles summary counters against
     existing completion rows. Percentage may decrease when the course expands;
     historical completions and earned rewards stay intact.
   - Character drafts stay unpublished until verified stroke assets are available.
   - Existing stamp definitions and earned stamps remain untouched. Future stamps
     use the existing server-side arrival/challenge/completion validation.

Both scripts are proposals only. Generating them never connects to the database.
Reruns reuse deterministic IDs for new content and do not overwrite existing
teaching activity definitions. Any changed draft should be explicitly diffed and
reviewed; `ON CONFLICT DO NOTHING` is not a content-update mechanism.

## Validation and remaining gates

Automated checks cover the 50-lesson structure, unique vocabulary/options,
stable legacy IDs, supported model answers, Korean IME normalization and spacing,
incorrect particles and romanization, workbook completion, missing asset disclosure,
draft write boundaries, and publication gating. Existing roadmap, lesson-session,
authenticated lesson, world, Japanese writing and reward-replay tests also run.

Before publishing, verify with two learner accounts on an approved database:
an existing completed Korean lesson remains completed and replay awards zero;
the next lesson follows prerequisite ordering; a traveler without an arrival
stamp cannot access lessons; a returning traveler retains access; writing progress
is isolated by user/language; challenge scores below the existing threshold cannot
award a stamp; reward and stamp retries are idempotent. These database/RLS checks
have not been claimed as completed by static tests. SQL execution and real
authenticated browser validation require the approved environment.

Regenerate reviewed artifacts locally: `node scripts/build-korean.mjs`.
Refresh the anonymous audit: `node scripts/audit-korean.mjs` (read-only network access).
Run Korean checks: `node --test tests/korean-curriculum.test.mjs`.

Validation recorded for this change: TypeScript passed; the targeted suite passed
35 tests (including eight Korean-specific tests); the production build using
`npm run build -- --webpack` passed and generated the learner/writing routes.
The default Turbopack build failed in the existing Google Font import resolution
for the public About/Language pages. The Webpack build required network access
to fetch the app's existing Google Fonts. This change does not alter those fonts
or the project's default build configuration.
