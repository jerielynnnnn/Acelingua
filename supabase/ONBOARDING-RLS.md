# Onboarding enrollment RLS

The continuation route gets the user through `supabase.auth.getUser()` and writes
that user's ID to `user_courses` and `course_progress`. It never accepts a user ID
from browser storage. No profile access, completed lesson progress, XP, or coins
are involved in this continuation.

No local migration currently defines learner write policies for these two tables.
The live policy definitions have not been inspected, so a missing INSERT grant or
a restrictive policy are possible causes of the reported RLS rejection.

Use the Supabase SQL Editor in this order:

1. Run `check-onboarding-rls.sql`. Review the table columns, policies, permissions,
   triggers, and unique indexes. Both tables must already support uniqueness on
   `(user_id, course_id)` for the application's conflict handling. Do not create
   indexes or change unrelated policies without reviewing the results first.
2. Review and run only `migrations/202610060001_onboarding_owned_records_rls.sql`.
   It enables RLS and adds missing SELECT, INSERT, and UPDATE ownership policies
   for `authenticated`. It skips equivalent existing policies and refuses to
   overwrite a conflicting policy name. Restrictive ownership guards protect
   API users from broad existing permissive policies. These guards also deny
   anonymous access and constrain existing authenticated DELETE policies to
   owned rows; they do not grant DELETE access. Existing administrator policies
   under the `authenticated` role will also be constrained to owned rows, so
   review any intentional administrator access before applying this migration.
   Existing restrictive policies remain in effect and may still need review.
3. Run `check-onboarding-rls.sql` again to confirm RLS and the resulting policies.
4. Run `tests/onboarding-rls.sql` with two existing test accounts with profiles.
   It exercises real authenticated ownership checks and duplicate prevention,
   then rolls back all test writes. If the script fails, end the failed
   transaction with `ROLLBACK` before running another script.
5. Sign in normally and retry `/onboarding/continue`. Confirm exactly one owned
   enrollment and course-progress record for the selected course, then refresh
   and verify the counts remain one. New learner progress starts at zero.

The SQL security test does not verify the real browser session, OAuth, or avatar
routing. Those require an authenticated browser check. The continuation targets
`/avatar/setup` when no avatar is equipped; that page is not implemented yet.

Do not rerun curriculum seeds to fix this issue. Do not disable RLS or introduce
service-role credentials into the app. No migration or SQL validation has been
executed remotely by the coding agent.
