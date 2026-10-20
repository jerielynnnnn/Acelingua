# Fixed Daily Learning Quests

The owner's installation report confirms foundation_installed and fixed_quests_installed
are true, all four fixed-quest columns exist, and the installed completion hook records
correct answers and >=90% assessed lesson events. The existing passport triggers remain.
The report is recorded in `supabase/fixed-quest-installation-report.json`. Do not rerun
the fresh or upgrade proposals against this installed database.

## Implemented

- `/missions`: fixed daily quest board, actual progress/rewards, explicit Claim Reward
  actions, persisted Claimed states, six-claim treasure chest and weekly challenges.
- Dashboard: **Daily Learning Quests**, daily completed/ready counts, claimed-reward chest
  progress, and a `/missions` shortcut. No customizable targets, quest types or rewards.
- Sidebar/mobile navigation: one quests entry alongside Streak Society.
- Existing streak preview links to quests and excludes weekly assignments from its daily
  progress count. Streak changes still come from learning, not reward claims.
- Existing achievements, streak milestones and passport stamps are linked rather than
  creating another achievement reward implementation.

## Created files

- `app/missions/page.tsx`
- `app/api/missions/route.ts`
- `lib/quests.ts`
- `components/missions/QuestBoard.tsx`, `QuestCountdown.tsx`, `useQuests.ts`, `Quests.module.css`
- `tests/quests.test.mjs`
- This report and the saved installation report.

## Modified files

- `components/dashboard/DashboardDailyGoal.tsx`: replaced editable goal UI with quest summary.
- `components/dashboard/DashboardSidebar.tsx`, `LearnerShell.tsx`: quest navigation.
- `components/dashboard/JourneyDashboard.tsx`: refresh actual profile balances on claim events.
- `components/streak/StreakSociety.tsx`, `lib/streak-data.ts`: fixed daily quest preview/link.
- `app/api/daily-goal/route.ts`: legacy GET remains read-only; POST rejects edits with HTTP 405.
- `lib/daily-goal.ts`: reports settings unavailable rather than offering mutable goals.
- `tests/streak.test.mjs`: updated assertions for fixed-target behavior.

## Server integration and security

GET `/api/missions` verifies the session and calls the installed
`acelingua_fixed_quests_snapshot` RPC. It initializes assignments but never grants rewards.
POST verifies authentication and same-origin requests, accepts only a UUID missionId
(or null for the chest), and calls `acelingua_claim_daily_reward`. Client reward amounts,
progress or extra properties are rejected. Actual amounts come from the RPC response.

The installed SQL owns validation, locking, receipts, currency balances and ledgers.
Duplicate responses grant zero and preserve Claimed semantics. Failed requests never
show fake success. If a claim succeeds but the following snapshot refresh fails, the UI
reports the recorded payout accurately and retries progress loading separately.

Both the board and dashboard use the same snapshot contract. Headers refresh through
the existing balance-updated event. Midnight timers and countdowns use server timestamps
and monotonic elapsed time; the browser clock cannot choose the reward date. Focus and
day-boundary refreshes reload current progress. Request timeouts, authentication redirects,
retry/loading/error states and reduced-motion styles are included.

The six currently activated quests are the approved supported definitions installed in
the database. Unsupported vocabulary-only, cultural and self-reported writing variants
are not displayed as active quests. Earlier two-quest day snapshots remain historical;
the complete fixed set starts on the next new day for those existing assignments.

## SQL and verification

No additional migration is required for this implementation. No SQL was applied by
the agent and no live learner reward was claimed during testing.

- `node --test tests/*.test.mjs`: 142 passed.
- `node scripts/test-fixed-learning-quests.mjs --fresh`: passed the actual SQL/assessment
  integration suite in isolated PostgreSQL, including exact accuracy, XP/coin/gem rewards,
  claim-first chest, duplicate/replay protection, rollback and daily/weekly resets.
- Targeted ESLint: passed. TypeScript and `npm.cmd run build`: passed, including
  `/missions` and `/api/missions` route generation.
- Server render tests cover the quest board and dashboard without editable goal controls.
- Local HTTP `/api/missions` without a session returns 401.
- Local HTTP `/missions` returns 200 and renders the authenticated learner shell.

The SQL engine tests serialize requests; independent live-connection races have not been
exercised. Signed-in browser verification of live user progress, real reward claiming,
and desktop/mobile visuals remains necessary.

## URLs

- http://localhost:3000/missions
- http://localhost:3000/dashboard
- http://localhost:3000/streak
