import { saveManager } from '../save/SaveManager';
import { economyManager } from '../economy/EconomyManager';
import { getUpgradeDefinition, createStockUpgradeState } from './UpgradeData';
import type { CarUpgradeState, UpgradeCategory } from './UpgradeTypes';

export class UpgradeManager {
  getState(carId: string): CarUpgradeState {
    return saveManager.getState().garage.upgrades[carId] ?? createStockUpgradeState();
  }

  getNextTierCost(carId: string, category: UpgradeCategory): number | null {
    const def = getUpgradeDefinition(category);
    const level = this.getState(carId)[category] ?? 0;
    if (level >= def.maxLevel) return null;
    return def.tiers[level].cost;
  }

  purchaseUpgrade(carId: string, category: UpgradeCategory): { success: boolean; message: string } {
    const def = getUpgradeDefinition(category);
    const currentLevel = this.getState(carId)[category] ?? 0;
    if (currentLevel >= def.maxLevel) return { success: false, message: 'Already at max level' };

    const cost = def.tiers[currentLevel].cost;
    const spent = economyManager.spendCoins(cost);
    if (!spent) return { success: false, message: 'Not enough coins' };

    saveManager.mutate((d) => {
      if (!d.garage.upgrades[carId]) d.garage.upgrades[carId] = createStockUpgradeState();
      d.garage.upgrades[carId][category] = currentLevel + 1;
    });
    return { success: true, message: `${def.label} upgraded to level ${currentLevel + 1}` };
  }

  getTotalUpgradeLevel(carId: string): number {
    const state = this.getState(carId);
    return Object.values(state).reduce((sum, v) => sum + v, 0);
  }
}

export const upgradeManager = new UpgradeManager();
