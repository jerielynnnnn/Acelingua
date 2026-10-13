# Implementation audit and Phase 1

Scope: the requested phased implementation starts with authentication, onboarding, language availability, safe enrollment, and redirects. This report separates implemented Phase 1 work from later work and live verification.

## Inspected

- Routes: landing, login, register, auth callback, dashboard, languages, learning introduction/player/course routes, onboarding language/languages/continue/course/confirmation, avatar/setup, and World routes.
- Libraries: Supabase client/server, auth onboarding, guest state/transfer, learning, roadmap, authenticated lessons, lesson session, avatar, World data/location configuration.
- Components: learner shell/sidebar/header, language catalog, lesson activities/player, roadmap, avatar customizer, World experience/map.
- Database evidence: existing migrations under `supabase/migrations/`, schema/RLS check scripts, Japanese restructuring scripts, avatar catalog draft, and associated test suites. Japanese restructuring was not changed.
- Filesystem assets: seven files currently under `public/avatar/`. The older seed draft references an eighth file, `shorthair.png`, which is absent. The draft also documents opaque layers; asset/catalog review belongs to Phase 3.

There is no live schema export or database administration connection available in this session. Repository references verify the columns used here, but they do not prove the live migrations or policies are installed. No SQL was executed.

## Already working

Supabase email/password and Google authentication, callback session exchange, local guest preview, avatar ownership/equipment checks, published curriculum ordering, sequential lesson locks, atomic first-completion reward RPCs, and read-only World visits are implemented. Their tests use database doubles; live authentication and SQL behavior remain to be verified.

## Phase 1 changes

- `/languages` now uses a shared catalog component and availability loader. It previously redirected guests away, had no search or playable-content checks, and sent Add Language to the nonexistent `/course` URL.
- Active languages and published courses/units/lessons come from Supabase. Search matches name, native name, or code. Cards show available courses and real owned published-lesson completion counts. Guest account counts are not fabricated.
- Preparation states cover no published course, no published first lesson, missing content, and assessment formats the existing player cannot handle. A guest preview requires real vocabulary currently exposed by guest RLS. Database access errors are displayed as errors, not preparation states.
- Start Learning validates fresh authentication, selected language/course publication, and introductory usability before enrolling. Existing enrollment/progress is retained with conflict-safe initialization; paused enrollments can resume. The chosen course ID survives incomplete direct onboarding.
- `/onboarding/language` reuses `/onboarding/languages`; the carousel now checks availability before offering Continue. Legacy course confirmation uses the same enrollment helper instead of an insert prone to duplicate enrollment.
- Existing learner navigation now includes Languages. Authenticated catalog pages reuse the learner shell; guests get public navigation.

New files: `components/languages/LanguageCatalog.tsx`, `lib/language-catalog.ts`, `tests/language-catalog.test.mjs`, this report.

Modified in Phase 1: `app/languages/page.tsx`, `app/onboarding/language/page.tsx`, `app/onboarding/languages/page.tsx`, `app/onboarding/course/page.tsx`, `app/onboarding/course/confirm/page.tsx`, `app/register/page.tsx`, `lib/transfer-preview.ts`, `lib/auth-onboarding.ts`, `components/dashboard/DashboardSidebar.tsx`, `components/dashboard/LearnerShell.tsx`, `tests/auth-onboarding.test.mjs`, `tests/guest-preview.test.mjs`.

Registration restores its continuation button after refresh. Email and Google guest signup retain the exact preview course ID, so authentication cannot silently switch a language with multiple courses to a different beginner course.

Tables used: languages, courses, units, lessons, vocabulary, activities, questions, user_courses, course_progress, lesson_progress, user_avatar_equipped. The reused shell reads profiles and user_achievements. No tables or schema fields were added in Phase 1.

## Remaining phases

2. Extend the shared lesson player and matching server assessment for fill-blank, listening, and speaking; display planned-vs-published course completion accurately. No fabricated questions or speaking scores.
3. Verify the live avatar catalog and real layer transparency/alignment. Prepare an asset-accurate seed only if needed; never execute it automatically.
4. Keep country visits read-only; share availability checks and show actual available courses at each destination.
5. Add profile/settings/achievement pages and integrate daily goals/streak history using verified live columns/policies. Missing schema evidence must be obtained before choosing fields or adding writes.
6. Live browser verification of registration/verification/OAuth, mobile layouts, microphone permissions, and SQL transaction/RLS behavior. Unit tests and builds cannot establish these outcomes.

## Manual database review

Existing pending SQL includes `supabase/migrations/202610130001_guest_preview_receipt.sql`, lesson completion/assessment RPC and ownership migrations, and `supabase/avatar-catalog-plan.sql`. Installation status is unknown. Review against the live database before applying; do not execute the avatar draft while it references absent/unreviewed assets. Phase 1 adds no migration.

Remaining course content is database-dependent. The catalog reports availability from returned rows; it does not assume the starter seed or planned Japanese lessons are present or publish any missing curriculum.

## Checks actually executed

- `node --test tests/*.test.mjs`: 73 tests passed, zero failures.
- Targeted ESLint on all Phase 1 TypeScript/TSX modules and associated tests: passed.
- `npm run build`: passed compilation, TypeScript checking, and generation of 23 pages.
- `git diff --check`: passed.

These checks cover catalog readiness, published-only counts, missing-content states, ownership filtering, enrollment retries, guest transfer, and existing roadmap/reward/avatar regressions. They do not verify live RLS installation, real email or OAuth redirects, visual mobile behavior, or live concurrent SQL requests. The existing Node module-type warning and Next.js outer lockfile warning remain informational.
