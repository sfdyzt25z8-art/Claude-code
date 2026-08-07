import { saveManager } from '../save/SaveManager';
import { economyManager } from '../economy/EconomyManager';
import { getSlotDefinition, createDefaultCustomization } from './CustomizationData';
import type { CustomizationSlot, CustomizationState } from './CustomizationTypes';

function ownedKey(carId: string, slot: CustomizationSlot): string {
  return `${carId}__${slot}`;
}

/** Handles per-car cosmetic loadouts: paint, decals, wheels, spoiler, neon, etc. */
export class CustomizationManager {
  getState(carId: string): CustomizationState {
    return saveManager.getState().garage.customization[carId] ?? createDefaultCustomization();
  }

  isOptionOwned(carId: string, slot: CustomizationSlot, optionId: string): boolean {
    const def = getSlotDefinition(slot);
    const option = def?.options.find((o) => o.id === optionId);
    if (!option) return false;
    if (option.price === 0) return true;
    return this.getOwnedOptionIds(carId, slot).includes(optionId);
  }

  private getOwnedOptionIds(carId: string, slot: CustomizationSlot): string[] {
    return saveManager.getState().garage.ownedCustomizationOptions[ownedKey(carId, slot)] ?? [];
  }

  purchaseAndApply(carId: string, slot: CustomizationSlot, optionId: string): { success: boolean; message: string } {
    const def = getSlotDefinition(slot);
    const option = def?.options.find((o) => o.id === optionId);
    if (!def || !option) return { success: false, message: 'Unknown option' };

    const alreadyOwned = this.isOptionOwned(carId, slot, optionId);
    if (!alreadyOwned) {
      const spent = economyManager.spendCoins(option.price);
      if (!spent) return { success: false, message: 'Not enough coins' };
      saveManager.mutate((d) => {
        const key = ownedKey(carId, slot);
        if (!d.garage.ownedCustomizationOptions[key]) d.garage.ownedCustomizationOptions[key] = [];
        d.garage.ownedCustomizationOptions[key].push(optionId);
      });
    }

    saveManager.mutate((d) => {
      if (!d.garage.customization[carId]) d.garage.customization[carId] = createDefaultCustomization();
      d.garage.customization[carId][slot] = optionId;
    });
    return { success: true, message: `${def.label} set to ${option.label}` };
  }
}

export const customizationManager = new CustomizationManager();
