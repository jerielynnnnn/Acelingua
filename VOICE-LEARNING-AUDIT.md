# Voice learning audit and reusable components

## Live public audit (13 October 2026)

A read-only Supabase REST audit with the project's public key found these active languages. Anonymous RLS exposes introductory content only; the counts below cannot establish full authenticated course coverage.

| Language | Published course visible to guests | Visible first lesson | Vocabulary entries |
| --- | --- | --- | --- |
| Japanese | Japanese Beginner | Saying Hello | 5 |
| Korean | Korean: your first conversations | Korean: Hello and goodbye | 3 |
| Mandarin Chinese | Mandarin Chinese: your first conversations | Mandarin Chinese: Hello and goodbye | 3 |
| Spanish | Spanish: your first conversations | Spanish: Hello and goodbye | 3 |
| French | French: your first conversations | French: Hello and goodbye | 3 |
| German | German: your first conversations | German: Hello and goodbye | 3 |
| Thai | Thai: your first conversations | Thai: Hello and goodbye | 3 |

English and Filipino were not returned as active catalog languages. Locale support does not insert or activate them. Every audited language has usable vocabulary for a guest preview and matching practice. None is claimed to have a complete eight-unit multimedia curriculum.

## Existing implementation inspected

`lib/authenticated-lesson.ts`, `lib/lesson-session.ts`, `lib/language-catalog.ts`, the authenticated player and activity screens, guest introduction and activities, Supabase ownership/completion/assessment migrations, `scripts/generate-curriculum.mjs`, `supabase/curriculum.json`, and local audio assets were inspected.

The existing generator contains seven-language starter data, with three units/six lessons/eighteen words per language in its source. That is seed-source coverage, not evidence of live published rows. It is not run or modified by this change. Japanese restructuring and historical progress are preserved.

Two Korean MP3 assets exist. No recording assets were found for the other six active languages. Japanese/Korean/Mandarin preview rows have pronunciation strings; French/German/Spanish/Thai preview rows have null pronunciation. No new romanization, IPA, articulation tips, timing, or native-speaker validation is invented. Stored guides still require linguistic review before claiming a standardized pronunciation curriculum.

## Implemented foundation

- `LanguageAudio`: native-text playback, stored recording preference, exact/same-language synthesized voice selection, Play/Stop/Replay, normal/slow playback, no autoplay, missing-recording/voice states, cleanup on unmount.
- `VocabularyCard`: database native text, translation, optional stored pronunciation guide, example sentence audio and captions.
- `LessonCaptions`: optional native sentence captions, stored pronunciation, and translation toggles. No invented word highlighting/timestamps.
- `SpeakingPractice`: explicit microphone action, locale-specific browser recognition, recognized words, transcript matching, microphone-denial/unsupported fallback and typed practice. No pronunciation percentages, permanent score, or recording storage.
- `MatchingCards`: real unique vocabulary pairs, shuffled meanings, touch/keyboard buttons, mismatch counter, matched-pair state, completion and replay. Ambiguous words/meanings/IDs are excluded.
- `ListenAndChoose`: optional vocabulary-derived listening practice with replay/slow controls; captions and correct meaning are shown only after the attempt. This is supplementary practice, not a fabricated database question.
- Guest introduction and authenticated vocabulary screens share the new cards. Guest completion uses actual matched pairs when available; small/ambiguous word lists retain phrase-hunt fallback. Guest history remains local until successful account transfer.
- Instructional listening/speaking screens provide supplementary practice. Database questions of unsupported types remain unavailable for rewarded assessment rather than being silently treated as completed.
- Authenticated results offer optional matching review. Existing server-graded questions, lesson ordering, locks, balances, and idempotent reward RPCs are unchanged. Supplementary games and speech practice grant no account currency and do not claim persisted game/speech attempts.

New source files: `lib/voice-learning.ts`, six components under `components/learning/`, `scripts/audit-public-learning.mjs`, `tests/voice-learning.test.mjs`, and this report. Modified: guest introduction, guest activities, authenticated player, and instructional activity screen.

## Remaining content/persistence work

No new migration is required for these reusable components and none was executed. The existing preview-transfer migration remains subject to manual review/install status.

Next phase: review one Japanese lesson end-to-end, obtain authenticated coverage and live schema/RLS results, then add narrowly scoped media/guide metadata and server-validated game/speech attempt persistence where required. Prepare each language's draft curriculum separately; do not auto-publish it. Fill-blank/listening/speaking database assessment needs a matching server implementation before those question types can earn lesson rewards.

Across all seven active languages, the live full-course gaps remain unmeasured because guest RLS hides later lessons. Verified gaps are local recording coverage outside Korean and null pronunciation strings in four introductory lessons. Suitable synthesized voices depend on the user's browser/device; speech synthesis is not a professional native-speaker recording or acoustic pronunciation assessment.

Browser voice playback, slow recordings, microphone permission denial, recognition language availability, captions and visual touch/mobile behavior require real browser/device checks. Automated helper tests cannot establish those outcomes.

`supabase/check-multilingual-coverage.sql` is a prepared read-only query for manual full-curriculum auditing beyond guest RLS; it was not executed.

## Verification performed

The live anonymous REST audit above was actually run. `node --test tests/*.test.mjs` passed 88 tests, including voice selection, existing recording paths, ambiguous matching pairs, intact script units, transcript comparison, guest transfer, and existing reward/ownership regressions. Targeted ESLint and the production build passed. Browser/device tests and live SQL concurrency were not run.
