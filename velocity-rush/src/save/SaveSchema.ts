import type { CarUpgradeState } from '../upgrades/UpgradeTypes';
import type { CustomizationState } from '../customization/CustomizationTypes';
import { createStockUpgradeState } from '../upgrades/UpgradeData';
import { createDefaultCustomization } from '../customization/CustomizationData';
import { getDefaultCarId } from '../cars/CarData';
import { getDefaultTrackId } from '../tracks/TrackData';

export interface RaceRecord {
  bestLapTime: number | null;
  bestTotalTime: number | null;
}

export interface PlayerStatistics {
  wins: number;
  losses: number;
  totalRaces: number;
  driftDistanceMeters: number;
  totalCoinsEarned: number;
  totalXpEarned: number;
  mileageMeters: number;
  cleanRaces: number;
  stuntScore: number;
}

export interface DailyRewardState {
  lastClaimDateKey: string | null;
  streak: number;
}

export interface MissionState {
  id: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyMissionsState {
  dateKey: string;
  missions: MissionState[];
}

export interface WeeklyChallengeState {
  weekKey: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
}

export interface SaveData {
  version: number;
  profile: {
    name: string;
    gender: 'male' | 'female' | 'unspecified';
    onboarded: boolean;
    level: number;
    xp: number;
    coins: number;
    trophies: number;
  };
  garage: {
    ownedCarIds: string[];
    selectedCarId: string;
    upgrades: Record<string, CarUpgradeState>;
    customization: Record<string, CustomizationState>;
    /** keyed by `${carId}__${slot}` -> purchased option ids for that slot */
    ownedCustomizationOptions: Record<string, string[]>;
  };
  unlockedTrackIds: string[];
  selectedTrackId: string;
  statistics: PlayerStatistics;
  achievements: { unlockedIds: string[] };
  dailyReward: DailyRewardState;
  dailyMissions: DailyMissionsState;
  weeklyChallenge: WeeklyChallengeState;
  lapRecords: Record<string, RaceRecord>; // trackId -> best times
  careerProgress: { completedStageIds: string[] };
}

export const SAVE_VERSION = 1;

export function createDefaultSave(): SaveData {
  const defaultCarId = getDefaultCarId();
  return {
    version: SAVE_VERSION,
    profile: { name: 'Racer', gender: 'unspecified', onboarded: false, level: 1, xp: 0, coins: 5000, trophies: 0 },
    garage: {
      ownedCarIds: [defaultCarId],
      selectedCarId: defaultCarId,
      upgrades: { [defaultCarId]: createStockUpgradeState() },
      customization: { [defaultCarId]: createDefaultCustomization() },
      ownedCustomizationOptions: {},
    },
    unlockedTrackIds: [getDefaultTrackId()],
    selectedTrackId: getDefaultTrackId(),
    statistics: {
      wins: 0, losses: 0, totalRaces: 0, driftDistanceMeters: 0,
      totalCoinsEarned: 0, totalXpEarned: 0, mileageMeters: 0, cleanRaces: 0, stuntScore: 0,
    },
    achievements: { unlockedIds: [] },
    dailyReward: { lastClaimDateKey: null, streak: 0 },
    dailyMissions: { dateKey: '', missions: [] },
    weeklyChallenge: { weekKey: '', progress: 0, target: 3, completed: false, claimed: false },
    lapRecords: {},
    careerProgress: { completedStageIds: [] },
  };
}
