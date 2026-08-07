import { saveManager } from '../save/SaveManager';
import { ACHIEVEMENT_DATA } from './AchievementData';
import { economyManager } from './EconomyManager';
import { globalBus } from '../utils/EventBus';

/**
 * Sweeps all achievement definitions against current save state. Call after
 * any event that could complete one (race finished, level up, car
 * purchased...). Cheap enough (≈20 predicates) to just run wholesale rather
 * than wiring bespoke triggers per achievement.
 */
export class AchievementManager {
  checkAll(): string[] {
    const state = saveManager.getState();
    const unlockedNow: string[] = [];
    for (const def of ACHIEVEMENT_DATA) {
      if (state.achievements.unlockedIds.includes(def.id)) continue;
      if (def.check(state)) {
        saveManager.mutate((d) => {
          d.achievements.unlockedIds.push(def.id);
        });
        economyManager.addCoins(def.rewardCoins);
        globalBus.emit('achievement-unlocked', { id: def.id, title: def.title });
        unlockedNow.push(def.id);
      }
    }
    return unlockedNow;
  }

  isUnlocked(id: string): boolean {
    return saveManager.getState().achievements.unlockedIds.includes(id);
  }
}

export const achievementManager = new AchievementManager();
