/** XP required to advance FROM the given level to the next one. */
export function xpForNextLevel(level: number): number {
  return Math.round(250 * Math.pow(level, 1.55));
}

export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  totalXp: number;
}

/** Derives level + progress-within-level from a cumulative XP total. */
export function levelProgressFromXp(totalXp: number): LevelProgress {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
    if (level > 200) break;
  }
  return {
    level,
    currentLevelXp: remaining,
    xpToNextLevel: xpForNextLevel(level),
    totalXp,
  };
}
