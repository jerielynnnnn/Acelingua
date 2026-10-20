// One account level per 100 total XP. Preserve any higher historical saved level.
export const XP_PER_LEVEL = 100;
export function levelProgress(xp: number, savedLevel = 1) {
  const totalXp = Math.max(0, Math.floor(xp));
  const level = Math.max(1, Math.floor(savedLevel), Math.floor(totalXp / XP_PER_LEVEL) + 1);
  const current = Math.max(0, Math.min(XP_PER_LEVEL, totalXp - (level - 1) * XP_PER_LEVEL));
  return { level, totalXp, current, required: XP_PER_LEVEL, remaining: level * XP_PER_LEVEL - totalXp };
}
