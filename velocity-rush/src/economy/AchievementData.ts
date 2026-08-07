import type { SaveData } from '../save/SaveSchema';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  check: (state: SaveData) => boolean;
  /** 0-1 progress for UI display even before completion. */
  progress: (state: SaveData) => number;
}

export const ACHIEVEMENT_DATA: AchievementDefinition[] = [
  {
    id: 'first_win', title: 'First Blood', description: 'Win your first race.', icon: 'trophy', rewardCoins: 200,
    check: (s) => s.statistics.wins >= 1, progress: (s) => Math.min(1, s.statistics.wins / 1),
  },
  {
    id: 'checkered_flag_x10', title: 'Podium Regular', description: 'Win 10 races.', icon: 'trophy', rewardCoins: 800,
    check: (s) => s.statistics.wins >= 10, progress: (s) => Math.min(1, s.statistics.wins / 10),
  },
  {
    id: 'champion', title: 'Champion', description: 'Win 50 races.', icon: 'trophy', rewardCoins: 3000,
    check: (s) => s.statistics.wins >= 50, progress: (s) => Math.min(1, s.statistics.wins / 50),
  },
  {
    id: 'road_warrior', title: 'Road Warrior', description: 'Complete 100 races.', icon: 'flag', rewardCoins: 1500,
    check: (s) => s.statistics.totalRaces >= 100, progress: (s) => Math.min(1, s.statistics.totalRaces / 100),
  },
  {
    id: 'level_10', title: 'Rising Star', description: 'Reach player level 10.', icon: 'star', rewardCoins: 500,
    check: (s) => s.profile.level >= 10, progress: (s) => Math.min(1, s.profile.level / 10),
  },
  {
    id: 'level_50', title: 'Veteran Racer', description: 'Reach player level 50.', icon: 'star', rewardCoins: 2500,
    check: (s) => s.profile.level >= 50, progress: (s) => Math.min(1, s.profile.level / 50),
  },
  {
    id: 'max_level', title: 'Living Legend', description: 'Reach player level 100.', icon: 'star', rewardCoins: 10000,
    check: (s) => s.profile.level >= 100, progress: (s) => Math.min(1, s.profile.level / 100),
  },
  {
    id: 'drift_apprentice', title: 'Tire Smoke', description: 'Drift a cumulative 1,000 meters.', icon: 'drift', rewardCoins: 400,
    check: (s) => s.statistics.driftDistanceMeters >= 1000, progress: (s) => Math.min(1, s.statistics.driftDistanceMeters / 1000),
  },
  {
    id: 'drift_legend', title: 'Drift Legend', description: 'Drift a cumulative 25,000 meters.', icon: 'drift', rewardCoins: 3500,
    check: (s) => s.statistics.driftDistanceMeters >= 25000, progress: (s) => Math.min(1, s.statistics.driftDistanceMeters / 25000),
  },
  {
    id: 'clean_streak', title: 'Precision Driver', description: 'Finish 25 races without a crash.', icon: 'shield', rewardCoins: 1200,
    check: (s) => s.statistics.cleanRaces >= 25, progress: (s) => Math.min(1, s.statistics.cleanRaces / 25),
  },
  {
    id: 'coin_hoarder', title: 'Coin Hoarder', description: 'Earn 50,000 coins in total.', icon: 'coin', rewardCoins: 1000,
    check: (s) => s.statistics.totalCoinsEarned >= 50000, progress: (s) => Math.min(1, s.statistics.totalCoinsEarned / 50000),
  },
  {
    id: 'tycoon', title: 'Garage Tycoon', description: 'Earn 250,000 coins in total.', icon: 'coin', rewardCoins: 5000,
    check: (s) => s.statistics.totalCoinsEarned >= 250000, progress: (s) => Math.min(1, s.statistics.totalCoinsEarned / 250000),
  },
  {
    id: 'trophy_case', title: 'Trophy Case', description: 'Earn 50 trophies.', icon: 'trophy', rewardCoins: 1500,
    check: (s) => s.profile.trophies >= 50, progress: (s) => Math.min(1, s.profile.trophies / 50),
  },
  {
    id: 'collector', title: 'Collector', description: 'Own 10 different cars.', icon: 'car', rewardCoins: 1000,
    check: (s) => s.garage.ownedCarIds.length >= 10, progress: (s) => Math.min(1, s.garage.ownedCarIds.length / 10),
  },
  {
    id: 'full_garage', title: 'Full Garage', description: 'Own all 20 cars.', icon: 'car', rewardCoins: 6000,
    check: (s) => s.garage.ownedCarIds.length >= 20, progress: (s) => Math.min(1, s.garage.ownedCarIds.length / 20),
  },
  {
    id: 'explorer', title: 'World Explorer', description: 'Unlock all 15 tracks.', icon: 'map', rewardCoins: 2000,
    check: (s) => s.unlockedTrackIds.length >= 15, progress: (s) => Math.min(1, s.unlockedTrackIds.length / 15),
  },
  {
    id: 'stunt_master', title: 'Stunt Master', description: 'Rack up 10,000 stunt points.', icon: 'star', rewardCoins: 1800,
    check: (s) => s.statistics.stuntScore >= 10000, progress: (s) => Math.min(1, s.statistics.stuntScore / 10000),
  },
  {
    id: 'flawless_champion', title: 'Flawless Champion', description: 'Win 20 races with 20 clean finishes.', icon: 'crown', rewardCoins: 8000,
    check: (s) => s.statistics.wins >= 20 && s.statistics.cleanRaces >= 20,
    progress: (s) => Math.min(1, (s.statistics.wins / 20 + s.statistics.cleanRaces / 20) / 2),
  },
];

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DATA.find((a) => a.id === id);
}
