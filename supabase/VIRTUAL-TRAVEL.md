# Virtual travel — Stage 1 proposal

Country curriculum/roadmap implementation, new unapplied migrations and current
rollout/testing details: see [COUNTRY-ADVENTURE.md](COUNTRY-ADVENTURE.md).

Status update: implementation of the first working milestone is authorized.
Live REST checks confirmed all ten Stage 1 tables exist (private tables deny
anonymous access as expected). The passport RPC is absent: Supabase returned
PGRST202 for `acelingua_ensure_travel_passport`. Follow-up migration
`202610180006_travel_arrival.sql` is prepared but NOT applied. Existing uncommitted
work is preserved. The sections below retain the original Stage 1 audit/design.

## First milestone setup and testing

The application now includes `/passport`, persistent passport/boarding server
actions, equipped avatar rendering, country stamps, sidebar/mobile links, and
an optional boarding/arrival panel above the existing `/world/[languageCode]`
content. Update: the country lesson view now renders only after the server ticket
has status `arrived`. The World Hub offers Visit Country before learning, and
travel setup errors retain the gate with Retry and Return to World controls.
The previous direct destination/lesson bypass link has been removed. This gates
the country visit flow; existing dashboard/library lesson routes are preserved.
Arrival Skip saves the same server-validated arrival as Continue.
Returning learners enter directly, with boarding history and Replay controls.
Arrival stamps give no XP/coins and never modify lesson progress.

Required database setup (no SQL has been executed by the agent):

1. Open the Supabase project matching `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
2. Open SQL Editor and create a new query. Stage 1 tables already exist; do NOT
   rerun `202610180005_virtual_travel.sql` (its CREATE statements are not rerunnable).
3. Paste the complete `supabase/migrations/202610180006_travel_arrival.sql` file
   and run it once as the project database administrator. It is transactional and
   adds four authenticated-only RPCs, country-language associations and arrival
   definitions. It does not reset existing learning records or balances.
4. Confirm the query succeeds. If it fails, keep the complete error and do not
   partially execute or manually remove statements. This file is an unapplied
   migration, not intended to be run twice.
5. Restart the local dev server if needed (`npm.cmd run dev`) and sign in.
6. Open `http://localhost:3000/passport`, then `http://localhost:3000/world/fr`.
   Confirm your profile name/avatar, click Board Flight, collect the arrival stamp,
   and reopen `/passport`. France Arrival should be unlocked exactly once.
7. Reopen `/world/fr`: existing destination opens directly. Replay must not add
   tickets, visits or stamps. Check mobile width and reduced-motion preference.

If this project is managed with a linked Supabase CLI migration history instead
of SQL Editor, have the owner apply only the pending approved migration through
their normal workflow; do not blindly push older local migration files.

`supabase/tests/virtual-travel.sql` is a rollback-only integration test for an
approved test database with two test profiles. It has not been executed. Live
authenticated browser behavior remains unverified until migration 006 is applied.
Unit/country completion stamp awarding and curated cultural journal unlocks
remain future stages; the first milestone supports first-arrival stamps.

Local validation on 2026-10-18: TypeScript (`npx.cmd tsc --noEmit`), targeted ESLint
for every changed application file, and production build passed. Build generated
`/passport`. Root application lint found existing issues in `app/page.tsx`,
`app/about/page.tsx`, and `app/onboarding/profile/page.tsx` (four errors and one
warning). These unrelated files were preserved. The unscoped repository lint
was stopped after continuing without output; root application directories were
checked explicitly. No database migration or integration test was executed.

## Audit of the actual workspace

