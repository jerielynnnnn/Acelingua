# Centered dashboard redesign

## Inspection and reuse

Checked git status before edits. Inspected the existing dashboard page/header/sidebar, roadmap loader and journey renderer, lesson player route, avatar library/renderer and local avatar files, World data/scenery, Shop loader, Supabase helpers, and existing schema/migration references. The screenshot mentioned in the request was not attached; this implementation follows the written layout and existing theme.

Reused `DashboardSidebar`, `JourneyRoadmap`, `UserAvatar`, `CountryScenery`, `loadRoadmap`, `loadLearnerAvatar`, and verified Shop item fields/price validation. The old dashboard header contained a link to an unimplemented achievement route; the redesigned header links to the real dashboard achievement panel instead. The profile menu opens the profile/avatar panel, customization, and logout. No decorative nonfunctional controls were added.

## Files

Modified: `app/dashboard/page.tsx` (thin page wrapper), `components/roadmap/JourneyRoadmap.tsx` (actual per-unit published completion counts).

Created: `components/dashboard/JourneyDashboard.tsx`, `components/dashboard/JourneyDashboard.module.css`, `lib/dashboard-overview.ts`, `tests/dashboard-overview.test.mjs`, this report.

## Data and behavior

- Desktop columns use approximately 22/54/24 proportions with independently stacked side cards. Tablet has two columns with the roadmap prominent. Mobile order is stats, language selector, roadmap, avatar, daily goal, Shop, achievements.
- The saved equipped avatar and owned catalog load through the existing avatar library. The same layers appear in the profile menu and at the current roadmap node. Missing setup shows available free starter layers and Create Avatar; incomplete onboarding metadata still resumes `/onboarding/continue`.
- Course selection is limited to authenticated active enrollment, published courses, and active languages. Its course ID is saved per learner in session storage. Existing `course_progress.last_accessed_at` is updated on switching; no progress fields, balances, enrollments, or curriculum are replaced. The most recently accessed course is the fallback when no valid session preference exists.
- `loadRoadmap` determines the next lesson using ordered published units/lessons and actual completed records. Continue Learning opens that lesson in its actual course. Historical completions cannot bypass earlier incomplete prerequisites. Once all published lessons are reviewed, the dashboard offers roadmap review without claiming the planned curriculum is finished.
- Profile counters use actual `profiles` values. Daily goals use the learner's existing goal record for the Manila calendar date. Missing records stay empty. Optional query failures do not fabricate totals or reset the roadmap.
- Shop highlights use actual active avatar items and prices, with missing-image fallback. Achievements use actual catalog and owned records; supported timestamp fields determine recent unlock ordering when present. View All expands real locked/unlocked catalog entries in the panel.
- No schema migration or SQL execution was needed. Existing auth/onboarding, lesson assessment, and reward code were not changed.

## XP threshold limitation

No consistent level threshold calculation was found in the repository's lesson/reward logic. The dashboard displays stored level and total XP and clearly leaves next-level targets unconfigured rather than inventing a percentage. A proposed rule for review is cumulative `100 × (level - 1)` XP at each level boundary. It has not been applied to profile levels or balances and should be reconciled with live database triggers before implementation.

## Verification and remaining checks

Dashboard overview, roadmap, avatar, and auth-onboarding tests were run: 35 passed. They cover learner-owned reads, real counters, recent-course selection, missing goals, optional errors, achievement ordering, roadmap locks, saved avatars, and onboarding regressions. Targeted ESLint and the production build passed before the final layout pass; final checks are recorded in the task response.

Live authenticated browser checks, visual desktop/tablet/mobile review, and the live schema/RLS installation state remain unverified. Achievement field names are read from returned catalog records without adding speculative columns. No recent-unlock timestamp is fabricated when absent. A separate full Profile or Achievements page is not added; dashboard controls open their actual in-page panels.
