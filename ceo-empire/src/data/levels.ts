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

export interface LevelUnlock {
  level: number;
  description: string;
}

export const LEVEL_UNLOCKS: LevelUnlock[] = [
  { level: 1, description: 'Lemonade Stand & Coffee Shop unlocked' },
  { level: 2, description: 'Bakery, Manager hires, and stock investing unlocked' },
  { level: 3, description: 'Clothing Store, real estate, and marketing hires unlocked' },
  { level: 4, description: 'Restaurant, Developers, and crypto investing unlocked' },
  { level: 5, description: 'Tech Startup and startup investing unlocked' },
  { level: 6, description: 'Game Studio unlocked' },
  { level: 7, description: 'Software Company unlocked' },
  { level: 9, description: 'Airline unlocked' },
  { level: 11, description: 'Car Company unlocked — the top tier' },
];
