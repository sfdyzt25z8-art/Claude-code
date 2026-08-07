import { TRACK_DATA } from '../tracks/TrackData';
import type { Difficulty } from '../utils/Constants';
import type { RaceMode } from './RaceTypes';

export interface CareerStage {
  id: string;
  chapter: number;
  title: string;
  trackId: string;
  mode: Extract<RaceMode, 'quickRace' | 'elimination' | 'timeTrial' | 'drift'>;
  difficulty: Difficulty;
  opponentCount: number;
  requiredPosition: number; // finish at or better than this position to pass
  rewardCoins: number;
  rewardXp: number;
}

const MODE_CYCLE: CareerStage['mode'][] = ['quickRace', 'quickRace', 'elimination', 'timeTrial', 'drift'];

function difficultyForIndex(i: number, total: number): Difficulty {
  const t = i / (total - 1);
  if (t < 0.3) return 'easy';
  if (t < 0.62) return 'normal';
  if (t < 0.88) return 'hard';
  return 'expert';
}

/** One career stage per track, ordered by track unlock level, escalating difficulty. */
export const CAREER_STAGES: CareerStage[] = [...TRACK_DATA]
  .sort((a, b) => a.unlockLevel - b.unlockLevel)
  .map((track, i, arr) => {
    const mode = MODE_CYCLE[i % MODE_CYCLE.length];
    const difficulty = difficultyForIndex(i, arr.length);
    return {
      id: `stage_${i + 1}_${track.id}`,
      chapter: Math.floor(i / 5) + 1,
      title: `Stage ${i + 1}: ${track.name}`,
      trackId: track.id,
      mode,
      difficulty,
      opponentCount: mode === 'timeTrial' ? 0 : Math.min(7, 3 + Math.floor(i / 3)),
      requiredPosition: mode === 'elimination' ? 1 : i < 8 ? 3 : i < 13 ? 2 : 1,
      rewardCoins: 400 + i * 180,
      rewardXp: 250 + i * 90,
    };
  });

export function getCareerStage(id: string): CareerStage | undefined {
  return CAREER_STAGES.find((s) => s.id === id);
}

export function getNextStage(completedIds: string[]): CareerStage | undefined {
  return CAREER_STAGES.find((s) => !completedIds.includes(s.id));
}

export function isStageUnlocked(stage: CareerStage, completedIds: string[], playerLevel: number): boolean {
  const index = CAREER_STAGES.findIndex((s) => s.id === stage.id);
  if (index === 0) return true;
  const previous = CAREER_STAGES[index - 1];
  return completedIds.includes(previous.id) || playerLevel >= stage.chapter * 10;
}
