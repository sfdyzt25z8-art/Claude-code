import { saveManager } from '../save/SaveManager';
import { globalBus } from '../utils/EventBus';
import { MAX_PLAYER_LEVEL, xpForLevel } from '../utils/Constants';

export interface RaceRewardInput {
  position: number; // 1-based finishing position
  racerCount: number;
  driftScore: number;
  cleanDriving: boolean; // no crashes
  raceTimeSeconds: number;
  targetTimeSeconds: number;
  stuntScore: number;
  difficultyMultiplier: number;
  mode: 'career' | 'quick' | 'timeTrial' | 'drift' | 'checkpoint' | 'endless' | 'elimination' | 'tournament' | 'policeChase';
}

export interface RaceReward {
  coins: number;
  xp: number;
  trophies: number;
  breakdown: { label: string; coins: number; xp: number }[];
}

/**
 * Handles all coin/XP/trophy transactions and derives race payouts from
 * performance. Progression (level curve) lives here too since XP flows
 * through the same pipeline.
 */
export class EconomyManager {
  addCoins(amount: number): void {
    if (amount === 0) return;
    saveManager.mutate((d) => {
      d.profile.coins += amount;
      if (amount > 0) d.statistics.totalCoinsEarned += amount;
    });
    globalBus.emit('coins-changed', { amount, total: saveManager.getState().profile.coins });
  }

  spendCoins(amount: number): boolean {
    const state = saveManager.getState();
    if (state.profile.coins < amount) return false;
    saveManager.mutate((d) => {
      d.profile.coins -= amount;
    });
    globalBus.emit('coins-changed', { amount: -amount, total: saveManager.getState().profile.coins });
    return true;
  }

  addXp(amount: number): { leveledUp: boolean; newLevel: number; levelsGained: number } {
    if (amount <= 0) return { leveledUp: false, newLevel: saveManager.getState().profile.level, levelsGained: 0 };
    let leveledUp = false;
    let levelsGained = 0;
    saveManager.mutate((d) => {
      d.profile.xp += amount;
      d.statistics.totalXpEarned += amount;
      while (d.profile.level < MAX_PLAYER_LEVEL && d.profile.xp >= xpForLevel(d.profile.level)) {
        d.profile.xp -= xpForLevel(d.profile.level);
        d.profile.level += 1;
        leveledUp = true;
        levelsGained += 1;
      }
      if (d.profile.level >= MAX_PLAYER_LEVEL) d.profile.xp = 0;
    });
    const newLevel = saveManager.getState().profile.level;
    globalBus.emit('xp-changed', { amount, total: newLevel, leveledUp, level: newLevel });
    return { leveledUp, newLevel, levelsGained };
  }

  addTrophies(amount: number): void {
    if (amount === 0) return;
    saveManager.mutate((d) => {
      d.profile.trophies = Math.max(0, d.profile.trophies + amount);
    });
  }

  computeRaceReward(input: RaceRewardInput): RaceReward {
    const breakdown: RaceReward['breakdown'] = [];
    const posFactor = Math.max(0, (input.racerCount - input.position + 1) / input.racerCount);

    const positionCoins = Math.round(120 * posFactor * input.difficultyMultiplier);
    const positionXp = Math.round(80 * posFactor * input.difficultyMultiplier);
    breakdown.push({ label: `Finished P${input.position}`, coins: positionCoins, xp: positionXp });

    let coins = positionCoins;
    let xp = positionXp;

    if (input.driftScore > 0) {
      const driftCoins = Math.round(input.driftScore * 0.06);
      const driftXp = Math.round(input.driftScore * 0.04);
      coins += driftCoins;
      xp += driftXp;
      breakdown.push({ label: 'Drift score', coins: driftCoins, xp: driftXp });
    }

    if (input.cleanDriving) {
      coins += 60;
      xp += 40;
      breakdown.push({ label: 'Clean driving bonus', coins: 60, xp: 40 });
    }

    if (input.targetTimeSeconds > 0 && input.raceTimeSeconds > 0 && input.raceTimeSeconds <= input.targetTimeSeconds) {
      const timeCoins = 90;
      const timeXp = 60;
      coins += timeCoins;
      xp += timeXp;
      breakdown.push({ label: 'Beat target time', coins: timeCoins, xp: timeXp });
    }

    if (input.stuntScore > 0) {
      const stuntCoins = Math.round(input.stuntScore * 0.08);
      const stuntXp = Math.round(input.stuntScore * 0.05);
      coins += stuntCoins;
      xp += stuntXp;
      breakdown.push({ label: 'Stunt bonus', coins: stuntCoins, xp: stuntXp });
    }

    const trophies = input.position === 1 ? Math.round(3 * input.difficultyMultiplier) : input.position <= 3 ? 1 : 0;

    saveManager.mutate((d) => {
      d.statistics.totalRaces += 1;
      if (input.position === 1) d.statistics.wins += 1;
      else d.statistics.losses += 1;
      if (input.cleanDriving) d.statistics.cleanRaces += 1;
      d.statistics.driftDistanceMeters += input.driftScore > 0 ? Math.round(input.driftScore / 10) : 0;
      d.statistics.stuntScore += input.stuntScore;
    });

    this.addCoins(coins);
    this.addXp(xp);
    if (trophies > 0) this.addTrophies(trophies);

    return { coins, xp, trophies, breakdown };
  }
}

export const economyManager = new EconomyManager();