| Area | Existing implementation | Integration plan |
| --- | --- | --- |
| Next.js | Root `app/`, Next 16.3.4; separate nested `acelingua/` also exists | Work in root app; do not rebuild nested copy. Read installed Next docs before application changes. |
| Dashboard | `app/dashboard/page.tsx`, `components/dashboard/JourneyDashboard.tsx` | Preserve dashboard and its data loading. |
| Navigation and authentication | `components/dashboard/LearnerShell.tsx`, `DashboardSidebar.tsx`, `DashboardHeader.tsx` | Reuse authenticated shell, add Passport link later, including mobile navigation. Shell uses `auth.getUser()`. |
| World routes | `app/world/page.tsx`, `app/world/[languageCode]/page.tsx`, `app/world/layout.tsx` | `/world/fr` already resolves through dynamic route; keep all existing URLs. |
| World and destination UI | `components/world/WorldExperience.tsx`, `WorldMap.tsx`, `CountryLearningStage.tsx`, `DestinationDiscovery.tsx` | Current country view is an arrival/learning stage, not a separate France map component. Preserve it, its course links, and hub map. Add optional travel presentation around it. |
| World data | `lib/world/data.ts`, `languageLocations.ts`, `country-discoveries.ts` | Current locations and discovery content keyed by language. Country codes must be independent: Japan = `jp`, Japanese = `ja`; Korea = `kr`, Korean = `ko`. Existing discoveries use user-scoped localStorage, not authoritative travel records. |
| Language selection | `app/languages/page.tsx`, `components/languages/LanguageCatalog.tsx`, `app/onboarding/languages/page.tsx`, `lib/language-catalog.ts`, `lib/auth-onboarding.ts` | Preserve enrollment and course selection. Visiting a country must not silently enroll the learner. |
| Supabase clients | `lib/supabase/client.ts`, `lib/supabase/server.ts` | Reuse publishable-key clients and authenticated RPCs. Server client already awaits `cookies()`. |
| Profiles | `lib/dashboard-overview.ts`, `components/dashboard/LearnerShell.tsx` | Reuse display_name/username fallback; persist ticket name at issuance. |
| Avatar | `lib/avatar.ts`, `components/avatar/UserAvatar.tsx` | Reuse equipped layers from user_avatar_equipped + avatar_items; existing categories are base/face/hair/clothes. No parallel avatar system. |
| Lessons and roadmap | `lib/roadmap.ts`, `lib/authenticated-lesson.ts`, `components/learning/AuthenticatedLessonPlayer.tsx`, `components/roadmap/JourneyRoadmap.tsx`, `CourseRoadmap.tsx` | Preserve completion and lesson access; refresh eligible stamps after successful assessed completion and when opening passport. |
| Rewards | `lib/dashboard-overview.ts`; migrations `202610060003_authenticated_lesson_completion.sql`, `202610060005_assessed_lesson_completion.sql` | Existing achievements/user_achievements and XP/coin ledgers remain authoritative for their rewards. Travel stamps grant no additional XP or coins by default. |
| Other recent features | `app/writing/`, `lib/writing/`, migrations `202610180001`–`202610180004` | Preserve Writing Studio, supplies, and minigames; next migration is `202610180005`. |
| Types and database history | Handwritten types in domain libraries; SQL migrations and inspection scripts under `supabase/` | No generated Database type file found in the root app. Add travel domain types later; do not pretend local migrations prove remote schema state. |

Audit is based on local source and migration history, not a connected live database.
The repository does not contain a complete baseline schema. Existing referenced
UUID keys (`languages.id`, `units.id`, auth users) need confirmation before applying.

## Proposed migration

Read `migrations/202610180005_virtual_travel.sql` for the complete SQL.

Ten new tables:

- `travel_countries`: country catalog; inactive entries hidden publicly.
- `travel_country_languages`: many-to-many country/language associations.
- `travel_country_units`: explicitly curated destination curriculum and required units.
- `travel_passports`: one fictional persistent passport per authenticated learner.
- `travel_boarding_passes`: persistent identity/name/destination snapshots and trip lifecycle.
- `travel_visits`: one summary per learner/country; records introduction completion.
- `passport_stamp_definitions`: arrival, unit completion, country completion requirements.
- `user_passport_stamps`: deduplicated earned collection.
- `travel_journal_catalog`: trusted unlockable content, inaccessible to learners directly.
- `travel_journal_entries`: private, deduplicated unlocked content snapshots.

No seed rows: do not invent curriculum IDs, Paris Bakery units, or unavailable
stamp assets. Nullable image paths allow a CSS stamp fallback until assets exist.
Country configuration and real-ID mappings belong to Stage 2; arrival and reward
definitions are curated in the later stages. No generic requirement_reference
UUID: typed country_id/unit_id foreign keys express the supported requirements.

Every table enables RLS. Private rows have owner-only SELECT; public definitions
have filtered SELECT. Learners and anonymous clients have no INSERT/UPDATE/DELETE
privileges. Definitions are managed through trusted service operations, with
no policy trusting a user-editable profile role. Service keys never enter browser
code. Auth deletion cascades private records; catalog dependencies restrict
deletion to preserve history. Unique constraints enforce one passport, one active
trip per learner/destination, and one earned copy of each stamp/journal entry.

