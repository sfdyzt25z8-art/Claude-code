import { saveManager } from '../save/SaveManager';
import { CAR_DATA, getCarById } from '../cars/CarData';
import { TRACK_DATA } from '../tracks/TrackData';
import type { UnlockRequirement } from '../cars/CarTypes';
import { economyManager } from './EconomyManager';
import { createStockUpgradeState } from '../upgrades/UpgradeData';
import { createDefaultCustomization } from '../customization/CustomizationData';

export interface UnlockEligibility {
  eligible: boolean;
  reason: string;
}

/**
 * Answers "is X unlocked / can the player unlock X" questions for cars and
 * tracks, and performs the actual purchase/unlock transaction.
 */
export class ProgressionManager {
  isCarOwned(carId: string): boolean {
    return saveManager.getState().garage.ownedCarIds.includes(carId);
  }

  checkCarEligibility(carId: string): UnlockEligibility {
    const car = getCarById(carId);
    if (!car) return { eligible: false, reason: 'Unknown car' };
    return this.checkRequirement(car.unlock);
  }

  private checkRequirement(req: UnlockRequirement): UnlockEligibility {
    const state = saveManager.getState();
    switch (req.type) {
      case 'default':
        return { eligible: true, reason: 'Available from the start' };
      case 'level':
        return state.profile.level >= req.level
          ? { eligible: true, reason: `Unlocked at level ${req.level}` }
          : { eligible: false, reason: `Reach level ${req.level} (currently ${state.profile.level})` };
      case 'coins':
        return { eligible: true, reason: `Costs ${req.amount} coins` };
      case 'trophies':
        return state.profile.trophies >= req.amount
          ? { eligible: true, reason: `Unlocked with ${req.amount} trophies` }
          : { eligible: false, reason: `Earn ${req.amount} trophies (currently ${state.profile.trophies})` };
      case 'career-event':
        return { eligible: false, reason: 'Complete the related career event' };
      case 'achievement':
        return state.achievements.unlockedIds.includes(req.achievementId)
          ? { eligible: true, reason: 'Unlocked via achievement' }
          : { eligible: false, reason: 'Unlock the related achievement' };
    }
  }

  purchaseCar(carId: string): { success: boolean; message: string } {
    const car = getCarById(carId);
    if (!car) return { success: false, message: 'Unknown car' };
    if (this.isCarOwned(carId)) return { success: false, message: 'Already owned' };

    const eligibility = this.checkCarEligibility(carId);
    if (!eligibility.eligible) return { success: false, message: eligibility.reason };

    if (car.price > 0) {
      const spent = economyManager.spendCoins(car.price);
      if (!spent) return { success: false, message: 'Not enough coins' };
    }

    saveManager.mutate((d) => {
      d.garage.ownedCarIds.push(carId);
      d.garage.upgrades[carId] = createStockUpgradeState();
      d.garage.customization[carId] = createDefaultCustomization();
    });
    return { success: true, message: `${car.manufacturer} ${car.name} unlocked!` };
  }

  isTrackUnlocked(trackId: string): boolean {
    return saveManager.getState().unlockedTrackIds.includes(trackId);
  }

  /** Tracks unlock automatically by player level; call after every level-up. */
  syncTrackUnlocks(): string[] {
    const state = saveManager.getState();
    const newlyUnlocked: string[] = [];
    saveManager.mutate((d) => {
      for (const track of TRACK_DATA) {
        if (!d.unlockedTrackIds.includes(track.id) && state.profile.level >= track.unlockLevel) {
          d.unlockedTrackIds.push(track.id);
          newlyUnlocked.push(track.id);
        }
      }
    });
    return newlyUnlocked;
  }

  getOwnedCars() {
    const owned = saveManager.getState().garage.ownedCarIds;
    return CAR_DATA.filter((c) => owned.includes(c.id));
  }

  getUnlockedTracks() {
    const unlocked = saveManager.getState().unlockedTrackIds;
    return TRACK_DATA.filter((t) => unlocked.includes(t.id));
  }
}

export const progressionManager = new ProgressionManager();
