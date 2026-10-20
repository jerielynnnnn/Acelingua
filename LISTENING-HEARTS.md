# Vocabulary listening and hearts

## Current flow: free expressions, hearts during quiz only

The newer request supersedes the vocabulary penalty flow below. Expressions are
shown first with listening, meaning, sentences and speaking practice. Practice errors
never deduct hearts. Existing speaking verification still gates expression advancement.
After expressions, the activities include assessed questions. Only a wrong submitted
assessed answer deducts a heart. Instructional listening/speaking activities stay free.
Quiz submissions are stored once per question per lesson attempt, preventing duplicate
deductions and restoring the original submitted answer after retries. Heart recovery
remains one per ten minutes, up to five; zero hearts blocks new quiz submissions only.

Review `supabase/proposals/202610200006_quiz_only_hearts.sql` after the 005 foundation.
Neither file is applied by this work. If 005 is already installed, apply only 006.
The follow-up revokes the old vocabulary penalty RPC. `/api/hearts` POST now rejects
practice penalties and `/api/quiz` handles the assessed question submissions.
Local check: `node scripts/test-quiz-hearts.mjs`.

## Earlier proposal (superseded)

The authenticated lesson shows a listening choice check before revealing each
expression and its speaking practice. Submit answer calls the server, which checks
the selected vocabulary ID against the target in that lesson. A correct submission
unlocks that expression's existing speaking practice; both checks must succeed to
advance. A wrong choice costs one heart, remains on the same expression, and lets
the learner listen and change their selection. Double clicks and network retries
reuse a submission ID; the database charges at most once per submission.

`supabase/proposals/202610200005_listening_hearts.sql` is PROPOSED, NOT APPLIED.
Review before applying. Until activated, the UI explains why submissions are unavailable.
The existing profiles.hearts balance remains authoritative. Recovery grants one heart
every 10 minutes up to five. Elapsed offline intervals are reconciled on the next read;
no background cron is required. Spending another heart does not reset an active timer.
At zero hearts, submissions wait; listening and recorded practice remain available.
Heart store purchases keep their existing behavior and balances.

The timer and deductions use server timestamps and a profile lock. Clients cannot
submit a correctness flag, heart balance or recovery time. Tables use owner-read RLS
and deny direct learner writes. This does not deduct hearts for speech recognition
errors or change the existing assessed lesson reward RPC.

Local verification: `node scripts/test-listening-hearts.mjs`. Live database application,
independent connection races, signed-in audio playback and browser visuals require
separate verification.
