# Achievement collection

Open `/achievements` while signed in. The header trophy, sidebar and mobile Awards
link open the collection. Badges show saved progress, a requirement, reward details,
and locked, eligible or unlocked state. Existing earned awards remain visible.
The page and GET endpoint do not unlock awards or grant rewards.

## Database activation

`supabase/proposals/202610200003_achievements.sql` is proposed and NOT APPLIED.
It seeds nine original awards into the existing catalog and adds a server-checked
collection function. Review this file before applying it in Supabase SQL Editor.
Until activated, the page displays existing catalog/progress without offering claims.
An empty catalog shows an explicit preparation message rather than sample awards.

The proposal uses the installed user/achievement unique key and profile row lock.
It checks actual saved progress, inserts one ownership receipt, updates balances,
and records XP/coins in the existing ledgers in one transaction. Duplicate claims
return zero. A ledger failure rolls back ownership and balances. Streak awards have
no currency rewards so the starter catalog does not duplicate Streak Society payouts.
An existing achievement trigger stops installation for review.

Supported progress: distinct completed lessons, completed activities, XP, saved
streaks, quizzes, and speaking activities. Other catalog types show progress unavailable
and cannot be collected here. Practice counts represent saved completions, not replays.
Writing awards are deferred until trusted writing assessment exists.

Collection is explicit: reach requirement → open badge → Collect award. It does not
depend on mission claims. Existing earned rows are never paid again or rewritten.
The proposal does not change the application's existing level calculation.

Validation: targeted ESLint, TypeScript, and `node scripts/test-achievements.mjs`.
Live Supabase installation, simultaneous connection races, and signed-in browser
verification are separate from local integration checks.
