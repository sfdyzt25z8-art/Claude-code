import { saveManager } from '../save/SaveManager';
import { economyManager } from './EconomyManager';
import type { MissionState } from '../save/SaveSchema';
import { seededRng, dailySeed } from '../utils/RNG';

export interface MissionTemplate {
  id: string;
  label: string;
  eventType: MissionEventType;
  target: number;
  rewardCoins: number;
  rewardXp: number;
}

export type MissionEventType = 'win' | 'finishRace' | 'earnCoins' | 'driftMeters' | 'useNitro' | 'cleanRace' | 'stunt';

const MISSION_POOL: MissionTemplate[] = [
  { id: 'win_1', label: 'Win 1 race', eventType: 'win', target: 1, rewardCoins: 300, rewardXp: 150 },
  { id: 'finish_3', label: 'Finish 3 races', eventType: 'finishRace', target: 3, rewardCoins: 250, rewardXp: 120 },
  { id: 'finish_5', label: 'Finish 5 races', eventType: 'finishRace', target: 5, rewardCoins: 400, rewardXp: 200 },
  { id: 'earn_500', label: 'Earn 500 coins racing', eventType: 'earnCoins', target: 500, rewardCoins: 150, rewardXp: 100 },
  { id: 'drift_300', label: 'Drift 300 meters total', eventType: 'driftMeters', target: 300, rewardCoins: 200, rewardXp: 120 },
  { id: 'drift_1000', label: 'Drift 1,000 meters total', eventType: 'driftMeters', target: 1000, rewardCoins: 350, rewardXp: 180 },
  { id: 'nitro_10', label: 'Use nitro 10 times', eventType: 'useNitro', target: 10, rewardCoins: 220, rewardXp: 110 },
  { id: 'clean_2', label: 'Finish 2 races without crashing', eventType: 'cleanRace', target: 2, rewardCoins: 300, rewardXp: 150 },
  { id: 'stunt_500', label: 'Score 500 stunt points', eventType: 'stunt', target: 500, rewardCoins: 260, rewardXp: 130 },
];

function dateKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
}

function weekKey(date: Date = new Date()): string {
  const firstDay = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const days = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
  const week = Math.ceil((days + firstDay.getUTCDay() + 1) / 7);
  return `${date.getUTCFullYear()}-W${week}`;
}

const DAILY_LOGIN_REWARDS = [100, 150, 200, 300, 400, 550, 1000]; // day 1..7 (coins)

/** Handles daily login streaks, rotating daily missions, and a weekly challenge. */
export class LiveOpsManager {
  ensureFreshMissions(): void {
    const today = dateKey();
    const state = saveManager.getState();
    if (state.dailyMissions.dateKey === today && state.dailyMissions.missions.length > 0) return;

    const rng = seededRng(dailySeed());
    const shuffled = [...MISSION_POOL].sort(() => rng() - 0.5).slice(0, 3);
    const missions: MissionState[] = shuffled.map((t) => ({
      id: t.id, progress: 0, target: t.target, completed: false, claimed: false,
    }));
    saveManager.mutate((d) => {
      d.dailyMissions = { dateKey: today, missions };
    });

    const wk = weekKey();
    if (state.weeklyChallenge.weekKey !== wk) {
      saveManager.mutate((d) => {
        d.weeklyChallenge = { weekKey: wk, progress: 0, target: 5, completed: false, claimed: false };
      });
    }
  }

  getTodayMissions(): { template: MissionTemplate; state: MissionState }[] {
    const state = saveManager.getState();
    return state.dailyMissions.missions
      .map((m) => ({ template: MISSION_POOL.find((t) => t.id === m.id)!, state: m }))
      .filter((m) => m.template);
  }

  recordEvent(type: MissionEventType, amount: number): void {
    this.ensureFreshMissions();
    saveManager.mutate((d) => {
      for (const mission of d.dailyMissions.missions) {
        const template = MISSION_POOL.find((t) => t.id === mission.id);
        if (!template || template.eventType !== type || mission.completed) continue;
        mission.progress = Math.min(mission.target, mission.progress + amount);
        if (mission.progress >= mission.target) mission.completed = true;
      }
      if (type === 'win') {
        d.weeklyChallenge.progress = Math.min(d.weeklyChallenge.target, d.weeklyChallenge.progress + amount);
        if (d.weeklyChallenge.progress >= d.weeklyChallenge.target) d.weeklyChallenge.completed = true;
      }
    });
  }

  claimMission(missionId: string): { success: boolean; coins: number; xp: number } {
    const state = saveManager.getState();
    const mission = state.dailyMissions.missions.find((m) => m.id === missionId);
    const template = MISSION_POOL.find((t) => t.id === missionId);
    if (!mission || !template || !mission.completed || mission.claimed) return { success: false, coins: 0, xp: 0 };
    saveManager.mutate((d) => {
      const m = d.dailyMissions.missions.find((mm) => mm.id === missionId);
      if (m) m.claimed = true;
    });
    economyManager.addCoins(template.rewardCoins);
    economyManager.addXp(template.rewardXp);
    return { success: true, coins: template.rewardCoins, xp: template.rewardXp };
  }

  claimWeeklyChallenge(): { success: boolean; coins: number } {
    const state = saveManager.getState();
    if (!state.weeklyChallenge.completed || state.weeklyChallenge.claimed) return { success: false, coins: 0 };
    saveManager.mutate((d) => {
      d.weeklyChallenge.claimed = true;
    });
    const coins = 2500;
    economyManager.addCoins(coins);
    return { success: true, coins };
  }

  getDailyLoginStatus(): { canClaim: boolean; streak: number; nextRewardCoins: number } {
    const state = saveManager.getState();
    const today = dateKey();
    const canClaim = state.dailyReward.lastClaimDateKey !== today;
    const streakIndex = Math.min(6, state.dailyReward.streak);
    return { canClaim, streak: state.dailyReward.streak, nextRewardCoins: DAILY_LOGIN_REWARDS[streakIndex] };
  }

  claimDailyLogin(): { success: boolean; coins: number; streak: number } {
    const state = saveManager.getState();
    const today = dateKey();
    if (state.dailyReward.lastClaimDateKey === today) return { success: false, coins: 0, streak: state.dailyReward.streak };

    const yesterday = dateKey(new Date(Date.now() - 86400000));
    const continuedStreak = state.dailyReward.lastClaimDateKey === yesterday;
    const newStreak = continuedStreak ? (state.dailyReward.streak + 1) % 7 : 0;
    const coins = DAILY_LOGIN_REWARDS[newStreak];

    saveManager.mutate((d) => {
      d.dailyReward = { lastClaimDateKey: today, streak: newStreak };
    });
    economyManager.addCoins(coins);
    return { success: true, coins, streak: newStreak };
  }
}

export const liveOpsManager = new LiveOpsManager();
