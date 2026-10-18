/** Display only: planned levels never create or publish empty courses. */
export const curriculumLevels = [
  { key: "beginner", label: "Beginner", reference: "A1-inspired" },
  { key: "elementary", label: "Elementary", reference: "A2-inspired" },
  { key: "intermediate", label: "Intermediate", reference: "B1-inspired" },
  { key: "upper intermediate", label: "Upper Intermediate", reference: "B2-inspired" },
] as const;
export function describeCourseLevel(level: string, languageCode: string) {
  const normalized = level.trim().toLowerCase().replaceAll("_", " ").replaceAll("-", " ");
  const entry = curriculumLevels.find(item => item.key === normalized);
  if (!entry) return level;
  return ["ja", "ko", "zh", "th"].includes(languageCode) ? `${entry.label} · practical communication` : `${entry.label} · ${entry.reference}`;
}
