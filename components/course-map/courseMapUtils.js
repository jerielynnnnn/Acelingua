// Pure helpers shared by the live hook and the mock preview.
export function flattenCourseLessons(units, progress = []) {
  const statuses = new Map(progress.map((row) => [row.lesson_id, row.status]));
  const lessons = [...units]
    .sort((a, b) => a.unit_order - b.unit_order || a.id.localeCompare(b.id))
    .flatMap((unit) => [...(unit.lessons ?? [])]
      .sort((a, b) => a.lesson_order - b.lesson_order || a.id.localeCompare(b.id))
      .map((lesson) => ({ ...lesson, unitTitle: unit.title, unitOrder: unit.unit_order,
        status: statuses.get(lesson.id) ?? "not_started" })));
  return lessons.map((lesson, index) => ({ ...lesson, sequence: index + 1,
    isUnlocked: index === 0 || lessons[index - 1].status === "completed" }));
}

export function getActiveLesson(lessons) {
  return lessons.find((lesson) => lesson.isUnlocked && lesson.status !== "completed") ?? null;
}

export function getMapCoordinates(lessons) {
  return lessons.map((lesson, index) => ({ ...lesson, x: index % 2 === 0 ? 25 : 75, y: 130 + index * 180 }));
}

export function buildMapPath(points) {
  if (!points.length) return "";
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const midpoint = (previous.y + point.y) / 2;
    return `${path} C ${previous.x} ${midpoint}, ${point.x} ${midpoint}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
}
