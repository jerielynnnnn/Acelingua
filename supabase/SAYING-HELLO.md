# Saying Hello assessment

No migration in this task has been applied by the coding agent. Apply:

1. `202610060003_authenticated_lesson_completion.sql` if not already applied.
2. `202610060004_saying_hello_questions.sql`.
3. `202610060005_assessed_lesson_completion.sql`.

The question seed first verifies the exact lesson, Unit 4 parent, six existing
activity IDs/types/orders and five vocabulary rows. It checks questions under
all Japanese lessons (including unpublished lessons), similarly named lessons,
greeting prompts associated elsewhere and missing activity parents. Unexpected
existing content aborts the transaction BEFORE inserts; report that error and
inspect associations. The checks are conservative and may also flag legitimate
greeting questions in other lessons. Matching rows from this seed permit safe
reruns; mismatched rows are never overwritten. Question IDs use the existing
database default, options are JSONB string arrays, answers are stored text.

Eight questions are planned, two per vocabulary/grammar/conversation/quiz
activity: six multiple choice, one true/false and one English translation. All
phrases/meanings/options come from the five existing vocabulary records. No new
courses, units, lessons, activities or vocabulary are created or changed.

Listening has no audio and no questions: the player explicitly skips this
unavailable step, excludes it from scoring and does not mark its progress
completed. Speaking is instructional aloud practice, with no audio reference or
AI scoring. Other instructional screens do not count as questions.

The player requires the learner to traverse teaching/instructions and attempt
every question, giving feedback without requiring perfect accuracy. The server
requires all question IDs exactly once, validates stored options, grades actual
answers, validates instructional acknowledgments, and returns the authoritative
score. Incorrect answers still allow completion. Question history is deduplicated
by learner/lesson/attempt/question; instructional/assessed activity progress is
saved upon successful lesson completion. No rows are created by viewing a step.

The original completion RPC remains available as a compatibility wrapper. Both
vocabulary-only and assessed lessons now share one atomic reward implementation.
It preserves course locking, prerequisite checks, first-completion-only rewards
and recalculated course progress. No hearts are deducted. Retry/replay cannot
award the standard lesson reward again.

The Unit label already used `unit_order` in the previous source; no hardcoded
Unit 1 was found. The loader now explicitly fetches the requested lesson's parent
unit metadata, including its ID and order, for the heading. A regression test
asserts Unit 4. The roadmap uses each rendered lesson's own UUID in its link.
An old server/browser state could explain the reported label, but this cannot
be established without the authenticated browser. No database ordering changed.

Unit 4 is not the initial course lesson. If the first six published lessons are
not completed, Saying Hello remains LOCKED. Never alter progress to bypass this.
After an eligible first completion, `Introducing Yourself` becomes the next
current lesson if it remains incomplete; existing completions may move the
current node further along. Course percentage always comes from actual records.

After applying the migrations, test the current learner in the browser and run
`tests/saying-hello-assessment.sql` with their auth UUID if desired. It rolls back
test writes and requires existing prerequisites to be satisfied. Live database
execution and authenticated browser testing remain pending.
