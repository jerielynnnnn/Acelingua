# Streak Society and dashboard daily goals

Update: the owner confirmed fixed-quest database installation. Editable goal controls
have now been replaced by Daily Learning Quests and `/missions` is implemented. See
`DAILY-QUESTS.md` for the current behavior; editable-goal/pending-missions descriptions
below refer to the earlier implementation stage.

Implemented routes:

- `http://localhost:3000/streak`
- `http://localhost:3000/dashboard`

Sign in first. The streak route checks the server session; the dashboard retains its
existing authenticated flow. No service-role credentials are used.

## Added

- `app/streak/page.tsx`, `loading.tsx`, `error.tsx`, `actions.ts`: authenticated server
  page, loading/retry states, and a thin adapter to the existing proposed milestone RPC.
- `components/streak/StreakSociety.tsx`, `StreakCalendar.tsx`, `StreakDateRefresh.tsx`,
  `StreakRetry.tsx`, `StreakSociety.module.css`: original Ace hero, recorded statistics,
  accessible monthly calendar/day details, badges, freeze/goal/mission previews, and
  server-derived midnight refresh. Animations respect reduced motion.
- `lib/streak.ts`, `lib/streak-data.ts`: pure calendar/timezone utilities and owner-scoped,
  paginated Supabase reads. Opening `/streak` does not write progress, reconcile counters,
  consume freezes, initialize reward days, or grant currency.
- `components/dashboard/DashboardDailyGoal.tsx`, `lib/daily-goal.ts`,
  `app/api/daily-goal/route.ts`: prominent dashboard goal strip with real progress,
  server-local dates, retry states and future-day goal preferences when activated.
- `tests/streak.test.mjs`: calendar, data-access, render, timezone, optional-feature and
  goal-endpoint tests.

## Modified

- `components/dashboard/DashboardHeader.tsx`: flame links to `/streak`.
- `components/dashboard/DashboardSidebar.tsx`: one Streak Society item; scrollable
  navigation prevents the extra item from clipping on shorter screens.
- `components/dashboard/LearnerShell.tsx`: mobile streak shortcut.
- `components/dashboard/JourneyDashboard.tsx` and its stylesheet: goal strip above the
  welcome banner; removed the duplicate side-panel goal card. Other dashboard systems
  remain in place.

## Existing schema versus optional migration

The base page and existing daily goal display require no migration. They read profiles,
streak_history, daily_goals, completed lesson/activity records and XP transactions.
Day details describe first saved completions, not every replay. Historical timestamps
are grouped in the learner's configured timezone (Asia/Manila fallback).

The hero uses the real saved profiles.streak. The page does not repair stale legacy
counts by writing on view. If saved counts and recent history disagree, it explains
that discrepancy and preserves the saved value. Longest streak is the maximum of
recorded contiguous practice/protection history, the saved streak and any installed
streak-state record. History is not backfilled or deleted.

The already-proposed complete migration remains at
`supabase/proposals/202610190003_daily_learning_complete.sql`. It has not been executed
by this work. Freeze inventory/use, new milestone rewards, verified mission counts and
goal preference writes depend on that migration's tables and RPCs. Until activated,
the UI labels them unavailable and never displays sample balances or fake success.
An installed table with no inventory/state row is also treated as uninitialized.

Goal settings call `acelingua_set_daily_preferences` rather than writing goals directly.
The selection applies to the next learning day and never rewrites historical targets.
Opening the dashboard alone does not create or complete a goal. Automatic new goal
creation/progress tracking depends on the proposed trusted database completion hook.

There is no `/missions` route yet. The streak page shows mission counts only when real
assignment and verified event rows exist; it does not link to a nonexistent page or
implement separate mission reward logic.

## Verification

- `node --test tests/*.test.mjs`: 134 tests passed, including 12 new streak/goal tests.
- Targeted ESLint: passed for all added/modified TypeScript and streak tests.
- TypeScript: passed, with production build also checking types.
- Server-render tests successfully render the complete streak view/calendar using
  loaded test data and verify no fake freeze inventory or claims are shown.
- Local HTTP `/streak` request without cookies: verified streamed redirect to login.
- `npm.cmd run build`: passed, including `/streak` and `/api/daily-goal` route generation.

The test suite uses database doubles for page reads. A signed-in browser session and
live user-data/visual/mobile verification are still needed. No actual reward email,
currency claim, freeze grant, migration application or user history write was performed.
