# Authenticated lessons

The existing route is `/learn/lesson?course=<course UUID>&lesson=<lesson UUID>`.
The roadmap and guest preview remain unchanged. The new player requires a
Supabase-authenticated user and uses the roadmap prerequisite computation before
reading vocabulary, activities or questions.

The live owner-provided results show the first Japanese lesson has three
vocabulary rows, zero activities and zero questions. It can therefore run as a
vocabulary-only lesson: intro → learning → saved result. No quiz or question
types are fabricated. Lessons containing activities display an unavailable
assessment state and cannot be completed. The six Unit 4 activities currently
have no questions. Activity progress and answer history are not written until
real assessment content is available and its player is implemented.

Apply `migrations/202610060003_authenticated_lesson_completion.sql` in SQL Editor
before testing Start/Finish. It adds authenticated curriculum/ownership read
policies and two callable RPCs, preserving the existing tables and policies.
It does not seed content, disable RLS, add tables or grant browser reward writes.

Opening the page only reads. Start records `in_progress`, preserves completion
on replay and increments attempts. Finish rechecks authentication, active
enrollment, publication and every earlier lesson. A transaction-scoped lock
serializes changes within the learner's course. First completion increments
profile XP/coins, records positive reward transactions with `lesson` as the
source/type, saves completion and recalculates course progress together. Any
failure rolls back all of these writes. Repeated completion and replay award
zero. No hearts are deducted. No rewards are written on page load or exit.

The server enforces prerequisites and requires Start before completion, but
vocabulary-only lessons have no graded assessment. Finish records review of the
teaching stage, not a verified quiz score. Existing profile and course-progress
update policies are preserved; this migration does not redesign the project's
broader API permissions or guest progress helper.

Run `tests/authenticated-lesson-completion.sql` with an enrolled learner UUID to
verify the database flow inside a rollback transaction. It requires the first
two lessons to be uncompleted. This test has not been executed against the live
database by the coding agent. Also test in the browser:

1. Open a locked lesson UUID: no lesson content or completion is allowed.
2. Open Lesson 1: no progress is created until Start.
3. Start, then exit: only in-progress state, no rewards.
4. Finish the three vocabulary items: rewards and result reflect the RPC output.
5. Return to `/learn`: one completed lesson and the second lesson current.
6. Replay Lesson 1: zero additional XP/coins and unchanged course completion.

From the supplied data, the course has 12 published lessons; completing its
first lesson from zero progress should give 1/12 (approximately 8.33%). Live
counts and results remain database-derived rather than hardcoded in the UI.
