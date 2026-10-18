export type StrokeData = { viewBox: string; paths: { d: string; x: number }[]; source: string; revision: string };
export type WritingSystem = { id: string; language: string; slug: string; name: string; description: string; display_order: number };
export type WritingCharacter = {
  id: string; writing_system_id: string; slug: string; character: string; romanization: string;
  meaning: string | null; group: string; example_word: string | null; example_translation: string | null;
  note: string | null; display_order: number; stroke_count: number | null; stroke_data: StrokeData | null; audio_url: string | null;
};
export type CharacterProgress = {
  character_id: string; status: "learning" | "learned" | "mastered"; practice_count: number;
  mastery_score: number; last_practiced_at: string | null; mastered_at: string | null;
};

export function safeWritingReturn(value: string | null, course: string | null) {
  if (value && !/[\\\r\n]/.test(value) && /^\/(dashboard|learn)(\?|$)/.test(value)) return value;
  return course ? `/learn?course=${encodeURIComponent(course)}` : "/dashboard";
}

export function writingSummary(characters: WritingCharacter[], progress: CharacterProgress[]) {
  const ids = new Set(characters.map(character => character.id));
  const rows = progress.filter(row => ids.has(row.character_id));
  return { learned: rows.filter(row => row.status !== "learning").length,
    mastery: characters.length ? Math.round(rows.reduce((sum, row) => sum + row.mastery_score, 0) / characters.length) : 0 };
}
