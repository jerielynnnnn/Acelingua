export type Award = { id: string; name: string; description: string | null; requirement_type: string; requirement_value: number; xp_reward: number; coin_reward: number; progress: number | null; unlocked_at: string | null };
export type AwardSnapshot = { awards: Award[]; claiming_available: boolean };
export function awardProgress(type: string, counts: Record<string, number>): number | null {
  return Object.prototype.hasOwnProperty.call(counts, type) ? counts[type] : null;
}
export function awardState(award: Award): "unlocked" | "ready" | "locked" {
  return award.unlocked_at ? "unlocked" : award.progress !== null && award.progress >= award.requirement_value ? "ready" : "locked";
}
