# Daily Missions and Streak Society — stages 1 and 2

## Latest requested change: fixed quests supersede customizable goals

See `FIXED-QUESTS-REVIEW.md` and the `202610200001` upgrade / `202610200002` fresh
proposal. These implement the newly requested fixed quest economy (including XP),
claim-first six-quest chest and shared weekly periods. They reuse this proposal's
mission/event/receipt tables. No SQL has been applied. Older economy and editable
goal recommendations below are historical context, not the current design.

## Subsequent UI implementation

The owner's newer Streak Society request explicitly authorized implementing features
that work with the existing schema before database approval. `/streak` and the dashboard
goal strip now have read-only existing-data integration. Optional reward/freeze/mission
features remain unavailable until the proposed migration is applied. The UI never calls
the mutating daily snapshot RPC merely to display a page. See `../STREAK-SOCIETY.md` for
files, capabilities, checks and remaining live verification. No migration has been run.

## Latest status: complete database proposal ready for approval

The owner supplied both the context schema and the live combined catalog audit.
The report is recorded in `daily-learning-audit.json` (catalog definitions only).

**Review only `proposals/202610190003_daily_learning_complete.sql` for application.**
It includes the schema foundation and the full integration. Do not run the older
`202610190002` foundation separately. Neither proposal has been applied.

The complete proposal adds 13 tables and the authenticated snapshot, preference,
daily claim and milestone claim RPCs. It keeps both passport triggers, the assessed
completion RPC, ordinary lesson rewards, the minigame and the store intact.
The single completion hook derives new events after first lesson completion and
updates the existing daily_goals, streak_history and profiles.streak transactionally.
Assessment-backed goal activities require at least 80% stored score; vocabulary-only
lessons with no assessment count as one activity. The separate lesson missions use
the existing server-validated lesson completion rules, including passport challenge guards.

Live findings:

- No legacy daily-goal, streak or achievement reward triggers were present in the
  audited tables. Only the two expected passport completion triggers were present.
- Profiles currently allow INSERT/UPDATE of all own fields, including role and balances.
  The proposal revokes table and per-column mutations, then restores only safe profile
  INSERT(id, username, display_name) and UPDATE(username, display_name). Existing defaults
  initialize protected fields; server functions retain their owner privileges.
- Broad TRUNCATE/TRIGGER/reference/write grants existed on progress and currency tables.
  The proposal removes these, enables RLS and keeps authenticated owner reads. Grant
  changes include daily_goals/streak_history/achievements so claims cannot be forged.
- The coin CHECK retains every audited existing type and adds daily_mission, daily_bonus,
  and streak_milestone. New coin ledger entries reference a unique reward receipt.

Day and streak handling:

- Server-generated windows use PostgreSQL IANA timezone rules with Asia/Manila fallback.
  Goal changes apply on the next window. Pending timezone changes apply only when a
  new local date advances beyond the existing date; dates/windows are never reopened.
  Applied timezone changes are limited to once per seven days.
- Existing goals/history are retained. Streak state initializes lazily from historical
  active days and profiles.streak; no historical mission rewards are created.
- If a nonzero legacy streak has no active-day history, its baseline is retained as
  unanchored, with a grace anchor of yesterday. This does not insert fabricated historical
  days. Milestone claims remain blocked until new qualifying learning anchors that state.
- Inventory starts at zero, capacity two. Only the service-role/admin grant function can
  issue freezes with an idempotency key; there is no client purchase or silent currency
  charge. Gaps before feature initialization cannot consume freezes retroactively.
- Freeze protection can reconcile on a snapshot or new completion; reconciliation never
  pays currency. Milestone claims are once per learner/day-threshold for life. Actual
  previously logged coins for an equivalent streak achievement offset the new coin reward.

**Economy approval points:** two verified mission types initially; the 50-coin/3-gem
bonus requires completing all assigned (initially two) missions. Vocabulary/culture
missions remain disabled. No extra XP and no initial free freezes are proposed.

Validation completed:

