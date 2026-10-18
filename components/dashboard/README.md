# Dashboard design

The dashboard follows the supplied reference: a pale blue app frame, slim icon
navigation, compact stats, navy welcome banner, skills panel, scenic lesson map,
daily goals, and a compact course panel. Ace is a CSS cat mascot. Mobile layouts
stack the panels and provide a keyboard-accessible navigation drawer.

Visit `/dashboard/design-preview` to inspect sample data without signing in.
The preview completion and reset buttons only change local state. `/dashboard`
uses the authenticated learner's Supabase profile, enrollment, language, daily
goal, and lesson progress. The map and course panel share the same progress data.
Skills buttons locate the current lesson; separate skill exercises are not yet
implemented. Shop, profile, and lesson destinations follow the existing route
conventions; those pages still need implementation in this repository. XP uses
the existing dashboard convention of 1,000 XP per level. Untracked gems, learned
word totals, and reward amounts are omitted rather than displayed as live stats.

## Artwork

The dashboard roadmap banner uses the supplied images in public/dashboard:
- Japanese: japan.jpg
- French: france.jpg
- German: germany.jpg
- Spanish: spain.jpg
- Chinese: china.jpg
- Thai: thai.jpg
- Korean: korea.jpg

Other languages use CountryScenery until matching artwork is available.