This schema is intentionally inert until validated RPCs are implemented in their
approved stages. SQL defaults generate fictional ACE-P / ACE-T identifiers only
when trusted writes occur; there is no automatic account trigger or backfill.

## Required RPC contracts for subsequent stages

All exposed functions derive owner from `auth.uid()`, reject null authentication,
use a fixed empty search_path with qualified relations, revoke PUBLIC/anon
execution, and grant only the necessary authenticated execution. Never accept
user_id, passenger name, completion flags, reward values, or client ticket details.

- Ensure passport: insert-on-conflict for authenticated owner; return existing row.
- Ensure boarding pass(country): validate active country and selected supported
  language; read profile name server-side, generate fictional flight/seat once,
  lock per learner/country and reuse issued/boarded ticket. Returning visitors
  enter directly; a new ticket is issued only for an explicit new trip.
- Board(ticket): lock ticket and verify ownership; only issued -> boarded.
- Finish arrival(ticket): only boarded -> arrived; update visits and increment
  count exactly once per ticket, mark introduction complete, insert arrival stamp
  on conflict do nothing. Retry/replay cannot increment counts or duplicate stamps.
  Skip finishes the introductory experience through this same server transition;
  it never completes lessons or cultural challenges.
- Refresh stamps(country): validate active definitions and published curriculum;
  unit award requires at least one published lesson and every such lesson
  completed for current user. Country award requires a nonempty curated required
  unit set, every required unit complete, and eligible course enrollment. Validate
  unit-course-language relationships against country-language associations.
  Use protected lesson_progress, not client-maintained course_progress percentages;
  course_progress may be read for display/cross-checking, never as sole evidence.
  Empty or unpublished curriculum must fail closed. Insert awards idempotently.
- Journal unlocks: copy trusted catalog snapshots only after validating the linked
  arrival/unit/challenge requirement; never accept arbitrary client content or
  treat a postcard click as evidence of a completed assessed cultural challenge.

Before reward implementation, verify actual database ACLs and policies:
`202610060003` intends RPC-only lesson writes; course_progress remains owner-writable
under onboarding migration. Legacy `lib/guest-onboarding.ts` also contains direct
progress writes and must not become a stamp-claim authority. Do not weaken RLS to
make legacy calls succeed. Existing completion RPC grades stored questions but
does not require a passing score; stamps should follow existing completion
semantics unless the product explicitly changes them.

## Proposed file structure after approval

Create incrementally (none of these application files exist yet):

```text
lib/travel/
  countries.ts           # country codes, route aliases, greeting/culture configuration
  types.ts               # domain records and RPC response types
  client.ts              # authenticated reads and RPC calls using existing client
components/travel/
  BoardingPass.tsx
  ArrivalExperience.tsx
  TravelPassport.tsx
  PassportStamp.tsx
  TravelJournal.tsx
  Travel.module.css      # responsive visuals and reduced-motion overrides
app/passport/
  page.tsx               # existing LearnerShell and passport view
supabase/migrations/
  <later>_travel_identity_rpcs.sql
  <later>_travel_arrival_rpcs.sql
  <later>_travel_stamp_rewards.sql
supabase/tests/
  virtual-travel.sql     # transactional ownership, forgery, retry and award scenarios
```

Modify later: `WorldExperience.tsx`, `CountryLearningStage.tsx`,
`DashboardSidebar.tsx`, `LearnerShell.tsx`, and eligible unit cards in the existing
roadmap components. Assess `AuthenticatedLessonPlayer.tsx` for post-completion
refresh only; preserve its existing assessed RPC and rewards. Keep `/world/fr`,
`/world/ja`, `/world/ko`, lessons, dashboard, and onboarding navigation working.

## Verification boundaries

Stage 1 is SQL/design only; no browser scenarios can be exercised yet. Before
application, review actual constraints/policies with existing read-only inspection
scripts and validate SQL in an approved disposable Supabase/Postgres database.
Do not run migrations or SQL tests against the user's database without approval.
Later test concurrent ticket creation, arrival retries, cross-user attacks,
direct-write denial, empty curricula, unit/country completion, logout/login,
mobile layout, reduced motion and preserved lesson access, then run lint,
TypeScript and build checks for application changes.