- `node scripts/test-daily-learning-schema.mjs`: passed foundation constraints and RLS.
- `node scripts/test-daily-learning-integration.mjs`: passed against tables/constraints
  recreated from the supplied audit, using the actual audited assessed completion RPC.
  Covers goal/streak updates, same-day deduplication, replay rewards, profile field
  permissions, private function execution denial, mission/bonus/milestone claims,
  preserved passport trigger execution, rollback on ledger failure, achievement coin
  offsets, freeze grant/use deduplication and missed-day breaks, legacy balances/history,
  23/25-hour DST boundaries, and future-day preferences/timezone cooldown.
- These tests run in isolated PGlite. Its requests are serialized; independent PostgreSQL
  connection races and live Supabase/browser behavior are not verified yet. The claim
  functions use a shared profile row lock plus unique receipts to serialize those races.

Next approval checkpoint: review and approve the complete proposal, apply that single
file to Supabase, and confirm successful application. The user explicitly required this
checkpoint before working UI/backend feature implementation. Then implement `/missions`,
`/streak`, dashboard/navigation integration, and run application/browser verification.

---

## Earlier stage notes (superseded where the latest status differs)

Status: code audit complete; live schema audit pending. Schema proposal tested in an
isolated PostgreSQL engine only. Nothing applied to Supabase. Feature implementation
continues after the schema is verified, the complete migration is approved, and its
application is confirmed, as requested in the specification.

## Existing implementation and evidence

| Area | Evidence | Finding |
| --- | --- | --- |
| First lesson rewards | `migrations/202610060005_assessed_lesson_completion.sql` | `acelingua_complete_assessed_lesson` validates stored questions, records server-graded answers, completes eligible activities, increments profiles, inserts XP/coin transactions, and updates lesson progress in one transaction. It serializes by learner/course and skips replay rewards. |
| Lesson access | `migrations/202610180007_country_learning_security.sql` | Country arrival, enrollment, publication and sequential lesson locks are checked server-side. Destination challenges require 80% correct. Passport trigger runs in the completion transaction. Preserve these guards and stamp triggers. Installation status requires live audit. |
| Frontend completion | `lib/authenticated-lesson.ts`, `components/learning/` | Shared player calls completion RPC. It must remain the source of completion, with no client mission counters. |
| Minigame | `migrations/202610180004_minigame_rewards.sql` | Profile lock, server board validation, session completion and unique learner/UTC-date receipt. Awards 20 coins and 2 gems; does not currently use currency ledgers. Exclude from language learning missions/streaks. |
| Shop | `migrations/202610180003_store_supplies.sql` | Offer validation, balance lock and learner/request receipt deduplicate purchases. Existing offers support hearts and gems only. No silent freeze purchase or offer type changes. |
| Writing | `migrations/202610180001_writing_studio.sql` | `record_writing_practice` accepts client success/tracing flags; handwriting is not graded. Not eligible for reward missions or authoritative streaks. |
| Dashboard | `lib/dashboard-overview.ts` | Existing daily_goals read uses target_activities, completed_activities, is_completed and goal_date. Date currently comes from the browser with Asia/Manila hardcoded. Replace this date decision with the server daily snapshot after approval. |
| Streak UI | `components/dashboard/DashboardHeader.tsx`, `JourneyDashboard.tsx` | Displays profiles.streak; no audited repository streak writer. Header streak is currently not a link. |
| Navigation | `components/dashboard/DashboardSidebar.tsx` | Dashboard, Learn, World, Avatar, Passport and Store. No existing missions or streak entries. |
| Mascot | `public/icons/ace-chatbot.png`, `public/logoace.png` | Reuse existing artwork and original navy/sky/coral/yellow styling, with accessible animations respecting reduced motion. |

The owner subsequently supplied a context-only table export. Confirmed fields:

- daily_goals: user_id, goal_date, target_activities, completed_activities,
  is_completed, completed_at, created_at, updated_at, and UUID primary key.
