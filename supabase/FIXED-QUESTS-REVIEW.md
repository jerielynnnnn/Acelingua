# Fixed Daily Learning Quests — database approval

## Confirmed installed; UI implementation added

The owner's subsequent installation report confirms the foundation and fixed quests
are already installed, including the upgraded completion hook. The fresh-install guard
was rejecting a duplicate installation, not identifying a need to remove protections.
Do not rerun either installation path below against this database. The quests UI,
dashboard replacement and authenticated RPC adapter are now implemented; see
`../DAILY-QUESTS.md`. The earlier approval-stage notes below remain historical context.

Status: proposed SQL implemented and tested locally; not approved or applied to Supabase.
This supersedes the previous editable daily-goal UI/economy plan. The existing mission
tables and balance fields are reused; no parallel quest system is introduced.

## Choose exactly one installation path

1. **If proposal 003 has not been applied:** review and apply only
   `proposals/202610200002_fixed_learning_quests_fresh.sql`. This combines the foundation
   and the fixed-quest upgrade in one transaction. Do not apply the old foundation first.
2. **If proposal 003 is already installed:** review and apply only
   `proposals/202610200001_fixed_learning_quests.sql`. This is an additive upgrade.

Do not run both paths. These are migration scripts, not repeatable seeds. An error rolls
back the selected file's transaction. Both paths retain existing goals/history/balances;
the upgrade also preserves assigned mission reward snapshots and previous claims.

## Proposed fixed catalog

| Daily quest | Requirement | XP | Coins | Gems |
| --- | --- | --- | --- | --- |
| First Step | First completion of 1 distinct language lesson | 15 | 10 | 0 |
| Answer Explorer | 10 distinct correct server-graded questions | 20 | 15 | 0 |
| Perfect Practice | First completion of an assessed lesson at >=90% | 25 | 20 | 0 |
| Dedicated Learner | First completions of 3 distinct lessons | 40 | 30 | 1 |
| Steady Practice | First completions of 2 distinct lessons | 20 | 15 | 0 |
| Knowledge Builder | 5 distinct correct server-graded questions | 20 | 15 | 0 |
| Treasure Chest | All six daily quest rewards claimed | 100 | 75 | 3 |

The request permits temporarily replacing unsupported quests. Answer Explorer replaces
Word Collector until the live curriculum consistently identifies graded vocabulary
questions. Culture Explorer and Writing Explorer are replaced by Steady Practice and
Knowledge Builder. Their requested original definitions/rewards remain disabled in the
catalog. No learner is told a general quiz was cultural or a self-reported trace was
verified writing.

The trusted hook does record vocabulary events when an explicitly vocabulary-typed
activity contains correctly graded questions. This supports future activation after
checking the available curriculum; opening vocabulary cards does not qualify.

Weekly rewards were not priced in the request. The following are **proposed for approval**:

| Weekly quest | Requirement | XP | Coins | Gems |
| --- | --- | --- | --- | --- |
| Weekly Adventurer | 10 distinct first lesson completions | 100 | 75 | 1 |
| Weekly Knowledge | 100 distinct correct server-graded answers | 150 | 100 | 2 |

No weekly writing/culture rewards are active. One-time milestones continue to use
existing achievements/streak milestone claims and passport stamps. A normalized
`learning_challenge_catalog` view presents daily/weekly missions alongside existing
achievements; it creates no second achievement payout path.

## Security and preservation

- Add XP columns to existing definitions/snapshots/claim receipts, cadence and period
  bounds to existing missions, and a unique learner/definition/period key. No second
  balances and no replacement of the existing daily_goals table.
- Keep all existing transaction-type values and add explicit quest/weekly values to
  XP/coin CHECK constraints. New unique ledger indexes cover quest receipts.
- Claim RPC accepts only a mission ID (or null for the daily chest). Requirements,
  targets, currency amounts and progress never come from the client.
- One profile row lock serializes initialization and claims; unique receipts/ledger
  keys provide independent deduplication. XP, coins, gems, receipts and ledgers commit
  together. Failure in any ledger rolls back the whole payout.
- Exact >=90% accuracy uses stored questions and the current attempt's server-graded
  answers, not client scores or rounded percentages. Correct answers produce one
  lifetime event per learner/question; replaying a completed lesson cannot farm events.
- Existing passport guards and ordinary lesson rewards remain unchanged.
- Claims never increment streaks. The existing trusted completion hook maintains
  streaks independently. Viewing the quest board initializes period snapshots only;
  it never awards XP/coins/gems or consumes a freeze.
- Revoke the old target-setting RPC from learners. Protect achievement definitions
  with read-only authenticated RLS as well as the already-protected mission catalogs.
  The upcoming UI removes all editable goal controls and the goal-setting POST endpoint.
- Use server timestamps, existing IANA timezone preference and Asia/Manila fallback.
  Daily periods follow the existing server-defined windows. Weekly periods are Monday
  through Sunday in that timezone. Snapshots return daily and weekly reset timestamps.
- No historical events or rewards are fabricated. Existing assigned days retain their
  original quest names/rewards; new fixed quests appear on the next new server-defined
  day. Existing unclaimed days with fewer than six assigned quests cannot claim the new
  six-quest chest. Already paid bonuses are preserved. New learners receive six immediately.
- No migration or user data write has been executed against Supabase.

## Tests actually run

`node scripts/test-fixed-learning-quests.mjs --fresh` tests a single-transaction fresh
installation; `node scripts/test-fixed-learning-quests.mjs` tests upgrading the existing
proposal, including preservation of legacy balances/reward receipts.

Both use tables/constraints recreated from the supplied live audit and the actual
audited assessed-completion RPC. Tests passed for:

- Six fixed daily quests and two weekly assignments, with zero automatic quest rewards.
- 80% failing the Perfect Practice threshold and exactly 90% passing it.
- Distinct correct-answer tracking and assessed-lesson completion events.
- Claim-first treasure requirements; completed-but-unclaimed quests do not unlock it.
- Actual XP, coin and gem amounts; matching ledgers and duplicate-claim denial.
- Full rollback of balances/claim receipt on a failed XP ledger write.
- Replay protection, daily reset, weekly reset, weekly assignment deduplication.
- Read-only mission definitions and denial of the former goal customization RPC.
- Streak count unchanged by claims; legacy quest prices/claims/balances retained.

The isolated PGlite engine serializes requests. These tests do not establish behavior
under independent live PostgreSQL connections or browser/mobile rendering. Those checks
remain for deployment/feature integration, along with TypeScript, lint and production build.

## Next stage after approval and successful SQL application

Implement `/missions` with server-verified progress, claim buttons, actual reward feedback,
the six-claim chest, server-based countdown, weekly cards and existing achievement links.
Replace the dashboard strip with **Daily Learning Quests**: completion count, ready rewards,
chest progress and `/missions` link. Remove editable goal UI/API, retain historical data,
and connect the streak preview to the same snapshots. Then run application, reward and
regression checks. The owner's request explicitly requires this database checkpoint
before continuing implementation.
