# AceLingua course map

The dashboard renders `<CourseMap courseId={course.id} userId={user.id} />`.
`useCourseMap(courseId, userId)` returns `course`, `units`, flattened `lessons`,
`activeLesson`, `loading`, `error`, and `refresh`.

Open `/dashboard/map-preview` for six mock lessons spanning two units. Click
**Complete next lesson** (or the active card) to test unlocking and mascot movement;
**Reset** restores the initial state. Preview actions never write to Supabase.

Live lesson links use the existing dashboard convention `/learn/lesson/{id}`.
That route is not yet implemented in this repository. Pass `onLessonSelect` from
a client component to use a different lesson-opening flow.

The hook requires the normal `units.course_id` and `lessons.unit_id` foreign keys
for nested queries. Progress is queried separately, filtered by user and lesson IDs,
then joined in memory. Missing progress defaults to `not_started`. Enable Supabase
Realtime for `lesson_progress` to receive changes immediately; focus, visibility,
and manual refresh also fetch current progress. Database RLS remains responsible
for limiting which course and progress rows the signed-in user may read.

Run logic checks with `node --test components/course-map/courseMapUtils.test.mjs`.
