import type { GameState } from '@/types/game';
import { ACHIEVEMENT_DEFINITIONS } from '@/data/achievements';

export interface AchievementCheckResult {
  newly: string[];
  xpGained: number;
}

export function checkNewAchievements(state: GameState, netWorth: number): AchievementCheckResult {
  const unlocked = new Set(state.achievementsUnlocked);
  const newly: string[] = [];
  let xpGained = 0;
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (unlocked.has(def.id)) continue;
    if (def.check(state, netWorth)) {
      newly.push(def.id);
      xpGained += def.xpReward;
    }
  }
  return { newly, xpGained };
}
