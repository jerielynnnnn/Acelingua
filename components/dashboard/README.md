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

Generated with the built-in imagegen tool. Final web asset:
`public/dashboard/japan-adventure.jpg` (about 597 KB).
The original PNG is retained at `public/dashboard/japan-adventure.png`.

Prompt:

Use case: stylized-concept. Asset type: background artwork for an AceLingua language-learning dashboard adventure map. Create a beautiful polished cozy anime game illustration of a miniature Japanese landscape viewed from an elevated isometric angle, vertical 2:3 composition. Winding turquoise river through green islands, cherry blossom trees, small red torii gate and traditional pagoda buildings, tiny wooden bridges, distant soft blue mountains, a little train at the lower left, warm spring daylight. Rich painterly detail but uncluttered center with broad open grassy and river regions for interactive lesson markers added later in HTML. Pastel sky blue, jade green, pink sakura and cream. Full bleed illustration, no borders, no labels, absolutely no text, no UI, no character portraits, no pre-drawn lesson nodes or buttons.