- streak_history: user_id, activity_date, activities_completed, is_active,
  created_at, updated_at, and UUID primary key. No freeze field is present.
- profiles: existing nonnegative xp, coins, gems and streak balances; no timezone field.
- achievements: requirement_type includes streak, with requirement_value and optional
  XP/coin rewards. user_achievements uses unlocked_at.
- coin_transactions: transaction_type currently allows lesson, activity, quiz,
  speaking, conversation, mini_game, achievement, daily_goal and purchase.
  The final migration must retain these and add daily_mission, daily_bonus and
  streak_milestone to the existing CHECK. Do not overload daily_goal.
- xp_transactions: positive-only amounts and the existing source_type CHECK.
  No XP expansion is needed because the proposed new rewards contain no XP.

The export intentionally omits secondary indexes, RLS policies, grants and trigger
definitions. It therefore does not establish unique(user_id,goal_date),
unique(user_id,activity_date), unique(user_id,achievement_id), or the existing
completion functions' required unique progress keys. Verify the actual indexes and
existing duplicates before adding uniqueness; never delete history to force a key.
In particular, legacy goal/streak writers, protected profile update grants,
and possible achievement reward triggers must be checked before modifying them.
The owner subsequently provided the live index result: unique learner/date keys
exist on daily_goals and streak_history; learner/lesson and learner/activity keys
exist on progress tables; and learner/achievement is unique on user_achievements.
These keys can be reused without deduplicating or deleting history. Transaction
ledgers only show primary-key uniqueness, so new reward receipts must enforce
business-level idempotency. Trigger, function and permission sections are still pending.
Do not infer a live installation from comments such as "NOT APPLIED" in old files.

## Files for review

- `audit-daily-learning.sql`: read-only catalog inspection of all requested tables,
  columns, constraints, policies, indexes, function bodies, triggers and grants.
  No user rows, emails, secrets or tokens are selected.
- `proposals/202610190002_daily_learning.sql`: additive schema foundation. It lives
  outside migrations intentionally, so deployment tools cannot apply it prematurely.
  It does not yet contain the completion hooks, claims RPCs or legacy-schema changes.
- `../scripts/test-daily-learning-schema.mjs`: isolated PostgreSQL schema and access tests.

## Proposed data model

Catalog tables: daily_mission_definitions and streak_milestone_definitions.
Private tables: user_daily_goal_preferences, user_learning_days,
verified_learning_events, user_daily_missions, daily_reward_claims,
streak_freeze_inventory, streak_freeze_grants, streak_freeze_uses,
streak_milestone_claims, and gem_transactions.

The existing profiles balances, daily_goals and streak_history remain authoritative;
these tables are not replacements for them. The new gem table is a ledger, not a
second gem balance. Exact writes to legacy tables are pending their actual schema.
Mission snapshots freeze each day's targets and rewards. Composite foreign keys
prevent a claim/event/ledger entry from referring to another learner's data.
Authenticated users have SELECT only, constrained by owner RLS. Anonymous access is
revoked. No new authenticated mutation RPCs exist in the proposal yet.

## Economy and eligibility decisions for approval

- First Steps: 1 lifetime-first lesson completion on this day, 15 coins.
- Daily Champion: 3 distinct lifetime-first lesson completions on this day, 30 coins + 1 gem.
- Vocabulary Explorer and Culture Explorer: defined but disabled. Existing acknowledgements
  and generic multiple-choice answers cannot verify ten distinct vocabulary recalls or
  meaningful cultural learning. Merely opening a scene never counts.
- Bonus: 50 coins + 3 gems after completing all missions assigned for that day. Initially
  that means the two enabled missions. The UI must say "all available missions", not
  promise four missions. Mission enablement changes affect future days only.
- No new XP reward is proposed. Normal lesson XP remains unchanged.
- Goal presets: 1/3/5/8 eligible activities. A first-completed server-assessed activity
  can count once; acknowledged text-only/listening-only steps do not qualify. For a
  vocabulary-only lesson with no assessed activities, its first lesson completion is
  one qualifying activity. Do not count both the lesson and its assessed activities.
