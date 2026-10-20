# Lesson experience and account levels

Expression advancement now requires a matching completed speech-recognition result.
The Next expression / Try it out / Finish lesson button is disabled until the current
expression matches; the handler also enforces that check. Each new expression starts
locked. Starting a retry or receiving an error clears verification. Recording audio
alone does not qualify as a correct response. This is a lesson-player interaction
check, not a new server-side pronunciation assessment or reward verification path.

Latest speaking refinement: removed typed practice. Completed recognition attempts
that differ show the expected phrase, its reading guide, and highlighted differences
against the transcript. These are recognized-word corrections, not phonetic scoring.
The recording remains available for comparison. Sentence examples identical to the
expression (ignoring punctuation and spacing) are hidden; distinct examples retain
their translation and one compact listen control.

Listening and speaking update: pronunciation and sentence translations are shown
without customization toggles. Audio chooses a matching language voice automatically,
with Listen/Stop and normal/slow playback. Speaking is visible, starts recognition
directly from the user's click, shows live recognized text, and offers Done speaking
to return a result or Cancel to discard it. Starting audio cancels microphone capture;
starting microphone capture stops playback. Typed practice is a separate fallback.
Feedback checks transcript words, not pronunciation accuracy. Browser recognition
support, microphone permission and installed language voices remain device dependent.

Speaking practice now also captures a short microphone recording for local playback.
After Done speaking or recognition completion, the actual audio clip appears under
Your voice recording. It can be replayed against the lesson audio. Cancel discards
the clip; retrying replaces it. The microphone is released on finish/error/unmount,
and object URLs are revoked on replacement/unmount. Clips are not saved to the
account or uploaded by the app. Recording-only practice is available when a browser
supports MediaRecorder but does not offer speech recognition. Capture is capped at
30 seconds; recognition uses its existing timeout. Typed responses never create audio.

The authenticated lesson route uses a themed lesson introduction, expression cards,
sentence context, optional speaking practice, focused activities and a saved result.
The reward display uses the existing level-up and coins PNG icons. Matching practice
on the result screen is optional rather than part of the completion path.

The session progress bar and account XP bar have separate labels. Account progress
uses 100 XP per level: level 1 starts at 0, level 2 at 100, level 3 at 200.
Any higher historical saved level is preserved; XP is never fabricated or lowered.
The same component displays account XP progress on the dashboard and lesson screens.
Completion reads the updated profile; refresh failures do not undo a saved lesson.
Assessment, lesson locking, one-time rewards and completion RPCs remain authoritative.

Database persistence is prepared in
`supabase/proposals/202610200004_xp_levels.sql` and has NOT been applied.
Review before application. It synchronizes levels on every profile XP update,
including lesson, mission and achievement rewards, without editing those RPCs.
It also raises existing levels to the XP-derived floor without reducing higher levels.
Until applied, the UI derives the level from saved XP but the stored level can lag.

Validation: level boundary unit tests, isolated PostgreSQL trigger checks,
targeted lint, TypeScript and production build. Signed-in visual verification and
live database application must be done separately.