- A qualifying activity day or eligible first lesson completion maintains the global streak.
  Replay learning remains available, but cannot farm mission, goal or streak progress.
- Freezes: capacity 2, initial inventory 0. No currency charge and no automatic free
  replenishment. Grants need a stable administrative/store receipt and atomic inventory
  increment. Shop integration is future work. Freeze eligibility starts at feature
  cutover, never on arbitrary historical gaps. Consume only enough to bridge the gap
  if inventory covers it; otherwise break the streak without wasting freezes.
- Milestones: 3/7/14/30/60/100/365 days and the requested coin/gem values; one claim per
  learner per milestone, for life. Legacy achievement awards must be inspected before
  finalizing overlap policy. Do not create an independently rewarding duplicate achievement.

## Atomic integration to finalize after live audit

1. Keep the existing completion entry points and passport validation. Add trusted hooks
   only to eligible first completions, with identity/auth checks and server timestamps.
   Never expose an RPC accepting client-authored reward/event/success values.
2. Use a consistent per-learner profile row lock for day initialization, streak reconciliation,
   freeze use and reward claims. Preserve existing course-scoped lesson locks. Claim RPCs
   must not acquire course locks after the profile lock. Validate event-source eligibility
   and return on duplicate source IDs before incrementing any counters.
3. Use database now(), PostgreSQL IANA timezone conversion and next-local-midnight conversion.
   Default timezone: Asia/Manila, matching current app behavior. Do not add 24 hours: DST
   days vary. Daily responses include server_now and resets_at.
4. Snapshot timezone/goal settings for an already-open day. New goal settings apply next day.
   Timezone changes are scheduled at a server-defined boundary, never rewrite prior dates
   or create overlapping reward windows. Do not expose unrestricted timezone updates.
5. Preserve valid legacy completed days and legitimate streak baselines. Audit the legacy
   history date/timezone fields before backfill. Do not fabricate historical events or
   retroactively issue mission rewards. A dry-run report must identify ambiguous legacy
   streak data instead of resetting it silently.
6. Claim checks must recompute progress from verified events, insert a unique receipt,
   update profiles.coins/gems and append ledgers in the same transaction. Extend the
   actual coin_transactions CHECK/enum minimally after inspecting its definition. Never
   label mission rewards as lesson rewards merely to bypass the constraint.
7. Deny direct writes to protected profile balances/streaks and legacy goal/history/event
   tables. Inspect existing profile grants first; preserve editable username/avatar fields
   using column-specific grants or narrow RPCs. RLS alone cannot protect individual columns.
8. Snapshot/streak reconciliation may update bookkeeping and consume earned freezes;
   opening a page must not award coins, gems, XP or milestone payouts.

## Remaining work after review and application

Finalize legacy schema integration, tested claim/snapshot/preference/completion functions
and history backfill dry run. Obtain approval of the complete migration, then confirmation
it was applied. Build `/missions`, `/streak`, compact dashboard previews, goal settings,
clickable header streak and nonduplicate navigation entries. Keep roadmap, passport,
boarding passes, shop, avatar and country selection unchanged. No friends leaderboard.

Validation must cover real concurrent connections for claim races, duplicate completion,
cross-course activity, UTC/local midnight, DST, timezone changes, historical preservation,
freeze consumption, milestone overlap, atomic rollback and existing passport triggers.
Then run TypeScript, lint and production build, plus browser/mobile checks.

## Tests actually run for this stage

`node scripts/test-daily-learning-schema.mjs`: passed schema creation, IANA timezone
validation, disabled unverified mission types, verified-event uniqueness, cross-owner
foreign keys, bonus/milestone uniqueness, freeze capacity, owner-only SELECT and denied
direct writes in an isolated PGlite PostgreSQL engine.

These are schema tests, not proof that live reward claims, concurrent transactions,
legacy triggers or the future feature UI work. No application files or existing database
tables were changed in this stage, and no Supabase migration was executed.
